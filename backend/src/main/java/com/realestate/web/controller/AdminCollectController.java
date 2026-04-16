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

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCollectController {

    private final RealTradeCollector realTradeCollector;
    private final ApartmentComplexCollector apartmentComplexCollector;

    /** 전체 기본 지역 최근 3개월 수집 */
    @PostMapping("/collect")
    public ResponseEntity<Void> collect() {
        CompletableFuture.runAsync(() -> realTradeCollector.collectRecentThreeMonths());
        return ResponseEntity.accepted().build();
    }

    /**
     * 특정 구 거래 데이터 수집
     * - lawdCd: 법정동코드 앞 5자리 (예: 11710 = 송파구, 11650 = 서초구)
     * - months: 몇 개월치 수집 (기본 3, 최대 12)
     *
     * 예) POST /api/v1/admin/collect/11710?months=3
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

    /**
     * 단지 목록 API 접근 가능 여부 테스트.
     * 공공데이터포털에서 "공동주택 단지정보" 서비스 신청 여부 확인용.
     *
     * 예) GET /api/v1/admin/complexes/test/11650
     */
    @GetMapping("/complexes/test/{sigunguCd}")
    public ResponseEntity<Map<String, String>> testComplexApi(@PathVariable String sigunguCd) {
        String result = apartmentComplexCollector.testApiAccess(sigunguCd);
        String status = result.startsWith("OK") ? "success" : "error";
        return ResponseEntity.ok(Map.of("status", status, "message", result));
    }

    /**
     * 특정 시군구의 전체 아파트 단지 수집 (거래 여부 무관).
     * 공공데이터포털 "공동주택 단지정보" 서비스 신청 필요.
     *
     * 예) POST /api/v1/admin/complexes/11650
     *     POST /api/v1/admin/complexes/11710
     */
    @PostMapping("/complexes/{sigunguCd}")
    public ResponseEntity<Map<String, Integer>> collectComplexes(@PathVariable String sigunguCd) {
        Map<String, Integer> stats = apartmentComplexCollector.collectComplexes(sigunguCd);
        return ResponseEntity.ok(stats);
    }

    /**
     * 전체 지원 지역 단지 수집 (비동기).
     * 예) POST /api/v1/admin/complexes/all
     */
    @PostMapping("/complexes/all")
    public ResponseEntity<Void> collectAllComplexes() {
        CompletableFuture.runAsync(() -> {
            for (String sigunguCd : new String[]{"11650", "11710", "11680", "11440", "41111"}) {
                apartmentComplexCollector.collectComplexes(sigunguCd);
            }
        });
        return ResponseEntity.accepted().build();
    }
}
