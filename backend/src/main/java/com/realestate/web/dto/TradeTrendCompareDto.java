package com.realestate.web.dto;

public record TradeTrendCompareDto(
        String period,
        Long currentMedian,
        Long currentAvg,
        Long currentTransactionCount,
        Long previousMedian,
        Long previousAvg,
        Long previousTransactionCount,
        Double changeRate
) {
}