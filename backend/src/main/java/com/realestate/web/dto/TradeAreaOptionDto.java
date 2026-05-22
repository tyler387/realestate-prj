package com.realestate.web.dto;

import java.math.BigDecimal;

public record TradeAreaOptionDto(
        BigDecimal area,
        Long transactionCount
) {
}
