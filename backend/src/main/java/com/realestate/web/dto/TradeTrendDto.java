package com.realestate.web.dto;

public record TradeTrendDto(
        String period,
        Long avgPrice,
        Double changeRate,
        Long transactionCount
) {
}
