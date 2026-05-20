package com.realestate.domain.repository;

public interface TradeTrendCompareProjection {
    Long getMedianPrice();
    Long getAvgPrice();
    Long getTransactionCount();
}