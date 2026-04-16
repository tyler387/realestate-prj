package com.realestate.web.dto;

public record ApartmentSummaryDto(
        Long id,
        String complexName,
        String location,
        Integer totalHouseholdCount,
        Integer completionYear,
        Long recentSalePrice
) {
}
