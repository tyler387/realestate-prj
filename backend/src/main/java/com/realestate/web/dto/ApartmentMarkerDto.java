package com.realestate.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ApartmentMarkerDto(
        Long id,
        String complexName,
        String eupMyeonDong,
        Double latitude,
        Double longitude,
        Long latestSalePrice,
        BigDecimal latestSaleArea,
        LocalDate latestTradeDate
) {
}
