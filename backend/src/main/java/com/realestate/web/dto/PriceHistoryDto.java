package com.realestate.web.dto;

public record PriceHistoryDto(
        String month,
        Long avgPrice,
        String tradeType
) {
}
