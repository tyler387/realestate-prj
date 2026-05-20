package com.realestate.web.controller;

import com.realestate.service.TradeStatsService;
import com.realestate.web.dto.HighestPriceDealDto;
import com.realestate.web.dto.TopApartmentDto;
import com.realestate.web.dto.TradeTrendCompareDto;
import com.realestate.web.dto.TradeTrendDto;
import java.util.List;
import java.time.LocalDate;
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

    @GetMapping("/trend/compare")
    public TradeTrendCompareDto getTrendCompare(@RequestParam(defaultValue = "1m") String period) {
        return tradeStatsService.getTradeTrendCompare(period);
    }

    @GetMapping("/highest")
    public List<HighestPriceDealDto> getHighest() {
        return tradeStatsService.getHighestPriceDeals();
    }

    @GetMapping("/top-apartments")
    public List<TopApartmentDto> getTopApartments(
            @RequestParam(defaultValue = "1m") String period,
            @RequestParam(required = false) String priceRange,
            @RequestParam(required = false) String dealType,
            @RequestParam(required = false) String areaRange,
            @RequestParam(required = false) String preset,
            @RequestParam(required = false) String floorBand,
            @RequestParam(required = false) String yearBand,
            @RequestParam(required = false) String complexKeyword,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "false") boolean excludeOutliers) {
        return tradeStatsService.getTopApartments(
                period, priceRange, dealType, areaRange, preset, floorBand, yearBand, complexKeyword, startDate, endDate, excludeOutliers);
    }
}

