package com.realestate.service;

import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.web.dto.ApartmentMarkerDto;
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
}
