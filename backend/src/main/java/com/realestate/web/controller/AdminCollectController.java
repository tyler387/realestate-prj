package com.realestate.web.controller;

import com.realestate.collect.RealTradeCollector;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCollectController {

    private final RealTradeCollector realTradeCollector;

    @PostMapping("/collect")
    public ResponseEntity<Void> collect() {
        CompletableFuture.runAsync(() -> realTradeCollector.collectRecentThreeMonths());
        return ResponseEntity.accepted().build();
    }
}
