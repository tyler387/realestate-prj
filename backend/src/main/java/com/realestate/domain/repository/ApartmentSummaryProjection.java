package com.realestate.domain.repository;

import java.time.LocalDate;

public interface ApartmentSummaryProjection {
    Long getId();
    String getComplexName();
    String getLocation();
    Integer getTotalHouseholdCount();
    Integer getCompletionYear();
    Long getRecentSalePrice();
    Double getRecentSaleArea();
    LocalDate getRecentTradeDate();
    Integer getRecent30dTradeCount();
}
