package com.realestate.web.dto;

public record ApartmentSearchDto(
        Long id,
        String complexName,
        String roadAddress,
        String sigungu,
        String eupMyeonDong,
        Double latitude,
        Double longitude
) {
}
