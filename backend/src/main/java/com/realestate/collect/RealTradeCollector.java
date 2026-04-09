package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.entity.RealTrade;
import com.realestate.domain.entity.TradeType;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.RealTradeRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealTradeCollector {

    private static final String PUBLIC_DATA_PATH = "/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
    private static final String KAKAO_ADDRESS_PATH = "/v2/local/search/address.json";
    private static final String KAKAO_KEYWORD_PATH = "/v2/local/search/keyword.json";
    private static final String SEOUL = "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC";
    private static final DateTimeFormatter DEAL_YMD_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    @Value("${external.kakao.rest-api-key}")
    private String kakaoRestApiKey;

    public Map<String, Integer> collectRecentThreeMonths() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedApartments", 0);
        stats.put("savedTrades", 0);
        stats.put("skippedNoCoordinate", 0);
        stats.put("duplicateTrades", 0);

        List<CollectTarget> targets = List.of(
                new CollectTarget("11650", SEOUL, "\uC11C\uCD08\uAD6C"),
                new CollectTarget("11680", SEOUL, "\uAC15\uB0A8\uAD6C"),
                new CollectTarget("11440", SEOUL, "\uB9C8\uD3EC\uAD6C"),
                new CollectTarget("41111", "\uACBD\uAE30\uB3C4", "\uC218\uC6D0\uC2DC \uC7A5\uC548\uAD6C")
        );

        YearMonth currentMonth = YearMonth.now();
        for (int monthOffset = 0; monthOffset < 3; monthOffset++) {
            YearMonth targetMonth = currentMonth.minusMonths(monthOffset);
            String dealYmd = targetMonth.format(DEAL_YMD_FORMATTER);
            for (CollectTarget target : targets) {
                collectMonthByDistrict(target.lawdCd(), target.sido(), target.sigungu(), dealYmd, stats);
            }
        }
        return stats;
    }

    private void collectMonthByDistrict(String lawdCd, String sido, String sigungu, String dealYmd, Map<String, Integer> stats) {
        final int numOfRows = 1000;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount;

        do {
            final int currentPage = pageNo;
            JsonNode response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("apis.data.go.kr")
                            .path(PUBLIC_DATA_PATH)
                            .queryParam("serviceKey", publicDataServiceKey)
                            .queryParam("LAWD_CD", lawdCd)
                            .queryParam("DEAL_YMD", dealYmd)
                            .queryParam("numOfRows", numOfRows)
                            .queryParam("pageNo", currentPage)
                            .queryParam("_type", "json")
                            .build())
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            JsonNode body = response == null ? null : response.path("response").path("body");
            totalCount = body == null ? 0 : body.path("totalCount").asInt(0);

            JsonNode itemNode = extractItemNode(response);
            if (itemNode == null || itemNode.isMissingNode() || itemNode.isNull()) {
                break;
            }

            int pageItemCount = 0;
            if (itemNode.isArray()) {
                for (JsonNode node : itemNode) {
                    saveSingleTrade(node, lawdCd, sido, sigungu, stats);
                    pageItemCount++;
                }
            } else {
                saveSingleTrade(itemNode, lawdCd, sido, sigungu, stats);
                pageItemCount = 1;
            }

            totalFetched += pageItemCount;
            pageNo++;

            if (pageItemCount < numOfRows) {
                break;
            }
        } while (totalFetched < totalCount);
    }

    private JsonNode extractItemNode(JsonNode response) {
        if (response == null) {
            return null;
        }
        return response.path("response").path("body").path("items").path("item");
    }

    private void saveSingleTrade(JsonNode item, String lawdCd, String sido, String sigungu, Map<String, Integer> stats) {
        String complexName = text(item, "aptNm");
        String eupMyeonDong = text(item, "umdNm");
        String jibun = text(item, "jibun");
        Integer completionYear = intValue(item, "buildYear");

        if (complexName == null || complexName.isBlank()) {
            return;
        }

        Apartment apartment = apartmentRepository.findFirstByComplexNameAndSigungu(complexName, sigungu)
                .orElseGet(() -> {
                    Point point = geocodeWithKakao(sido, sigungu, eupMyeonDong, complexName, jibun);
                    if (point == null) {
                        stats.computeIfPresent("skippedNoCoordinate", (k, v) -> v + 1);
                        log.warn("Coordinate geocoding failed. skip apartment. sido={}, sigungu={}, eupMyeonDong={}, complexName={}", sido, sigungu, eupMyeonDong, complexName);
                        return null;
                    }

                    Apartment created = Apartment.create(
                            complexName,
                            buildAddress(sido, sigungu, eupMyeonDong, jibun),
                            sido,
                            sigungu,
                            eupMyeonDong,
                            lawdCd,
                            point,
                            completionYear,
                            null
                    );
                    Apartment saved = apartmentRepository.save(created);
                    stats.computeIfPresent("savedApartments", (k, v) -> v + 1);
                    return saved;
                });

        if (apartment == null) {
            return;
        }

        Integer tradeYear = intValue(item, "dealYear");
        Integer tradeMonth = intValue(item, "dealMonth");
        Integer tradeDay = intValue(item, "dealDay");
        if (tradeYear == null || tradeMonth == null || tradeDay == null) {
            return;
        }

        LocalDate tradeDate;
        try {
            tradeDate = LocalDate.of(tradeYear, tradeMonth, tradeDay);
        } catch (RuntimeException ex) {
            log.warn("Trade date parse failed. year={}, month={}, day={}, complexName={}", tradeYear, tradeMonth, tradeDay, complexName);
            return;
        }

        RealTrade trade = RealTrade.create(
                apartment,
                TradeType.SALE,
                tradeDate,
                tradeYear,
                tradeMonth,
                decimalValue(item, "excluUseAr"),
                parseTradeAmount(text(item, "dealAmount")),
                intValue(item, "floor"),
                false
        );

        try {
            realTradeRepository.saveAndFlush(trade);
            stats.computeIfPresent("savedTrades", (k, v) -> v + 1);
        } catch (DataIntegrityViolationException e) {
            stats.computeIfPresent("duplicateTrades", (k, v) -> v + 1);
        }
    }

    private Point geocodeWithKakao(String sido, String sigungu, String eupMyeonDong, String complexName, String jibun) {
        String fullKeyword = String.join(" ", nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(complexName)).trim();
        String compactKeyword = String.join(" ", nullToEmpty(sigungu), sanitizeComplexName(complexName)).trim();
        String addressQuery = String.join(" ", nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(jibun)).trim();

        Point byKeyword = searchPointWithKakaoKeyword(fullKeyword);
        if (byKeyword != null) {
            return byKeyword;
        }

        Point byAddress = searchPointWithKakaoAddress(addressQuery);
        if (byAddress != null) {
            return byAddress;
        }

        return searchPointWithKakaoKeyword(compactKeyword);
    }

    private Point searchPointWithKakaoKeyword(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        JsonNode response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("dapi.kakao.com")
                        .path(KAKAO_KEYWORD_PATH)
                        .queryParam("query", query)
                        .queryParam("size", 1)
                        .build())
                .header("Authorization", "KakaoAK " + kakaoRestApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        return extractPointFromKakaoDocuments(response);
    }

    private Point searchPointWithKakaoAddress(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        JsonNode response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("dapi.kakao.com")
                        .path(KAKAO_ADDRESS_PATH)
                        .queryParam("query", query)
                        .build())
                .header("Authorization", "KakaoAK " + kakaoRestApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        return extractPointFromKakaoDocuments(response);
    }

    private Point extractPointFromKakaoDocuments(JsonNode response) {
        JsonNode first = response == null ? null : response.path("documents").path(0);
        if (first == null || first.isMissingNode() || first.isNull()) {
            return null;
        }

        Double lng = doubleValue(first, "x");
        Double lat = doubleValue(first, "y");
        if (lng == null || lat == null) {
            return null;
        }

        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }

    private String sanitizeComplexName(String complexName) {
        if (complexName == null) {
            return "";
        }
        String noParentheses = complexName.replaceAll("\\(.*?\\)", " ");
        String normalized = noParentheses.replaceAll("[^0-9a-zA-Z가-힣\\s]", " ");
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private String buildAddress(String sido, String sigungu, String eupMyeonDong, String jibun) {
        return String.join(" ", nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(jibun)).trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String text(JsonNode node, String field) {
        if (node == null || node.path(field).isMissingNode()) {
            return null;
        }
        String value = node.path(field).asText(null);
        return value == null ? null : value.trim();
    }

    private Integer intValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double doubleValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal decimalValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long parseTradeAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record CollectTarget(String lawdCd, String sido, String sigungu) {
    }
}
