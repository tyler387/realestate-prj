package com.realestate.domain.repository;

public interface PriceHistoryProjection {
    String getMonth();
    Long getAvgPrice();
    String getTradeType();
}
