package com.realestate.domain.repository;

import java.math.BigDecimal;

public interface TradeRecordProjection {
    Long getId();
    Integer getFloor();
    BigDecimal getArea();
    String getTradeType();
    Long getTradeAmount();
    Long getDepositAmount();
    Long getMonthlyRentAmount();
    String getContractDate();
    Long getPricePerPyeong();
}
