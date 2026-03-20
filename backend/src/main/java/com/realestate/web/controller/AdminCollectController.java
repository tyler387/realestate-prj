package com.realestate.web.controller;

import com.realestate.collect.RealTradeCollector;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminCollectController {

    private final RealTradeCollector realTradeCollector;

    @PostMapping("/collect")
    public Map<String, Integer> collect() {
        return realTradeCollector.collectRecentThreeMonths();
    }
}
