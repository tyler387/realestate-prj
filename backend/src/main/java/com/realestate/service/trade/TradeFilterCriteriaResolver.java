package com.realestate.service.trade;

import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class TradeFilterCriteriaResolver {

    public TradeFilterCriteria resolveForDetail(
            String period,
            String priceRange,
            String dealType,
            String areaRange,
            String preset,
            String floorBand,
            String yearBand,
            String complexKeyword,
            LocalDate startDate,
            LocalDate endDate,
            boolean excludeOutliers
    ) {
        return resolve(
                period,
                priceRange,
                dealType,
                areaRange,
                preset,
                floorBand,
                yearBand,
                complexKeyword,
                startDate,
                endDate,
                excludeOutliers,
                null,
                true
        );
    }

    public TradeFilterCriteria resolveForRanking(
            String period,
            String priceRange,
            String dealType,
            String areaRange,
            String preset,
            String floorBand,
            String yearBand,
            String complexKeyword,
            LocalDate startDate,
            LocalDate endDate,
            boolean excludeOutliers
    ) {
        return resolve(
                period,
                priceRange,
                dealType,
                areaRange,
                preset,
                floorBand,
                yearBand,
                complexKeyword,
                startDate,
                endDate,
                excludeOutliers,
                "SALE",
                false
        );
    }

    private TradeFilterCriteria resolve(
            String period,
            String priceRange,
            String dealType,
            String areaRange,
            String preset,
            String floorBand,
            String yearBand,
            String complexKeyword,
            LocalDate startDate,
            LocalDate endDate,
            boolean excludeOutliers,
            String defaultTradeType,
            boolean allowAllPeriod
    ) {
        DateRange dateRange = resolveDateRange(period, startDate, endDate, allowAllPeriod);
        PriceBounds priceBounds = resolvePriceBounds(priceRange);
        AreaBounds areaBounds = resolveAreaBounds(areaRange);
        FloorBounds floorBounds = resolveFloorBounds(floorBand);
        AgeBounds ageBounds = resolveAgeBounds(yearBand);

        return new TradeFilterCriteria(
                dateRange.startDate(),
                dateRange.endDate(),
                resolveTradeType(dealType, defaultTradeType),
                priceBounds.minPrice(),
                priceBounds.maxPrice(),
                areaBounds.minArea(),
                areaBounds.maxArea(),
                floorBounds.minFloor(),
                floorBounds.maxFloor(),
                ageBounds.minAge(),
                ageBounds.maxAge(),
                "NEW".equals(preset),
                "LARGE".equals(preset),
                "HOT".equals(preset),
                complexKeyword == null || complexKeyword.isBlank() ? null : complexKeyword.trim(),
                excludeOutliers
        );
    }

    private DateRange resolveDateRange(String period, LocalDate startDate, LocalDate endDate, boolean allowAllPeriod) {
        if (startDate != null && endDate != null && !endDate.isBefore(startDate)) {
            return new DateRange(startDate, endDate);
        }

        if (allowAllPeriod && "all".equals(period)) {
            return new DateRange(LocalDate.of(1900, 1, 1), LocalDate.now());
        }

        int months = switch (period == null ? "1m" : period) {
            case "3m" -> 3;
            case "6m" -> 6;
            case "12m" -> 12;
            case "custom", "1m" -> 1;
            default -> 1;
        };
        LocalDate now = LocalDate.now();
        return new DateRange(now.minusMonths(months), now);
    }

    private String resolveTradeType(String dealType, String defaultTradeType) {
        if (dealType == null || dealType.isBlank()) return defaultTradeType;
        return switch (dealType) {
            case "SALE" -> "SALE";
            case "JEONSE", "LEASE" -> "LEASE";
            case "MONTHLY" -> "MONTHLY";
            default -> defaultTradeType;
        };
    }

    private PriceBounds resolvePriceBounds(String priceRange) {
        if ("UNDER_10".equals(priceRange)) {
            return new PriceBounds(0L, 100_000L);
        }
        if ("10_20".equals(priceRange)) {
            return new PriceBounds(100_000L, 200_000L);
        }
        if ("OVER_20".equals(priceRange)) {
            return new PriceBounds(200_000L, null);
        }
        return new PriceBounds(null, null);
    }

    private AreaBounds resolveAreaBounds(String areaRange) {
        if ("20".equals(areaRange)) {
            return new AreaBounds(66.0, 99.0);
        }
        if ("30".equals(areaRange)) {
            return new AreaBounds(99.0, 132.0);
        }
        if ("40".equals(areaRange)) {
            return new AreaBounds(132.0, 165.0);
        }
        return new AreaBounds(null, null);
    }

    private FloorBounds resolveFloorBounds(String floorBand) {
        if ("LOW".equals(floorBand)) {
            return new FloorBounds(1, 5);
        }
        if ("MID".equals(floorBand)) {
            return new FloorBounds(6, 15);
        }
        if ("HIGH".equals(floorBand)) {
            return new FloorBounds(16, null);
        }
        return new FloorBounds(null, null);
    }

    private AgeBounds resolveAgeBounds(String yearBand) {
        if ("NEW_0_10".equals(yearBand)) {
            return new AgeBounds(0, 10);
        }
        if ("MID_11_20".equals(yearBand)) {
            return new AgeBounds(11, 20);
        }
        if ("OLD_21_PLUS".equals(yearBand)) {
            return new AgeBounds(21, null);
        }
        return new AgeBounds(null, null);
    }

    private record DateRange(LocalDate startDate, LocalDate endDate) {}
    private record PriceBounds(Long minPrice, Long maxPrice) {}
    private record AreaBounds(Double minArea, Double maxArea) {}
    private record FloorBounds(Integer minFloor, Integer maxFloor) {}
    private record AgeBounds(Integer minAge, Integer maxAge) {}
}
