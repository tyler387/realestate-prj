package com.realestate.web.dto;

public record TopApartmentDto(
        Integer rank,
        Long aptId,
        String aptName,
        String sigungu,
        Long transactionCount,
        Long latestSalePrice
) {
}
