package com.realestate.web.dto;

import java.math.BigDecimal;

public record TradeRecordDto(
        Long id,
        Integer floor,
        BigDecimal area,
        String tradeType,
        Long tradeAmount,
        String contractDate,
        Long pricePerPyeong
) {
}
