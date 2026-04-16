package com.realestate.web.dto;

import java.math.BigDecimal;

public record HighestPriceDealDto(
        Long aptId,
        String aptName,
        Long price,
        String dealDate,
        BigDecimal area,
        boolean isNewHigh
) {
}
