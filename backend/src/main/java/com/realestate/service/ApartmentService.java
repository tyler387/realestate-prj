package com.realestate.service;

import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.ApartmentSearchProjection;
import com.realestate.domain.repository.ApartmentSummaryProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.web.dto.ApartmentMarkerDto;
import com.realestate.web.dto.ApartmentSearchDto;
import com.realestate.web.dto.ApartmentSummaryDto;
import com.realestate.web.dto.PriceHistoryDto;
import com.realestate.web.dto.TradeAreaOptionDto;
import com.realestate.web.dto.TradeRecordDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;

    @Transactional(readOnly = true)
    public List<ApartmentMarkerDto> getApartmentMarkers(double swLng, double swLat, double neLng, double neLat) {
        if (swLng < -180 || swLng > 180 || neLng < -180 || neLng > 180
                || swLat < -90 || swLat > 90 || neLat < -90 || neLat > 90
                || swLng >= neLng || swLat >= neLat) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coordinate bounds");
        }
        return apartmentRepository.findMarkersByViewport(swLng, swLat, neLng, neLat)
                .stream()
                .map(projection -> new ApartmentMarkerDto(
                        projection.getId(),
                        projection.getComplexName(),
                        projection.getEupMyeonDong(),
                        projection.getLatitude(),
                        projection.getLongitude(),
                        projection.getLatestSalePrice(),
                        projection.getLatestSaleArea(),
                        projection.getLatestTradeDate()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApartmentSearchDto> searchApartments(String keyword) {
        String trimmed = keyword == null ? "" : keyword.trim();
        if (trimmed.isEmpty()) {
            return List.of();
        }
        return apartmentRepository.searchByKeyword(trimmed)
                .stream()
                .map(this::toApartmentSearchDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApartmentSearchDto> getPopularApartments() {
        return apartmentRepository.findPopularApartments()
                .stream()
                .map(this::toApartmentSearchDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApartmentSummaryDto getApartmentSummary(Long id) {
        ApartmentSummaryProjection projection = apartmentRepository.findSummaryById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));
        return new ApartmentSummaryDto(
                projection.getId(),
                projection.getComplexName(),
                projection.getLocation(),
                projection.getTotalHouseholdCount(),
                projection.getCompletionYear(),
                projection.getRecentSalePrice(),
                projection.getRecentSaleArea(),
                projection.getRecentTradeDate(),
                projection.getRecent30dTradeCount()
        );
    }

    @Transactional(readOnly = true)
    public List<TradeRecordDto> getTradeRecords(
            Long id,
            BigDecimal exclusiveArea,
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
        apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));

        TradeFilterCriteria criteria = resolveTradeFilterCriteria(
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
                excludeOutliers
        );

        return realTradeRepository.findRecentByApartmentIdWithFilters(
                        id,
                        criteria.startDate(),
                        criteria.endDate(),
                        criteria.tradeType(),
                        exclusiveArea,
                        criteria.minPrice(),
                        criteria.maxPrice(),
                        criteria.minArea(),
                        criteria.maxArea(),
                        criteria.minFloor(),
                        criteria.maxFloor(),
                        criteria.minAge(),
                        criteria.maxAge(),
                        criteria.onlyNew(),
                        criteria.onlyLarge(),
                        criteria.complexKeyword(),
                        criteria.excludeOutliers()
                )
                .stream()
                .map(p -> new TradeRecordDto(
                        p.getId(),
                        p.getFloor(),
                        p.getArea(),
                        toKoreanTradeType(p.getTradeType()),
                        p.getTradeAmount(),
                        p.getContractDate(),
                        p.getPricePerPyeong()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TradeAreaOptionDto> getTradeAreaOptions(Long id) {
        apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));
        return realTradeRepository.findTradeAreaOptionsByApartmentId(id)
                .stream()
                .map(p -> new TradeAreaOptionDto(
                        p.getArea(),
                        p.getTransactionCount()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PriceHistoryDto> getPriceHistory(
            Long id,
            BigDecimal exclusiveArea,
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
        apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));

        TradeFilterCriteria criteria = resolveTradeFilterCriteria(
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
                excludeOutliers
        );

        return realTradeRepository.findPriceHistoryByApartmentIdWithFilters(
                        id,
                        criteria.startDate(),
                        criteria.endDate(),
                        criteria.tradeType(),
                        exclusiveArea,
                        criteria.minPrice(),
                        criteria.maxPrice(),
                        criteria.minArea(),
                        criteria.maxArea(),
                        criteria.minFloor(),
                        criteria.maxFloor(),
                        criteria.minAge(),
                        criteria.maxAge(),
                        criteria.onlyNew(),
                        criteria.onlyLarge(),
                        criteria.complexKeyword(),
                        criteria.excludeOutliers()
                )
                .stream()
                .map(p -> new PriceHistoryDto(
                        p.getMonth(),
                        p.getAvgPrice(),
                        p.getAvgPricePerPyeong(),
                        p.getTransactionCount(),
                        toKoreanTradeType(p.getTradeType())
                ))
                .toList();
    }

    private String toKoreanTradeType(String tradeType) {
        if (tradeType == null) return "매매";
        return switch (tradeType) {
            case "SALE" -> "매매";
            case "LEASE" -> "전세";
            case "MONTHLY" -> "월세";
            default -> tradeType;
        };
    }

    private ApartmentSearchDto toApartmentSearchDto(ApartmentSearchProjection p) {
        return new ApartmentSearchDto(
                p.getId(),
                p.getComplexName(),
                p.getRoadAddress(),
                p.getSigungu(),
                p.getEupMyeonDong(),
                p.getLatitude(),
                p.getLongitude()
        );
    }

    private TradeFilterCriteria resolveTradeFilterCriteria(
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
        DateRange dateRange = resolveDateRange(period, startDate, endDate);
        PriceBounds priceBounds = resolvePriceBounds(priceRange);
        AreaBounds areaBounds = resolveAreaBounds(areaRange);
        FloorBounds floorBounds = resolveFloorBounds(floorBand);
        AgeBounds ageBounds = resolveAgeBounds(yearBand);

        return new TradeFilterCriteria(
                dateRange.startDate(),
                dateRange.endDate(),
                resolveTradeType(dealType),
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
                complexKeyword == null || complexKeyword.isBlank() ? null : complexKeyword.trim(),
                excludeOutliers
        );
    }

    private DateRange resolveDateRange(String period, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && !endDate.isBefore(startDate)) {
            return new DateRange(startDate, endDate);
        }

        if ("all".equals(period)) {
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

    private String resolveTradeType(String dealType) {
        if (dealType == null || dealType.isBlank()) return null;
        return switch (dealType) {
            case "SALE" -> "SALE";
            case "JEONSE", "LEASE" -> "LEASE";
            case "MONTHLY" -> "MONTHLY";
            default -> null;
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
    private record TradeFilterCriteria(
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
            String complexKeyword,
            boolean excludeOutliers
    ) {}
}
