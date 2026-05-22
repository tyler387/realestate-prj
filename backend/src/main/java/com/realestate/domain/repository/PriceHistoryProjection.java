package com.realestate.domain.repository;

public interface PriceHistoryProjection {
    String getMonth();
    Long getAvgPrice();
    Long getAvgPricePerPyeong();
    Long getTransactionCount();
    String getTradeType();
}
