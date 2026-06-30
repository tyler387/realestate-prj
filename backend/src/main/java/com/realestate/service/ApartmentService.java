package com.realestate.service;

import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.ApartmentSearchProjection;
import com.realestate.domain.repository.ApartmentSummaryProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.service.trade.TradeFilterCriteria;
import com.realestate.service.trade.TradeFilterCriteriaResolver;
import com.realestate.web.dto.ApartmentMarkerDto;
import com.realestate.web.dto.ApartmentSearchDto;
import com.realestate.web.dto.ApartmentSummaryDto;
import com.realestate.web.dto.PriceHistoryDto;
import com.realestate.web.dto.TradeAreaOptionDto;
import com.realestate.web.dto.TradeRecordDto;
import com.realestate.web.dto.TradeRecordResponseDto;
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

    private static final int TRADE_RECORD_LIMIT = 500;

    private final ApartmentRepository apartmentRepository;
    private final RealTradeRepository realTradeRepository;
    private final TradeFilterCriteriaResolver tradeFilterCriteriaResolver;

    @Transactional(readOnly = true)
    public List<ApartmentMarkerDto> getApartmentMarkers(
            double swLng,
            double swLat,
            double neLng,
            double neLat,
            String dealType
    ) {
        if (swLng < -180 || swLng > 180 || neLng < -180 || neLng > 180
                || swLat < -90 || swLat > 90 || neLat < -90 || neLat > 90
                || swLng >= neLng || swLat >= neLat) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coordinate bounds");
        }
        String markerDealType = normalizeMarkerDealType(dealType);
        return apartmentRepository.findMarkersByViewport(swLng, swLat, neLng, neLat, markerDealType)
                .stream()
                .map(projection -> new ApartmentMarkerDto(
                        projection.getId(),
                        projection.getComplexName(),
                        projection.getSigungu(),
                        projection.getEupMyeonDong(),
                        projection.getLatitude(),
                        projection.getLongitude(),
                        projection.getLatestSalePrice(),
                        projection.getLatestSaleArea(),
                        projection.getLatestTradeDate(),
                        projection.getLatestTradeType()
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
    public TradeRecordResponseDto getTradeRecords(
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

        TradeFilterCriteria criteria = tradeFilterCriteriaResolver.resolveForDetail(
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

        var projections = realTradeRepository.findRecentByApartmentIdWithFilters(
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
                criteria.excludeOutliers(),
                TRADE_RECORD_LIMIT + 1
        );

        boolean hasMore = projections.size() > TRADE_RECORD_LIMIT;
        var visibleProjections = hasMore ? projections.subList(0, TRADE_RECORD_LIMIT) : projections;
        List<TradeRecordDto> records = visibleProjections
                .stream()
                .map(p -> new TradeRecordDto(
                        p.getId(),
                        p.getFloor(),
                        p.getArea(),
                        toKoreanTradeType(p.getTradeType()),
                        p.getTradeAmount(),
                        p.getDepositAmount(),
                        p.getMonthlyRentAmount(),
                        p.getContractDate(),
                        p.getPricePerPyeong()
                ))
                .toList();

        return new TradeRecordResponseDto(records, records.size(), TRADE_RECORD_LIMIT, hasMore);
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

        TradeFilterCriteria criteria = tradeFilterCriteriaResolver.resolveForDetail(
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
        if (tradeType == null) return "\uB9E4\uB9E4";
        return switch (tradeType) {
            case "SALE" -> "\uB9E4\uB9E4";
            case "LEASE" -> "\uC804\uC138";
            case "MONTHLY" -> "\uC6D4\uC138";
            default -> tradeType;
        };
    }

    private String normalizeMarkerDealType(String dealType) {
        if (dealType == null || dealType.isBlank()) return null;
        return switch (dealType.trim().toUpperCase()) {
            case "SALE" -> "SALE";
            case "JEONSE", "LEASE" -> "LEASE";
            default -> null;
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
}
