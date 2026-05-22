package com.realestate.domain.repository;

import java.math.BigDecimal;

public interface TradeAreaOptionProjection {
    BigDecimal getArea();
    Long getTransactionCount();
}
