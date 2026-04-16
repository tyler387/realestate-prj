package com.realestate.domain.repository;

public interface TopApartmentProjection {
    Long getRank();
    Long getAptId();
    String getAptName();
    String getSigungu();
    Long getTransactionCount();
    Long getLatestSalePrice();
}
