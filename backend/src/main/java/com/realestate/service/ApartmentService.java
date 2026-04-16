package com.realestate.service;

import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.ApartmentSearchProjection;
import com.realestate.domain.repository.ApartmentSummaryProjection;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.web.dto.ApartmentMarkerDto;
import com.realestate.web.dto.ApartmentSearchDto;
import com.realestate.web.dto.ApartmentSummaryDto;
import com.realestate.web.dto.PriceHistoryDto;
import com.realestate.web.dto.TradeRecordDto;
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
        if (keyword == null || keyword.trim().length() < 1) {
            return List.of();
        }
        return apartmentRepository.searchByKeyword(keyword.trim())
                .stream()
                .map(p -> new ApartmentSearchDto(
                        p.getId(),
                        p.getComplexName(),
                        p.getRoadAddress(),
                        p.getSigungu(),
                        p.getEupMyeonDong(),
                        p.getLatitude(),
                        p.getLongitude()
                ))
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
                projection.getRecentSaleArea()
        );
    }

    @Transactional(readOnly = true)
    public List<TradeRecordDto> getTradeRecords(Long id) {
        apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));
        return realTradeRepository.findRecentByApartmentId(id)
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
    public List<PriceHistoryDto> getPriceHistory(Long id) {
        apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apartment not found"));
        return realTradeRepository.findPriceHistoryByApartmentId(id)
                .stream()
                .map(p -> new PriceHistoryDto(
                        p.getMonth(),
                        p.getAvgPrice(),
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
}
