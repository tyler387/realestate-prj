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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealTradeCollector {

    private static final String PUBLIC_DATA_PATH = "/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
    private static final String SEOUL = "서울특별시";
    private static final DateTimeFormatter DEAL_YMD_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    /** 지원되는 lawd_cd 목록 (새 지역 추가 시 여기에도 추가) */
    private static final Map<String, CollectTarget> SUPPORTED_DISTRICTS = Map.of(
        "11650", new CollectTarget("11650", SEOUL, "서초구"),
        "11710", new CollectTarget("11710", SEOUL, "송파구"),
        "11680", new CollectTarget("11680", SEOUL, "강남구"),
        "11440", new CollectTarget("11440", SEOUL, "마포구"),
        "41111", new CollectTarget("41111", "경기도", "수원시 장안구")
    );

    public Map<String, Integer> collectDistrict(String lawdCd, int months) {
        CollectTarget target = SUPPORTED_DISTRICTS.get(lawdCd);
        if (target == null) {
            throw new IllegalArgumentException("Unsupported lawdCd: " + lawdCd);
        }
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedTrades", 0);
        stats.put("skippedNoApartment", 0);
        stats.put("duplicateTrades", 0);

        YearMonth currentMonth = YearMonth.now();
        for (int offset = 0; offset < months; offset++) {
            String dealYmd = currentMonth.minusMonths(offset).format(DEAL_YMD_FORMATTER);
            collectMonthByDistrict(target.lawdCd(), target.sido(), target.sigungu(), dealYmd, stats);
        }
        return stats;
    }

    public Map<String, Integer> collectRecentThreeMonths() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedTrades", 0);
        stats.put("skippedNoApartment", 0);
        stats.put("duplicateTrades", 0);

        YearMonth currentMonth = YearMonth.now();
        for (int monthOffset = 0; monthOffset < 3; monthOffset++) {
            String dealYmd = currentMonth.minusMonths(monthOffset).format(DEAL_YMD_FORMATTER);
            for (CollectTarget target : SUPPORTED_DISTRICTS.values()) {
                collectMonthByDistrict(target.lawdCd(), target.sido(), target.sigungu(), dealYmd, stats);
            }
        }
        return stats;
    }

    private void collectMonthByDistrict(String lawdCd, String sido, String sigungu, String dealYmd, Map<String, Integer> stats) {
        final int numOfRows = 1000;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount = 0;

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
                    saveSingleTrade(node, sigungu, stats);
                    pageItemCount++;
                }
            } else {
                saveSingleTrade(itemNode, sigungu, stats);
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

    private void saveSingleTrade(JsonNode item, String sigungu, Map<String, Integer> stats) {
        String complexName = text(item, "aptNm");
        if (complexName == null || complexName.isBlank()) {
            return;
        }

        Optional<Apartment> found = apartmentRepository.findFirstByComplexNameAndSigungu(complexName, sigungu);
        if (found.isEmpty()) {
            log.warn("apartment 마스터 데이터 없음 — 거래 스킵. sigungu={}, complexName={}", sigungu, complexName);
            stats.computeIfPresent("skippedNoApartment", (k, v) -> v + 1);
            return;
        }
        Apartment apartment = found.get();

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
