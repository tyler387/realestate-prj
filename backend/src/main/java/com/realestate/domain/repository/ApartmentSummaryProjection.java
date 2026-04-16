package com.realestate.domain.repository;

public interface ApartmentSummaryProjection {
    Long getId();
    String getComplexName();
    String getLocation();
    Integer getTotalHouseholdCount();
    Integer getCompletionYear();
    Long getRecentSalePrice();
    Double getRecentSaleArea();
}
