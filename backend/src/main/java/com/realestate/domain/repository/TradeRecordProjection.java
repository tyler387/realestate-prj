package com.realestate.domain.repository;

import java.math.BigDecimal;

public interface TradeRecordProjection {
    Long getId();
    Integer getFloor();
    BigDecimal getArea();
    String getTradeType();
    Long getTradeAmount();
    String getContractDate();
    Long getPricePerPyeong();
}
