package com.realestate.service;

import com.realestate.domain.repository.HighestDealProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TopApartmentProjection;
import com.realestate.domain.repository.TradeTrendCompareProjection;
import com.realestate.domain.repository.TradeSummaryProjection;
import com.realestate.web.dto.HighestPriceDealDto;
import com.realestate.web.dto.TopApartmentDto;
import com.realestate.web.dto.TradeTrendCompareDto;
import com.realestate.web.dto.TradeTrendDto;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TradeStatsService {

    private final RealTradeRepository realTradeRepository;

    @Transactional(readOnly = true)
    public TradeTrendDto getTradeTrend(String period) {
        int days = resolvePeriodDays(period);
        int prevDays = days * 2;

        TradeSummaryProjection current = realTradeRepository.findTradeSummary(days);
        TradeSummaryProjection prev = realTradeRepository.findPrevTradeSummary(prevDays, days);

        long avgPrice = current != null && current.getAvgPrice() != null ? current.getAvgPrice() : 0L;
        long transactionCount = current != null && current.getTransactionCount() != null ? current.getTransactionCount() : 0L;

        double changeRate = 0.0;
        if (prev != null && prev.getAvgPrice() != null && prev.getAvgPrice() > 0) {
            changeRate = (double) (avgPrice - prev.getAvgPrice()) / prev.getAvgPrice() * 100.0;
            changeRate = Math.round(changeRate * 10.0) / 10.0;
        }

        return new TradeTrendDto(period, avgPrice, changeRate, transactionCount);
    }

    @Transactional(readOnly = true)
    public TradeTrendCompareDto getTradeTrendCompare(String period) {
        int days = resolvePeriodDays(period);
        LocalDate endDate = LocalDate.now();
        LocalDate currentStartDate = endDate.minusDays(days - 1L);
        LocalDate previousEndDate = currentStartDate.minusDays(1);
        LocalDate previousStartDate = previousEndDate.minusDays(days - 1L);

        TradeTrendCompareProjection current = realTradeRepository.findTradeTrendCompareSummary(currentStartDate, endDate);
        TradeTrendCompareProjection previous = realTradeRepository.findTradeTrendCompareSummary(previousStartDate, previousEndDate);

        long currentMedian = current != null && current.getMedianPrice() != null ? current.getMedianPrice() : 0L;
        long currentAvg = current != null && current.getAvgPrice() != null ? current.getAvgPrice() : 0L;
        long currentCount = current != null && current.getTransactionCount() != null ? current.getTransactionCount() : 0L;

        long previousMedian = previous != null && previous.getMedianPrice() != null ? previous.getMedianPrice() : 0L;
        long previousAvg = previous != null && previous.getAvgPrice() != null ? previous.getAvgPrice() : 0L;
        long previousCount = previous != null && previous.getTransactionCount() != null ? previous.getTransactionCount() : 0L;

        double changeRate = 0.0;
        if (previousAvg > 0) {
            changeRate = (double) (currentAvg - previousAvg) / previousAvg * 100.0;
            changeRate = Math.round(changeRate * 10.0) / 10.0;
        }

        return new TradeTrendCompareDto(
                period,
                currentMedian,
                currentAvg,
                currentCount,
                previousMedian,
                previousAvg,
                previousCount,
                changeRate
        );
    }

    @Transactional(readOnly = true)
    public List<HighestPriceDealDto> getHighestPriceDeals() {
        List<HighestDealProjection> projections = realTradeRepository.findHighestPriceDeals();
        LocalDate oneMonthAgo = LocalDate.now().minusMonths(1);

        return projections.stream()
                .map(p -> {
                    boolean isNewHigh = p.getDealDate() != null
                            && LocalDate.parse(p.getDealDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                    .isAfter(oneMonthAgo);
                    return new HighestPriceDealDto(
                            p.getAptId(),
                            p.getAptName(),
                            p.getPrice(),
                            p.getDealDate(),
                            p.getArea(),
                            isNewHigh
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TopApartmentDto> getTopApartments(
            String period,
            String priceRange,
            String dealType,
            String areaRange,
            String preset,
            String floorBand,
            String yearBand,
            String complexKeyword,
            LocalDate startDate,
            LocalDate endDate,
            boolean excludeOutliers) {
        DateRange dateRange = resolveDateRange(period, startDate, endDate);

        Long minPrice = null;
        Long maxPrice = null;
        if ("UNDER_10".equals(priceRange)) {
            minPrice = 0L;
            maxPrice = 100_000L;
        } else if ("10_20".equals(priceRange)) {
            minPrice = 100_000L;
            maxPrice = 200_000L;
        } else if ("OVER_20".equals(priceRange)) {
            minPrice = 200_000L;
        }

        Double minArea = null;
        Double maxArea = null;
        if ("20".equals(areaRange)) {
            minArea = 66.0;
            maxArea = 99.0;
        } else if ("30".equals(areaRange)) {
            minArea = 99.0;
            maxArea = 132.0;
        } else if ("40".equals(areaRange)) {
            minArea = 132.0;
            maxArea = 165.0;
        }

        String tradeType = dealType == null ? "SALE" : dealType;
        boolean onlyNew = "NEW".equals(preset);
        boolean onlyLarge = "LARGE".equals(preset);
        boolean onlyHot = "HOT".equals(preset);

        Integer minFloor = null;
        Integer maxFloor = null;
        if ("LOW".equals(floorBand)) {
            minFloor = 1;
            maxFloor = 5;
        } else if ("MID".equals(floorBand)) {
            minFloor = 6;
            maxFloor = 15;
        } else if ("HIGH".equals(floorBand)) {
            minFloor = 16;
        }

        Integer minAge = null;
        Integer maxAge = null;
        if ("NEW_0_10".equals(yearBand)) {
            minAge = 0;
            maxAge = 10;
        } else if ("MID_11_20".equals(yearBand)) {
            minAge = 11;
            maxAge = 20;
        } else if ("OLD_21_PLUS".equals(yearBand)) {
            minAge = 21;
        }

        AtomicInteger rank = new AtomicInteger(1);
        return realTradeRepository.findTopApartmentsByTransactionCountWithFilters(
                        dateRange.startDate(),
                        dateRange.endDate(),
                        tradeType,
                        minPrice,
                        maxPrice,
                        minArea,
                        maxArea,
                        onlyNew,
                        onlyLarge,
                        onlyHot,
                        minFloor,
                        maxFloor,
                        minAge,
                        maxAge,
                        complexKeyword,
                        excludeOutliers)
                .stream()
                .map(p -> new TopApartmentDto(
                        rank.getAndIncrement(),
                        p.getAptId(),
                        p.getAptName(),
                        p.getSigungu(),
                        p.getTransactionCount(),
                        p.getLatestSalePrice()
                ))
                .toList();
    }

    private DateRange resolveDateRange(String period, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && !endDate.isBefore(startDate)) {
            return new DateRange(startDate, endDate);
        }

        int months = resolvePeriodMonths(period);
        LocalDate now = LocalDate.now();
        return new DateRange(now.minusMonths(months), now);
    }

    private int resolvePeriodDays(String period) {
        if (period == null) return 30;
        return switch (period) {
            case "1w" -> 7;
            case "3m" -> 90;
            case "6m" -> 180;
            case "12m" -> 365;
            case "1m", "custom" -> 30;
            default -> 30;
        };
    }

    private int resolvePeriodMonths(String period) {
        if (period == null) return 1;
        return switch (period) {
            case "3m" -> 3;
            case "6m" -> 6;
            case "12m" -> 12;
            case "custom" -> 1;
            case "1m" -> 1;
            default -> 1;
        };
    }

    private record DateRange(LocalDate startDate, LocalDate endDate) {}
}

