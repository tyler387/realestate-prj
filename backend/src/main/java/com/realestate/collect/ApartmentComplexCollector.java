package com.realestate.collect;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.Apartment;
import com.realestate.domain.repository.ApartmentKaptCodeProjection;
import com.realestate.domain.repository.ApartmentRepository;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

/**
 * 아파트 단지 정보 수집기.
 *
 * <p>두 가지 공공데이터 API를 조합하여 아파트 단지 정보를 수집하고 DB에 저장합니다.
 * <ul>
 *   <li>단지 목록: 국토교통부 getLegaldongAptList3 — 법정동 단위로 단지 목록 조회</li>
 *   <li>단지 상세: 국토교통부 getAphusBassInfoV4 — 준공연도·세대수 등 기본정보 조회</li>
 * </ul>
 *
 * <p>좌표는 카카오 키워드 검색 API로 획득하며, 좌표를 못 찾은 단지는 저장하지 않습니다.
 *
 * <p>지원 지역은 하단 {@code DISTRICTS} 맵에 정의되어 있습니다.
 * 새 지역을 추가하려면 시군구코드를 키로, 법정동 목록을 값으로 추가하면 됩니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApartmentComplexCollector {

    // -----------------------------------------------------------------------
    // 공공데이터 API 경로 (host: apis.data.go.kr)
    // -----------------------------------------------------------------------

    /** 법정동 단위 아파트 단지 목록 조회 */
    private static final String COMPLEX_LIST_PATH =
            "/1613000/AptListService3/getLegaldongAptList3";

    /** 단지 기본정보 조회 (준공연도 kaptUsedate, 세대수 kaptdaCnt) */
    private static final String BASIS_INFO_PATH =
            "/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4";

    /** 카카오 키워드 검색 API 경로 (host: dapi.kakao.com) */
    private static final String KAKAO_KEYWORD_PATH = "/v2/local/search/keyword.json";

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    // -----------------------------------------------------------------------
    // 내부 모델
    // -----------------------------------------------------------------------

    /** 법정동 코드와 읍면동명 쌍 */
    private record BjdInfo(String bjdCode, String eupMyeonDong) {}

    /** 시군구 단위 수집 대상 정보 */
    private record DistrictInfo(String sido, String sigungu, List<BjdInfo> bjdList) {}

    /** getAphusBassInfoV4 응답에서 필요한 필드만 담는 값 객체 */
    private record AptBasisInfo(Integer totalHouseholdCount, Integer completionYear) {}

    // -----------------------------------------------------------------------
    // 수집 대상 지역 정의
    // 시군구코드(5자리) → (시도, 시군구, 법정동 목록)
    // 새 지역 추가 시 DISTRICTS.put() 한 줄만 추가하면 됩니다.
    // -----------------------------------------------------------------------
    private static final Map<String, DistrictInfo> DISTRICTS;

    static {
        DISTRICTS = new HashMap<>();
        DISTRICTS.put("11650", new DistrictInfo("서울특별시", "서초구", List.of(
            new BjdInfo("1165010100", "방배동"),
            new BjdInfo("1165010200", "양재동"),
            new BjdInfo("1165010300", "우면동"),
            new BjdInfo("1165010600", "잠원동"),
            new BjdInfo("1165010700", "반포동"),
            new BjdInfo("1165010800", "서초동"),
            new BjdInfo("1165010900", "내곡동"),
            new BjdInfo("1165011100", "신원동")
        )));
        DISTRICTS.put("11710", new DistrictInfo("서울특별시", "송파구", List.of(
            new BjdInfo("1171010100", "잠실동"),
            new BjdInfo("1171010200", "신천동"),
            new BjdInfo("1171010300", "풍납동"),
            new BjdInfo("1171010400", "송파동"),
            new BjdInfo("1171010500", "석촌동"),
            new BjdInfo("1171010600", "삼전동"),
            new BjdInfo("1171010700", "가락동"),
            new BjdInfo("1171010800", "문정동"),
            new BjdInfo("1171010900", "장지동"),
            new BjdInfo("1171011100", "방이동"),
            new BjdInfo("1171011200", "오금동"),
            new BjdInfo("1171011300", "거여동"),
            new BjdInfo("1171011400", "마천동")
        )));
        DISTRICTS.put("11680", new DistrictInfo("서울특별시", "강남구", List.of(
            new BjdInfo("1168010100", "역삼동"),
            new BjdInfo("1168010300", "개포동"),
            new BjdInfo("1168010400", "청담동"),
            new BjdInfo("1168010500", "삼성동"),
            new BjdInfo("1168010600", "대치동"),
            new BjdInfo("1168010700", "신사동"),
            new BjdInfo("1168010800", "논현동"),
            new BjdInfo("1168011000", "압구정동"),
            new BjdInfo("1168011100", "세곡동"),
            new BjdInfo("1168011200", "자곡동"),
            new BjdInfo("1168011300", "율현동"),
            new BjdInfo("1168011400", "일원동"),
            new BjdInfo("1168011500", "수서동"),
            new BjdInfo("1168011800", "도곡동")
        )));
        DISTRICTS.put("11440", new DistrictInfo("서울특별시", "마포구", List.of(
            new BjdInfo("1144010100", "아현동"),
            new BjdInfo("1144010200", "공덕동"),
            new BjdInfo("1144010300", "신공덕동"),
            new BjdInfo("1144010400", "도화동"),
            new BjdInfo("1144010500", "용강동"),
            new BjdInfo("1144010600", "토정동"),
            new BjdInfo("1144010700", "마포동"),
            new BjdInfo("1144010800", "대흥동"),
            new BjdInfo("1144010900", "염리동"),
            new BjdInfo("1144011000", "노고산동"),
            new BjdInfo("1144011100", "신수동"),
            new BjdInfo("1144011200", "현석동"),
            new BjdInfo("1144011400", "창전동"),
            new BjdInfo("1144011500", "상수동"),
            new BjdInfo("1144011600", "하중동"),
            new BjdInfo("1144011700", "신정동"),
            new BjdInfo("1144012000", "서교동"),
            new BjdInfo("1144012200", "합정동"),
            new BjdInfo("1144012300", "망원동"),
            new BjdInfo("1144012400", "연남동"),
            new BjdInfo("1144012500", "성산동"),
            new BjdInfo("1144012600", "중동"),
            new BjdInfo("1144012700", "상암동")
        )));
        DISTRICTS.put("41111", new DistrictInfo("경기도", "수원시 장안구", List.of(
            new BjdInfo("4111112900", "파장동"),
            new BjdInfo("4111113000", "정자동"),
            new BjdInfo("4111113100", "이목동"),
            new BjdInfo("4111113200", "율전동"),
            new BjdInfo("4111113300", "천천동"),
            new BjdInfo("4111113400", "영화동"),
            new BjdInfo("4111113500", "송죽동"),
            new BjdInfo("4111113600", "조원동"),
            new BjdInfo("4111113700", "연무동")
        )));
    }

    private final WebClient webClient;
    private final ApartmentRepository apartmentRepository;

    @Value("${external.public-data.service-key}")
    private String publicDataServiceKey;

    @Value("${external.kakao.rest-api-key}")
    private String kakaoRestApiKey;

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * getAphusBassInfoV4 원본 응답을 문자열로 반환합니다.
     * API 응답 구조 확인 및 개발 디버깅용으로만 사용합니다.
     * 엔드포인트: GET /api/v1/admin/complexes/test-basis/{kaptCode}
     */
    public String testBasisApiRaw(String kaptCode) {
        return webClient.get()
            .uri(buildBasisInfoUri(kaptCode))
            .exchangeToMono(response -> response.bodyToMono(String.class))
            .block();
    }

    /**
     * 수집 가능한 시군구코드 목록을 반환합니다.
     * collectAllComplexes 등 전체 순회 시 이 목록을 기준으로 사용합니다.
     */
    public Set<String> getSupportedSigunguCodes() {
        return DISTRICTS.keySet();
    }

    /**
     * 특정 시군구의 getLegaldongAptList3 API 접근 가능 여부를 확인합니다.
     * 해당 구의 첫 번째 법정동으로 1건만 조회하여 resultCode를 검사합니다.
     * 엔드포인트: GET /api/v1/admin/complexes/test/{sigunguCd}
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
     * 특정 시군구의 전체 아파트 단지를 수집하여 apartment 테이블에 저장합니다.
     * 법정동 단위로 순회하며 페이지네이션을 처리합니다.
     * 이미 존재하는 단지(단지명+시군구 기준)는 저장을 건너뜁니다.
     * 엔드포인트: POST /api/v1/admin/complexes/{sigunguCd}
     *
     * @return savedApartments/skippedAlreadyExists/skippedNoCoordinate/totalFromApi 통계
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
            collectByBjdCode(bjd, district, stats);
        }

        log.info("단지 수집 완료 sigunguCd={}: {}", sigunguCd, stats);
        return stats;
    }

    /**
     * kapt_code가 있으나 세대수 또는 준공연도가 NULL인 기존 레코드를 일괄 보완합니다.
     * getAphusBassInfoV4 API를 호출하여 누락된 값을 채웁니다.
     * 엔드포인트: POST /api/v1/admin/complexes/backfill-household
     *
     * @return 업데이트된 레코드 수
     */
    @Transactional
    public int backfillHouseholdCount() {
        List<ApartmentKaptCodeProjection> targets =
                apartmentRepository.findAllWithKaptCodeAndNullHousehold();
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
        log.info("단지 기본정보 보완 완료: {}건", updated);
        return updated;
    }

    // -----------------------------------------------------------------------
    // 수집 내부 로직
    // -----------------------------------------------------------------------

    /**
     * 단일 법정동의 모든 단지를 페이지네이션으로 순회하며 수집합니다.
     * getLegaldongAptList3 API가 최대 100건씩 반환하므로 totalCount 기준으로 반복합니다.
     */
    private void collectByBjdCode(BjdInfo bjd, DistrictInfo district, Map<String, Integer> stats) {
        final int numOfRows = 100;
        int pageNo = 1;
        int totalFetched = 0;
        int totalCount = 0;

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

            // totalCount는 첫 페이지에서만 통계에 반영 (페이지마다 중복 합산 방지)
            if (pageNo == 1) {
                totalCount = body.path("totalCount").asInt(0);
                stats.merge("totalFromApi", totalCount, Integer::sum);
            }

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

    /**
     * 단지 1건을 처리합니다.
     * 중복 확인 → 좌표 획득 → 기본정보 조회 순으로 진행하며,
     * 각 단계에서 실패하면 해당 단지는 저장하지 않습니다.
     */
    private void processComplex(JsonNode item, BjdInfo bjd, DistrictInfo district, Map<String, Integer> stats) {
        String kaptName = text(item, "kaptName");
        if (kaptName == null || kaptName.isBlank()) return;

        String sido         = district.sido();
        String sigungu      = district.sigungu();
        String eupMyeonDong = nullOrDefault(text(item, "as3"), bjd.eupMyeonDong());
        String bjdCode      = nullOrDefault(text(item, "bjdCode"), bjd.bjdCode());

        // 동일 단지명+시군구 조합이 이미 존재하면 스킵
        if (apartmentRepository.findFirstByComplexNameAndSigungu(kaptName, sigungu).isPresent()) {
            stats.computeIfPresent("skippedAlreadyExists", (k, v) -> v + 1);
            return;
        }

        // 카카오 API로 좌표 획득 실패 시 저장하지 않음
        Point point = geocode(sido, sigungu, eupMyeonDong, kaptName);
        if (point == null) {
            stats.computeIfPresent("skippedNoCoordinate", (k, v) -> v + 1);
            log.warn("좌표 조회 실패: {}/{}/{}", sigungu, eupMyeonDong, kaptName);
            return;
        }

        // getLegaldongAptList3는 세대수·준공연도를 제공하지 않으므로 별도 API로 조회
        String kaptCode = text(item, "kaptCode");
        AptBasisInfo basisInfo = (kaptCode != null) ? fetchBasisInfo(kaptCode) : null;

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
        log.debug("저장: {}/{}/{}", sigungu, eupMyeonDong, kaptName);
    }

    // -----------------------------------------------------------------------
    // API 호출
    // -----------------------------------------------------------------------

    /** getLegaldongAptList3 API 단일 페이지 조회 */
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

    /**
     * getAphusBassInfoV4 API로 단지 기본정보를 조회합니다.
     * 응답 필드: kaptdaCnt(세대수, float), kaptUsedate(사용승인일, YYYYMMDD)
     * 실패 시 null 반환 (수집 중단 없이 다음 단지로 넘어감).
     *
     * <p>주의: serviceKey에 특수문자(+, = 등)가 포함되어 UriBuilder 템플릿 파싱 오류가 발생하므로
     * UriComponentsBuilder.encode()를 사용하여 URI를 직접 생성합니다.
     */
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
            log.warn("단지 기본정보 조회 실패 kaptCode={}: {}", kaptCode, e.getMessage());
            return null;
        }
    }

    /**
     * 카카오 키워드 검색 API로 좌표를 획득합니다.
     * 전체 주소(시도+시군구+동+단지명)로 먼저 시도하고, 실패 시 시군구+단지명으로 재시도합니다.
     */
    private Point geocode(String sido, String sigungu, String eupMyeonDong, String kaptName) {
        String fullKeyword = String.join(" ",
            nullToEmpty(sido), nullToEmpty(sigungu), nullToEmpty(eupMyeonDong), nullToEmpty(kaptName)).trim();
        Point p = searchByKeyword(fullKeyword);
        if (p != null) return p;

        return searchByKeyword(nullToEmpty(sigungu) + " " + nullToEmpty(kaptName));
    }

    /** 카카오 키워드 검색 API 호출 후 첫 번째 결과의 좌표를 반환합니다. */
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

    // -----------------------------------------------------------------------
    // 유틸리티
    // -----------------------------------------------------------------------

    /**
     * UriBuilder 대신 UriComponentsBuilder를 사용하는 이유:
     * serviceKey의 특수문자(+, = 등)를 UriBuilder가 URI 템플릿 변수로 잘못 해석하는 문제 방지.
     */
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

    /**
     * 공공데이터 API는 items 구조가 두 가지 패턴으로 내려옵니다.
     * - 단건: response.body.items.item (Object)
     * - 다건: response.body.items.item (Array) 또는 response.body.items (Array)
     */
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

    private String buildAddress(String sido, String sigungu, String eupMyeonDong) {
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

    /**
     * API 응답의 숫자 필드를 Integer로 변환합니다.
     * kaptdaCnt처럼 float(0.0)으로 내려오는 경우도 처리하며, 0은 데이터 미입력으로 간주해 null을 반환합니다.
     */
    private Integer parseJsonIntOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        int value = node.asInt();
        return value == 0 ? null : value;
    }

    /** YYYYMMDD 형식 문자열에서 연도(앞 4자리)만 추출합니다. */
    private Integer parseYearFromDate(String value) {
        if (value == null || value.length() < 4) return null;
        try {
            return Integer.parseInt(value.substring(0, 4));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
