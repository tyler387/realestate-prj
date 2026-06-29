package com.realestate.service;

import com.realestate.domain.repository.HighestDealProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TopApartmentProjection;
import com.realestate.domain.repository.TradeTrendCompareProjection;
import com.realestate.domain.repository.TradeSummaryProjection;
import com.realestate.service.trade.TradeFilterCriteria;
import com.realestate.service.trade.TradeFilterCriteriaResolver;
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
    private final TradeFilterCriteriaResolver tradeFilterCriteriaResolver;

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
        TradeFilterCriteria criteria = tradeFilterCriteriaResolver.resolveForRanking(
                period,
                priceRange,
                dealType,
                areaRange,
                preset,
                floorBand,
                yearBand,
                complexKeyword,
                startDate,
                endDate,
                excludeOutliers
        );

        AtomicInteger rank = new AtomicInteger(1);
        return realTradeRepository.findTopApartmentsByTransactionCountWithFilters(
                        criteria.startDate(),
                        criteria.endDate(),
                        criteria.tradeType(),
                        criteria.minPrice(),
                        criteria.maxPrice(),
                        criteria.minArea(),
                        criteria.maxArea(),
                        criteria.onlyNew(),
                        criteria.onlyLarge(),
                        criteria.onlyHot(),
                        criteria.minFloor(),
                        criteria.maxFloor(),
                        criteria.minAge(),
                        criteria.maxAge(),
                        criteria.complexKeyword(),
                        criteria.excludeOutliers())
                .stream()
                .map(p -> new TopApartmentDto(
                        rank.getAndIncrement(),
                        p.getAptId(),
                        p.getAptName(),
                        p.getSigungu(),
                        p.getTransactionCount(),
                        p.getRecentMonthAvgPrice()
                ))
                .toList();
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
}

