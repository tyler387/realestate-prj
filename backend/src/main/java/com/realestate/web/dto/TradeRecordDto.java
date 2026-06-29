package com.realestate.web.dto;

import java.math.BigDecimal;

public record TradeRecordDto(
        Long id,
        Integer floor,
        BigDecimal area,
        String tradeType,
        Long tradeAmount,
        Long depositAmount,
        Long monthlyRentAmount,
        String contractDate,
        Long pricePerPyeong
) {
}
