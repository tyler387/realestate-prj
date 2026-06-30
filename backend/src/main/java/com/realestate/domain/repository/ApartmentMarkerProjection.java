package com.realestate.domain.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ApartmentMarkerProjection {
    Long getId();

    String getComplexName();

    String getSigungu();

    String getEupMyeonDong();

    Double getLatitude();

    Double getLongitude();

    Long getLatestSalePrice();

    BigDecimal getLatestSaleArea();

    LocalDate getLatestTradeDate();

    String getLatestTradeType();
}
