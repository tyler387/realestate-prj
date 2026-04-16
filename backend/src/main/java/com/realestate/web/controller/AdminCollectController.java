package com.realestate.web.controller;

import com.realestate.collect.RealTradeCollector;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    /** 전체 기본 지역 최근 3개월 수집 */
    @PostMapping("/collect")
    public ResponseEntity<Void> collect() {
        CompletableFuture.runAsync(() -> realTradeCollector.collectRecentThreeMonths());
        return ResponseEntity.accepted().build();
    }

    /**
     * 특정 구 수집
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
}
