package com.realestate.service;

import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.web.dto.ApartmentMarkerDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;

    @Transactional(readOnly = true)
    public List<ApartmentMarkerDto> getApartmentMarkers(double swLng, double swLat, double neLng, double neLat) {
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
