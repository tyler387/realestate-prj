package com.realestate.web.controller;

import com.realestate.collect.ApartmentComplexCollector;
import com.realestate.collect.RealTradeCollector;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 데이터 수집 관리용 어드민 API.
 * 모든 엔드포인트는 X-Admin-Api-Key 헤더 인증이 필요합니다.
 *
 * <p>수집 흐름:
 * <ol>
 *   <li>단지 수집: POST /complexes/{sigunguCd} — apartment 테이블에 단지 마스터 적재</li>
 *   <li>거래 수집: POST /collect/{lawdCd}     — real_trade 테이블에 실거래가 적재</li>
 * </ol>
 * 거래 수집은 단지 마스터가 먼저 있어야 apartment_id를 연결할 수 있습니다.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCollectController {

    private final RealTradeCollector realTradeCollector;
    private final ApartmentComplexCollector apartmentComplexCollector;

    // -----------------------------------------------------------------------
    // 거래 데이터 수집 (real_trade 테이블)
    // -----------------------------------------------------------------------

    /**
     * 전체 지원 지역의 실거래가를 비동기로 수집합니다.
     * 완료 여부와 관계없이 즉시 202 Accepted를 반환합니다.
     *
     * @param months 수집 개월 수 (기본 12, 최대 12)
     * 예) POST /api/v1/admin/collect
     *     POST /api/v1/admin/collect?months=6
     */
    @PostMapping("/collect")
    public ResponseEntity<Void> collect(@RequestParam(defaultValue = "12") int months) {
        if (months < 1 || months > 12) return ResponseEntity.badRequest().build();
        CompletableFuture.runAsync(() -> realTradeCollector.collectAllDistricts(months));
        return ResponseEntity.accepted().build();
    }

    /**
     * 특정 구의 실거래가를 지정 개월 수만큼 수집합니다.
     *
     * @param lawdCd 법정동코드 앞 5자리 (예: 11710=송파구, 11650=서초구, 11680=강남구)
     * @param months 수집 개월 수 (기본 3, 최대 12)
     * 예) POST /api/v1/admin/collect/11710?months=6
     */
    @PostMapping("/collect/{lawdCd}")
    public ResponseEntity<Map<String, Integer>> collectDistrict(
            @PathVariable String lawdCd,
            @RequestParam(defaultValue = "3") int months) {

        if (months < 1 || months > 12) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, Integer> stats = realTradeCollector.collectDistrict(lawdCd, months);
        return ResponseEntity.ok(stats);
    }

    // -----------------------------------------------------------------------
    // 단지 마스터 수집 (apartment 테이블)
    // -----------------------------------------------------------------------

    /**
     * 특정 시군구의 전체 아파트 단지를 수집하여 apartment 테이블에 저장합니다.
     * 이미 존재하는 단지(단지명+시군구 기준)는 건너뜁니다.
     * 공공데이터포털 "공동주택 단지정보" 서비스 신청이 필요합니다.
     * 예) POST /api/v1/admin/complexes/11650
     */
    @PostMapping("/complexes/{sigunguCd}")
    public ResponseEntity<Map<String, Integer>> collectComplexes(@PathVariable String sigunguCd) {
        Map<String, Integer> stats = apartmentComplexCollector.collectComplexes(sigunguCd);
        return ResponseEntity.ok(stats);
    }

    /**
     * 지원하는 전체 지역의 단지를 비동기로 수집합니다.
     * 수집 대상 지역은 ApartmentComplexCollector.DISTRICTS에 정의된 시군구코드 목록을 사용합니다.
     * 완료 여부와 관계없이 즉시 202 Accepted를 반환합니다.
     * 예) POST /api/v1/admin/complexes/all
     */
    @PostMapping("/complexes/all")
    public ResponseEntity<Void> collectAllComplexes() {
        CompletableFuture.runAsync(() ->
            apartmentComplexCollector.getSupportedSigunguCodes()
                .forEach(apartmentComplexCollector::collectComplexes)
        );
        return ResponseEntity.accepted().build();
    }

    /**
     * kapt_code가 있지만 세대수 또는 준공연도가 null인 기존 레코드를 일괄 보완합니다.
     * getAphusBassInfoV4 API를 호출하여 누락된 값을 채웁니다.
     * 예) POST /api/v1/admin/complexes/backfill-household
     */
    @PostMapping("/complexes/backfill-household")
    public ResponseEntity<Map<String, Integer>> backfillHouseholdCount() {
        int updated = apartmentComplexCollector.backfillHouseholdCount();
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // -----------------------------------------------------------------------
    // 개발/디버깅용 엔드포인트
    // -----------------------------------------------------------------------

    /**
     * getAphusBassInfoV4 API 원본 응답을 문자열로 반환합니다.
     * DB의 kapt_code 값을 입력하면 실제 API JSON 구조를 확인할 수 있습니다.
     * 예) GET /api/v1/admin/complexes/test-basis/A10020138
     */
    @GetMapping("/complexes/test-basis/{kaptCode}")
    public ResponseEntity<String> testBasisApi(@PathVariable String kaptCode) {
        String raw = apartmentComplexCollector.testBasisApiRaw(kaptCode);
        return ResponseEntity.ok(raw);
    }

    /**
     * getLegaldongAptList3 API 접근 가능 여부를 확인합니다.
     * 공공데이터포털에서 해당 서비스를 신청했는지 빠르게 검증할 때 사용합니다.
     * 예) GET /api/v1/admin/complexes/test/11650
     */
    @GetMapping("/complexes/test/{sigunguCd}")
    public ResponseEntity<Map<String, String>> testComplexApi(@PathVariable String sigunguCd) {
        String result = apartmentComplexCollector.testApiAccess(sigunguCd);
        String status = result.startsWith("OK") ? "success" : "error";
        return ResponseEntity.ok(Map.of("status", status, "message", result));
    }
}
