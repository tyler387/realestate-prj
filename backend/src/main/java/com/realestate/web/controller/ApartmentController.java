package com.realestate.web.controller;

import com.realestate.service.ApartmentService;
import com.realestate.web.dto.ApartmentMarkerDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/apartments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
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
}
