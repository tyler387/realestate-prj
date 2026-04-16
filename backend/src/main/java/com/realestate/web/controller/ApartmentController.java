package com.realestate.web.controller;

import com.realestate.service.ApartmentService;
import com.realestate.web.dto.ApartmentMarkerDto;
import com.realestate.web.dto.ApartmentSearchDto;
import com.realestate.web.dto.ApartmentSummaryDto;
import com.realestate.web.dto.PriceHistoryDto;
import com.realestate.web.dto.TradeRecordDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;

    @GetMapping("/markers")
    public List<ApartmentMarkerDto> getMarkers(
            @RequestParam double swLng,
            @RequestParam double swLat,
            @RequestParam double neLng,
            @RequestParam double neLat
    ) {
        return apartmentService.getApartmentMarkers(swLng, swLat, neLng, neLat);
    }

    @GetMapping("/search")
    public List<ApartmentSearchDto> search(@RequestParam String keyword) {
        return apartmentService.searchApartments(keyword);
    }

    @GetMapping("/{id}/summary")
    public ApartmentSummaryDto getSummary(@PathVariable Long id) {
        return apartmentService.getApartmentSummary(id);
    }

    @GetMapping("/{id}/trades")
    public List<TradeRecordDto> getTrades(@PathVariable Long id) {
        return apartmentService.getTradeRecords(id);
    }

    @GetMapping("/{id}/price-history")
    public List<PriceHistoryDto> getPriceHistory(@PathVariable Long id) {
        return apartmentService.getPriceHistory(id);
    }
}
