package com.realestate.web.dto;

import java.time.LocalDate;

public record ApartmentSummaryDto(
        Long id,
        String complexName,
        String location,
        Integer totalHouseholdCount,
        Integer completionYear,
        Long recentSalePrice,
        Double recentSaleArea,
        LocalDate recentTradeDate,
        Integer recent30dTradeCount
) {
}
