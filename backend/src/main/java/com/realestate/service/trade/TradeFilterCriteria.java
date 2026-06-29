package com.realestate.service.trade;

import java.time.LocalDate;

public record TradeFilterCriteria(
        LocalDate startDate,
        LocalDate endDate,
        String tradeType,
        Long minPrice,
        Long maxPrice,
        Double minArea,
        Double maxArea,
        Integer minFloor,
        Integer maxFloor,
        Integer minAge,
        Integer maxAge,
        boolean onlyNew,
        boolean onlyLarge,
        boolean onlyHot,
        String complexKeyword,
        boolean excludeOutliers
) {
}
