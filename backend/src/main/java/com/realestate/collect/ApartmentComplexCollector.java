package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.repository.ApartmentKaptCodeProjection;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.service.CollectionIssueService;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApartmentComplexCollector {

    private static final String COMPLEX_LIST_PATH = "/1613000/AptListService3/getLegaldongAptList3";
    private static final String BASIS_INFO_PATH = "/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4";
    private static final String KAKAO_KEYWORD_PATH = "/v2/local/search/keyword.json";
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private record BjdInfo(String bjdCode, String eupMyeonDong) {}
    private record DistrictInfo(String sido, String sigungu, List<BjdInfo> bjdList) {}
    private record AptBasisInfo(Integer totalHouseholdCount, Integer completionYear) {}

    private static final Map<String, DistrictInfo> DISTRICTS;

    static {
        DISTRICTS = new HashMap<>();
        DISTRICTS.put("11650", new DistrictInfo("\uC11C\uC6B8\uD2B9\uBCC4\uC2DC", "\uC11C\uCD08\uAD6C", List.of(
                new BjdInfo("1165010100", "\uBC29\uBC30\uB3D9"),
                new BjdInfo("1165010200", "\uC591\uC7AC\uB3D9"),
                new BjdInfo("1165010300", "\uC6B0\uBA74\uB3D9"),
                new BjdInfo("1165010600", "\uC7A0\uC6D0\uB3D9"),
                new BjdInfo("1165010700", "\uBC18\uD3EC\uB3D9"),
                new BjdInfo("1165010800", "\uC11C\uCD08\uB3D9"),
                new BjdInfo("1165010900", "\uB0B4\uACE1\uB3D9"),
                new BjdInfo("1165011100", "\uC6D0\uC9C0\uB3D9")
        )));
        DISTRICTS.put("11710", new DistrictInfo("\uC11C\uC6B8\uD2B9\uBCC4\uC2DC", "\uC1A1\uD30C\uAD6C", List.of(
                new BjdInfo("1171010100", "\uC7A0\uC2E4\uB3D9"),
                new BjdInfo("1171010200", "\uC2E0\uCC9C\uB3D9"),
                new BjdInfo("1171010300", "\uD48D\uB0A9\uB3D9"),
                new BjdInfo("1171010400", "\uC1A1\uD30C\uB3D9"),
                new BjdInfo("1171010500", "\uC11D\uCD0C\uB3D9"),
                new BjdInfo("1171010600", "\uC0BC\uC804\uB3D9"),
                new BjdInfo("1171010700", "\uAC00\uB77D\uB3D9"),
                new BjdInfo("1171010800", "\uBB38\uC815\uB3D9"),
                new BjdInfo("1171010900", "\uC7A5\uC9C0\uB3D9"),
                new BjdInfo("1171011100", "\uBC29\uC774\uB3D9"),
                new BjdInfo("1171011200", "\uC624\uAE08\uB3D9"),
                new BjdInfo("1171011300", "\uAC70\uC5EC\uB3D9"),
                new BjdInfo("1171011400", "\uB9C8\uCC9C\uB3D9")
        )));
        DISTRICTS.put("11680", new DistrictInfo("\uC11C\uC6B8\uD2B9\uBCC4\uC2DC", "\uAC15\uB0A8\uAD6C", List.of(
                new BjdInfo("1168010100", "\uC5ED\uC0BC\uB3D9"),
                new BjdInfo("1168010300", "\uAC1C\uD3EC\uB3D9"),
                new BjdInfo("1168010400", "\uCCAD\uB2F4\uB3D9"),
                new BjdInfo("1168010500", "\uC0BC\uC131\uB3D9"),
                new BjdInfo("1168010600", "\uB300\uCE58\uB3D9"),
                new BjdInfo("1168010700", "\uC2E0\uC0AC\uB3D9"),
                new BjdInfo("1168010800", "\uB17C\uD604\uB3D9"),
                new BjdInfo("1168011000", "\uC555\uAD6C\uC815\uB3D9"),
                new BjdInfo("1168011100", "\uC138\uACE1\uB3D9"),
                new BjdInfo("1168011200", "\uC790\uACE1\uB3D9"),
                new BjdInfo("1168011300", "\uC728\uD604\uB3D9"),
                new BjdInfo("1168011400", "\uC77C\uC6D0\uB3D9"),
                new BjdInfo("1168011500", "\uC218\uC11C\uB3D9"),
                new BjdInfo("1168011800", "\uB3C4\uACE1\uB3D9")
        )));
        DISTRICTS.put("11440", new DistrictInfo("\uC11C\uC6B8\uD2B9\uBCC4\uC2DC", "\uB9C8\uD3EC\uAD6C", List.of(
                new BjdInfo("1144010100", "\uC544\uD604\uB3D9"),
                new BjdInfo("1144010200", "\uACF5\uB355\uB3D9"),
                new BjdInfo("1144010300", "\uC2E0\uACF5\uB355\uB3D9"),
                new BjdInfo("1144010400", "\uB3C4\uD654\uB3D9"),
                new BjdInfo("1144010500", "\uC6A9\uAC15\uB3D9"),
                new BjdInfo("1144010600", "\uD1A0\uC815\uB3D9"),
                new BjdInfo("1144010700", "\uB9C8\uD3EC\uB3D9"),
                new BjdInfo("1144010800", "\uB300\uD765\uB3D9"),
                new BjdInfo("1144010900", "\uC5FC\uB9AC\uB3D9"),
                new BjdInfo("1144011000", "\uB178\uACE0\uC0B0\uB3D9"),
                new BjdInfo("1144011100", "\uC2E0\uC218\uB3D9"),
                new BjdInfo("1144011200", "\uD604\uC11D\uB3D9"),
                new BjdInfo("1144011400", "\uCC3D\uC804\uB3D9"),
                new BjdInfo("1144011500", "\uC0C1\uC218\uB3D9"),
                new BjdInfo("1144011600", "\uD558\uC911\uB3D9"),
                new BjdInfo("1144011700", "\uC2E0\uC815\uB3D9"),
                new BjdInfo("1144012000", "\uC11C\uAD50\uB3D9"),
                new BjdInfo("1144012200", "\uD569\uC815\uB3D9"),
                new BjdInfo("1144012300", "\uB9DD\uC6D0\uB3D9"),
                new BjdInfo("1144012400", "\uC5F0\uB0A8\uB3D9"),
                new BjdInfo("1144012500", "\uC131\uC0B0\uB3D9"),
                new BjdInfo("1144012600", "\uC911\uB3D9"),
                new BjdInfo("1144012700", "\uC0C1\uC554\uB3D9")
        )));
        DISTRICTS.put("41111", new DistrictInfo("\uACBD\uAE30\uB3C4", "\uC218\uC6D0\uC2DC \uC7A5\uC548\uAD6C", List.of(
                new BjdInfo("4111112900", "\uD30C\uC7A5\uB3D9"),
                new BjdInfo("4111113000", "\uC815\uC790\uB3D9"),
                new BjdInfo("4111113100", "\uC774\uBAA9\uB3D9"),
                new BjdInfo("4111113200", "\uC728\uC804\uB3D9"),
                new BjdInfo("4111113300", "\uCC9C\uCC9C\uB3D9"),
                new BjdInfo("4111113400", "\uC601\uD654\uB3D9"),
                new BjdInfo("4111113500", "\uC1A1\uC8FD\uB3D9"),
                new BjdInfo("4111113600", "\uC870\uC6D0\uB3D9"),
                new BjdInfo("4111113700", "\uC5F0\uBB34\uB3D9")
        )));
    }

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;
    private final CollectionIssueService collectionIssueService;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    @Value("${external.kakao.rest-api-key}")
    private String kakaoRestApiKey;

    public String testBasisApiRaw(String kaptCode) {
        return webClient.get()
                .uri(buildBasisInfoUri(kaptCode))
                .exchangeToMono(response -> response.bodyToMono(String.class))
                .block();
    }

    public Set<String> getSupportedSigunguCodes() {
        return DISTRICTS.keySet();
    }

    public String testApiAccess(String sigunguCd) {
        DistrictInfo district = DISTRICTS.get(sigunguCd);
        if (district == null) return "ERROR: Unsupported sigunguCd: " + sigunguCd;
        BjdInfo firstBjd = district.bjdList().get(0);
        try {
            JsonNode response = fetchComplexPage(firstBjd.bjdCode(), 1, 1);
            if (response == null) return "ERROR: empty response";
            JsonNode resultCode = response.path("response").path("header").path("resultCode");
            JsonNode totalCount = response.path("response").path("body").path("totalCount");
            if (!resultCode.isMissingNode() && !"00".equals(resultCode.asText())) {
                String msg = response.path("response").path("header").path("resultMsg").asText("no message");
                return "ERROR: resultCode=" + resultCode.asText() + ", msg=" + msg;
            }
            return "OK: " + firstBjd.eupMyeonDong() + " total=" + totalCount.asInt(0);
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    public Map<String, Integer> collectComplexes(String sigunguCd) {
        return collectComplexes(sigunguCd, null);
    }

    public Map<String, Integer> collectComplexes(String sigunguCd, BiConsumer<String, Map<String, Integer>> progressCallback) {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedApartments", 0);
        stats.put("skippedAlreadyExists", 0);
        stats.put("skippedNoCoordinate", 0);
        stats.put("totalFromApi", 0);
        stats.put("processedCount", 0);

        DistrictInfo district = DISTRICTS.get(sigunguCd);
        if (district == null) throw new IllegalArgumentException("Unsupported sigunguCd: " + sigunguCd);

        for (BjdInfo bjd : district.bjdList()) {
            reportProgress(progressCallback, "Collecting complexes " + district.sigungu() + " " + bjd.eupMyeonDong(), stats);
            collectByBjdCode(bjd, district, stats);
            reportProgress(progressCallback, "Collected complexes " + district.sigungu() + " " + bjd.eupMyeonDong(), stats);
        }

        log.info("Apartment complex collection completed. sigunguCd={}, stats={}", sigunguCd, stats);
        return stats;
    }

    @Transactional
    public int backfillHouseholdCount() {
        List<ApartmentKaptCodeProjection> targets = apartmentRepository.findAllWithKaptCodeAndNullHousehold();
        int updated = 0;
        for (ApartmentKaptCodeProjection proj : targets) {
            AptBasisInfo info = fetchBasisInfo(proj.getKaptCode());
            if (info == null) continue;
            if (info.totalHouseholdCount() != null) {
                apartmentRepository.updateHouseholdCountById(proj.getId(), info.totalHouseholdCount());
            }
            if (info.completionYear() != null) {
                apartmentRepository.updateCompletionYearById(proj.getId(), info.completionYear());
            }
            if (info.totalHouseholdCount() != null || info.completionYear() != null) {
                updated++;
            }
        }
        log.info("Apartment basis info backfill completed. updated={}", updated);
        return updated;
    }

    private void collectByBjdCode(BjdInfo bjd, DistrictInfo district, Map<String, Integer> stats) {
        final int numOfRows = 100;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount = 0;

        do {
            JsonNode response = fetchComplexPage(bjd.bjdCode(), pageNo, numOfRows);
            if (response == null) {
                log.error("Complex API returned empty response. bjdCode={}", bjd.bjdCode());
                recordComplexIssue("API_ERROR", district, bjd, null, null, null, null, "Empty complex API response");
                break;
            }

            String resultCode = response.path("response").path("header").path("resultCode").asText("00");
            if (!"00".equals(resultCode)) {
                String resultMsg = response.path("response").path("header").path("resultMsg").asText();
                log.error("Complex API error. resultCode={}, msg={}", resultCode, resultMsg);
                recordComplexIssue(
                        "API_ERROR",
                        district,
                        bjd,
                        null,
                        null,
                        null,
                        response,
                        "Complex API error: resultCode=" + resultCode + ", msg=" + resultMsg
                );
                break;
            }

            JsonNode body = response.path("response").path("body");
            if (pageNo == 1) {
                totalCount = body.path("totalCount").asInt(0);
                stats.merge("totalFromApi", totalCount, Integer::sum);
            }

            List<JsonNode> items = extractItems(body);
            if (items.isEmpty()) break;

            for (JsonNode item : items) {
                processComplex(item, bjd, district, stats);
            }

            stats.merge("processedCount", items.size(), Integer::sum);
            totalFetched += items.size();
            pageNo++;
            if (items.size() < numOfRows) break;
        } while (totalFetched < totalCount);
    }

    private void processComplex(JsonNode item, BjdInfo bjd, DistrictInfo district, Map<String, Integer> stats) {
        String kaptName = text(item, "kaptName");
        if (kaptName == null || kaptName.isBlank()) {
            recordComplexIssue("INVALID_COMPLEX_PAYLOAD", district, bjd, null, null, null, item, "Missing kaptName");
            return;
        }

        String sido = district.sido();
        String sigungu = district.sigungu();
        String eupMyeonDong = nullOrDefault(text(item, "as3"), bjd.eupMyeonDong());
        String bjdCode = nullOrDefault(text(item, "bjdCode"), bjd.bjdCode());

        if (apartmentRepository.findFirstByComplexNameAndSigungu(kaptName, sigungu).isPresent()) {
            stats.computeIfPresent("skippedAlreadyExists", (k, v) -> v + 1);
            return;
        }

        Point point = geocode(sido, sigungu, eupMyeonDong, kaptName);
        if (point == null) {
            stats.computeIfPresent("skippedNoCoordinate", (k, v) -> v + 1);
            log.warn("Coordinate lookup failed. sigungu={}, eupMyeonDong={}, kaptName={}", sigungu, eupMyeonDong, kaptName);
            collectionIssueService.recordIssue(
                    "APARTMENT_COMPLEX",
                    "NO_COORDINATE",
                    sigungu,
                    eupMyeonDong,
                    kaptName,
                    bjdCode,
                    null,
                    item,
                    "No coordinate from Kakao keyword search"
            );
            return;
        }

        String kaptCode = text(item, "kaptCode");
        AptBasisInfo basisInfo = kaptCode != null ? fetchBasisInfo(kaptCode) : null;

        Apartment apt = Apartment.create(
                kaptName,
                buildAddress(sido, sigungu, eupMyeonDong),
                sido,
                sigungu,
                eupMyeonDong,
                bjdCode,
                point,
                basisInfo != null ? basisInfo.completionYear() : null,
                basisInfo != null ? basisInfo.totalHouseholdCount() : null,
                kaptCode
        );
        apartmentRepository.save(apt);
        stats.computeIfPresent("savedApartments", (k, v) -> v + 1);
        log.debug("Saved apartment complex. sigungu={}, eupMyeonDong={}, kaptName={}", sigungu, eupMyeonDong, kaptName);
    }

    private JsonNode fetchComplexPage(String bjdCode, int pageNo, int numOfRows) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https").host("apis.data.go.kr").path(COMPLEX_LIST_PATH)
                        .queryParam("serviceKey", publicDataServiceKey)
                        .queryParam("bjdCode", bjdCode)
                        .queryParam("numOfRows", numOfRows)
                        .queryParam("pageNo", pageNo)
                        .queryParam("_type", "json")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
    }

    private AptBasisInfo fetchBasisInfo(String kaptCode) {
        try {
            JsonNode response = webClient.get()
                    .uri(buildBasisInfoUri(kaptCode))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            if (response == null) return null;

            JsonNode item = response.path("response").path("body").path("item");
            Integer householdCount = parseJsonIntOrNull(item.path("kaptdaCnt"));
            Integer completionYear = parseYearFromDate(item.path("kaptUsedate").asText(null));
            return new AptBasisInfo(householdCount, completionYear);
        } catch (Exception e) {
            log.warn("Apartment basis info lookup failed. kaptCode={}: {}", kaptCode, e.getMessage());
            return null;
        }
    }

    private Point geocode(String sido, String sigungu, String eupMyeonDong, String kaptName) {
        String fullKeyword = String.join(" ",
                nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(kaptName)).trim();
        Point p = searchByKeyword(fullKeyword);
        if (p != null) return p;

        return searchByKeyword(nullToEmpty(sigungu) + " " + nullToEmpty(kaptName));
    }

    private Point searchByKeyword(String query) {
        if (query == null || query.isBlank()) return null;
        JsonNode response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https").host("dapi.kakao.com").path(KAKAO_KEYWORD_PATH)
                        .queryParam("query", query).queryParam("size", 1).build())
                .header("Authorization", "KakaoAK " + kakaoRestApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
        return extractPoint(response);
    }

    private URI buildBasisInfoUri(String kaptCode) {
        return UriComponentsBuilder.newInstance()
                .scheme("https").host("apis.data.go.kr")
                .path(BASIS_INFO_PATH)
                .queryParam("serviceKey", publicDataServiceKey)
                .queryParam("kaptCode", kaptCode)
                .queryParam("_type", "json")
                .encode()
                .build()
                .toUri();
    }

    private List<JsonNode> extractItems(JsonNode body) {
        List<JsonNode> result = new ArrayList<>();
        JsonNode items = body.path("items");
        if (items.isArray()) {
            items.forEach(result::add);
            return result;
        }
        JsonNode item = items.path("item");
        if (item.isArray()) {
            item.forEach(result::add);
        } else if (!item.isMissingNode() && !item.isNull()) {
            result.add(item);
        }
        return result;
    }

    private Point extractPoint(JsonNode response) {
        JsonNode first = response == null ? null : response.path("documents").path(0);
        if (first == null || first.isMissingNode() || first.isNull()) return null;
        String xStr = first.path("x").asText(null);
        String yStr = first.path("y").asText(null);
        if (xStr == null || yStr == null) return null;
        try {
            return GEOMETRY_FACTORY.createPoint(new Coordinate(Double.parseDouble(xStr), Double.parseDouble(yStr)));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void recordComplexIssue(
            String issueType,
            DistrictInfo district,
            BjdInfo bjd,
            String aptName,
            String lawdCd,
            String dealYmd,
            JsonNode rawPayload,
            String message
    ) {
        collectionIssueService.recordIssue(
                "APARTMENT_COMPLEX",
                issueType,
                district.sigungu(),
                bjd.eupMyeonDong(),
                aptName,
                lawdCd == null ? bjd.bjdCode() : lawdCd,
                dealYmd,
                rawPayload,
                message
        );
    }

    private void reportProgress(BiConsumer<String, Map<String, Integer>> progressCallback, String message, Map<String, Integer> stats) {
        if (progressCallback != null) {
            progressCallback.accept(message, Map.copyOf(stats));
        }
    }

    private String buildAddress(String sido, String sigungu, String eupMyeonDong) {
        return String.join(" ", nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong)).trim();
    }

    private String text(JsonNode node, String field) {
        if (node == null) return null;
        String value = node.path(field).asText(null);
        return value == null ? null : value.trim();
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private String nullOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private Integer parseJsonIntOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        int value = node.asInt();
        return value == 0 ? null : value;
    }

    private Integer parseYearFromDate(String value) {
        if (value == null || value.length() < 4) return null;
        try {
            return Integer.parseInt(value.substring(0, 4));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
