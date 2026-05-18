package com.realestate.service;

import com.realestate.domain.repository.HighestDealProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TopApartmentProjection;
import com.realestate.domain.repository.TradeSummaryProjection;
import com.realestate.web.dto.HighestPriceDealDto;
import com.realestate.web.dto.TopApartmentDto;
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
    public List<TopApartmentDto> getTopApartments(String period) {
        int days = resolvePeriodDays(period);
        AtomicInteger rank = new AtomicInteger(1);
        return realTradeRepository.findTopApartmentsByTransactionCount(days)
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

    private int resolvePeriodDays(String period) {
        if (period == null) return 30;
        return switch (period) {
            case "1w" -> 7;
            case "2m" -> 60;
            case "3m" -> 90;
            case "1m" -> 30;
            default -> 30;
        };
    }
}
