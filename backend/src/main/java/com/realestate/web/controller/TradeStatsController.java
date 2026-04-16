package com.realestate.web.controller;

import com.realestate.service.TradeStatsService;
import com.realestate.web.dto.HighestPriceDealDto;
import com.realestate.web.dto.TopApartmentDto;
import com.realestate.web.dto.TradeTrendDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trades")
@RequiredArgsConstructor
public class TradeStatsController {

    private final TradeStatsService tradeStatsService;

    @GetMapping("/trend")
    public TradeTrendDto getTrend(@RequestParam(defaultValue = "1m") String period) {
        return tradeStatsService.getTradeTrend(period);
    }

    @GetMapping("/highest")
    public List<HighestPriceDealDto> getHighest() {
        return tradeStatsService.getHighestPriceDeals();
    }

    @GetMapping("/top-apartments")
    public List<TopApartmentDto> getTopApartments(
            @RequestParam(defaultValue = "1m") String period) {
        return tradeStatsService.getTopApartments(period);
    }
}
