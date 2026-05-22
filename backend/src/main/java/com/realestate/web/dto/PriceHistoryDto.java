package com.realestate.web.dto;

public record PriceHistoryDto(
        String month,
        Long avgPrice,
        Long avgPricePerPyeong,
        Long transactionCount,
        String tradeType
) {
}
