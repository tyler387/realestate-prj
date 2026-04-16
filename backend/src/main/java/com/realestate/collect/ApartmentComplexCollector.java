package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.repository.ApartmentRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * 국토교통부 공동주택 단지 목록제공 서비스를 이용해 아파트 단지 목록을 수집.
 * 법정동코드(bjdCode) 단위로 조회하여 전체 단지를 가져옴.
 *
 * API: https://apis.data.go.kr/1611000/AptListService/getLegaldongAptList
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApartmentComplexCollector {

    private static final String COMPLEX_LIST_PATH = "/1613000/AptListService3/getLegaldongAptList3";
    private static final String KAKAO_KEYWORD_PATH = "/v2/local/search/keyword.json";
    private static final String KAKAO_ADDRESS_PATH = "/v2/local/search/address.json";
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private record BjdInfo(String bjdCode, String eupMyeonDong) {}
    private record DistrictInfo(String sido, String sigungu, List<BjdInfo> bjdList) {}

    /** 시군구코드 → (시도, 시군구, 법정동 목록) */
    private static final Map<String, DistrictInfo> DISTRICTS;
    static {
        DISTRICTS = new HashMap<>();
        DISTRICTS.put("11650", new DistrictInfo("서울특별시", "서초구", List.of(
            new BjdInfo("1165010100", "서초동"),
            new BjdInfo("1165010200", "잠원동"),
            new BjdInfo("1165010400", "반포동"),
            new BjdInfo("1165010500", "방배동"),
            new BjdInfo("1165010600", "양재동"),
            new BjdInfo("1165010700", "내곡동")
        )));
        DISTRICTS.put("11710", new DistrictInfo("서울특별시", "송파구", List.of(
            new BjdInfo("1171010100", "풍납동"),
            new BjdInfo("1171010200", "거여동"),
            new BjdInfo("1171010300", "마천동"),
            new BjdInfo("1171010400", "방이동"),
            new BjdInfo("1171010500", "오금동"),
            new BjdInfo("1171010600", "가락동"),
            new BjdInfo("1171010700", "문정동"),
            new BjdInfo("1171010800", "장지동"),
            new BjdInfo("1171011000", "잠실동"),
            new BjdInfo("1171011100", "신천동"),
            new BjdInfo("1171011200", "삼전동"),
            new BjdInfo("1171011400", "석촌동"),
            new BjdInfo("1171011500", "송파동")
        )));
        DISTRICTS.put("11680", new DistrictInfo("서울특별시", "강남구", List.of(
            new BjdInfo("1168010100", "신사동"),
            new BjdInfo("1168010200", "압구정동"),
            new BjdInfo("1168010300", "청담동"),
            new BjdInfo("1168010400", "삼성동"),
            new BjdInfo("1168010500", "대치동"),
            new BjdInfo("1168010700", "도곡동"),
            new BjdInfo("1168010800", "역삼동"),
            new BjdInfo("1168010900", "개포동"),
            new BjdInfo("1168011000", "일원동"),
            new BjdInfo("1168011100", "수서동"),
            new BjdInfo("1168011200", "세곡동")
        )));
        DISTRICTS.put("11440", new DistrictInfo("서울특별시", "마포구", List.of(
            new BjdInfo("1144010100", "공덕동"),
            new BjdInfo("1144010200", "아현동"),
            new BjdInfo("1144010300", "도화동"),
            new BjdInfo("1144010400", "마포동"),
            new BjdInfo("1144010500", "대흥동"),
            new BjdInfo("1144010600", "신수동"),
            new BjdInfo("1144010700", "서교동"),
            new BjdInfo("1144010800", "합정동"),
            new BjdInfo("1144010900", "망원동"),
            new BjdInfo("1144011000", "연남동"),
            new BjdInfo("1144011200", "성산동"),
            new BjdInfo("1144011400", "상암동")
        )));
        DISTRICTS.put("41111", new DistrictInfo("경기도", "수원시 장안구", List.of(
            new BjdInfo("4111110300", "정자동"),
            new BjdInfo("4111110400", "영화동"),
            new BjdInfo("4111110500", "율전동"),
            new BjdInfo("4111110600", "파장동"),
            new BjdInfo("4111110700", "이목동"),
            new BjdInfo("4111110800", "우만동"),
            new BjdInfo("4111110900", "조원동")
        )));
    }

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    @Value("${external.kakao.rest-api-key}")
    private String kakaoRestApiKey;

    /**
     * API 접근 가능 여부 테스트 (해당 구의 첫 번째 법정동으로 확인).
     */
    public String testApiAccess(String sigunguCd) {
        DistrictInfo district = DISTRICTS.get(sigunguCd);
        if (district == null) return "ERROR: 지원하지 않는 sigunguCd: " + sigunguCd;
        BjdInfo firstBjd = district.bjdList().get(0);
        try {
            JsonNode response = fetchComplexPage(firstBjd.bjdCode(), 1, 1);
            if (response == null) return "ERROR: 응답 없음 (null)";
            JsonNode resultCode = response.path("response").path("header").path("resultCode");
            JsonNode totalCount = response.path("response").path("body").path("totalCount");
            if (!resultCode.isMissingNode() && !"00".equals(resultCode.asText())) {
                String msg = response.path("response").path("header").path("resultMsg").asText("알 수 없음");
                return "ERROR: resultCode=" + resultCode.asText() + ", msg=" + msg;
            }
            return "OK: " + firstBjd.eupMyeonDong() + " 총 " + totalCount.asInt(0) + "개 단지 확인됨";
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * 특정 시군구의 전체 아파트 단지를 수집하여 apartment 테이블에 저장.
     * 법정동 단위로 순회하며 수집.
     */
    public Map<String, Integer> collectComplexes(String sigunguCd) {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("savedApartments", 0);
        stats.put("skippedAlreadyExists", 0);
        stats.put("skippedNoCoordinate", 0);
        stats.put("totalFromApi", 0);

        DistrictInfo district = DISTRICTS.get(sigunguCd);
        if (district == null) throw new IllegalArgumentException("Unsupported sigunguCd: " + sigunguCd);

        for (BjdInfo bjd : district.bjdList()) {
            collectByBjdCode(bjd, sigunguCd, district, stats);
        }

        log.info("단지 수집 완료 sigunguCd={}: {}", sigunguCd, stats);
        return stats;
    }

    private void collectByBjdCode(BjdInfo bjd, String sigunguCd, DistrictInfo district, Map<String, Integer> stats) {
        final int numOfRows = 100;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount;

        do {
            JsonNode response = fetchComplexPage(bjd.bjdCode(), pageNo, numOfRows);
            if (response == null) {
                log.error("API 응답 없음 bjdCode={}", bjd.bjdCode());
                break;
            }

            String resultCode = response.path("response").path("header").path("resultCode").asText("00");
            if (!"00".equals(resultCode)) {
                String resultMsg = response.path("response").path("header").path("resultMsg").asText();
                log.error("API 오류: resultCode={}, msg={}", resultCode, resultMsg);
                break;
            }

            JsonNode body = response.path("response").path("body");
            totalCount = body.path("totalCount").asInt(0);
            stats.merge("totalFromApi", totalCount, Integer::sum);

            List<JsonNode> items = extractItems(body);
            if (items.isEmpty()) break;

            for (JsonNode item : items) {
                processComplex(item, bjd, district, stats);
            }

            totalFetched += items.size();
            pageNo++;
            if (items.size() < numOfRows) break;

        } while (totalFetched < totalCount);
    }

    private void processComplex(JsonNode item, BjdInfo bjd, DistrictInfo district, Map<String, Integer> stats) {
        String kaptName = text(item, "kaptName");
        if (kaptName == null || kaptName.isBlank()) return;

        // API 응답에서 실제 지역 정보 추출 (없으면 DISTRICTS 기본값 사용)
        String sido     = nullOrDefault(text(item, "as1"), district.sido());
        String sigungu  = nullOrDefault(text(item, "as2"), district.sigungu());
        String eupMyeonDong = nullOrDefault(text(item, "as3"), bjd.eupMyeonDong());
        String bjdCode  = nullOrDefault(text(item, "bjdCode"), bjd.bjdCode());

        if (apartmentRepository.findFirstByComplexNameAndSigungu(kaptName, sigungu).isPresent()) {
            stats.computeIfPresent("skippedAlreadyExists", (k, v) -> v + 1);
            return;
        }

        Point point = geocode(sido, sigungu, eupMyeonDong, kaptName);
        if (point == null) {
            stats.computeIfPresent("skippedNoCoordinate", (k, v) -> v + 1);
            log.warn("좌표 조회 실패: {}/{}/{}", sigungu, eupMyeonDong, kaptName);
            return;
        }

        String roadAddress = buildFallbackAddress(sido, sigungu, eupMyeonDong);

        Integer completionYear = parseIntOrNull(text(item, "kaptBldYy"));
        Integer totalHouseholdCount = parseIntOrNull(text(item, "kaptTotHhldCnt"));

        Apartment apt = Apartment.create(
            kaptName,
            roadAddress,
            sido,
            sigungu,
            eupMyeonDong,
            bjdCode,
            point,
            completionYear,
            totalHouseholdCount
        );
        apartmentRepository.save(apt);
        stats.computeIfPresent("savedApartments", (k, v) -> v + 1);
        log.debug("저장: {}/{}/{}", sigungu, eupMyeonDong, kaptName);
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

    private List<JsonNode> extractItems(JsonNode body) {
        List<JsonNode> result = new ArrayList<>();
        JsonNode items = body.path("items");
        // 응답이 items 바로 배열인 경우
        if (items.isArray()) {
            items.forEach(result::add);
            return result;
        }
        // 응답이 items.item 중첩 구조인 경우
        JsonNode item = items.path("item");
        if (item.isArray()) {
            item.forEach(result::add);
        } else if (!item.isMissingNode() && !item.isNull()) {
            result.add(item);
        }
        return result;
    }

    private Point geocode(String sido, String sigungu, String eupMyeonDong, String kaptName) {
        // 1. 전체 키워드 검색 (시도+시군구+동+단지명)
        String fullKeyword = String.join(" ",
            nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(kaptName)).trim();
        Point p = searchByKeyword(fullKeyword);
        if (p != null) return p;

        // 2. 간략 키워드 (시군구+단지명)
        return searchByKeyword(nullToEmpty(sigungu) + " " + nullToEmpty(kaptName));
    }

    private Point searchByKeyword(String query) {
        if (query == null || query.isBlank()) return null;
        JsonNode response = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .scheme("https").host("dapi.kakao.com").path(KAKAO_KEYWORD_PATH)
                .queryParam("query", query).queryParam("size", 1).build())
            .header("Authorization", "KakaoAK " + kakaoRestApiKey)
            .retrieve().bodyToMono(JsonNode.class).block();
        return extractPoint(response);
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

    private String buildFallbackAddress(String sido, String sigungu, String eupMyeonDong) {
        return String.join(" ", nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong)).trim();
    }

    private String text(JsonNode node, String field) {
        if (node == null) return null;
        String v = node.path(field).asText(null);
        return v == null ? null : v.trim();
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private String nullOrDefault(String value, String defaultValue) {
        return (value == null || value.isBlank()) ? defaultValue : value;
    }

    private Integer parseIntOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
