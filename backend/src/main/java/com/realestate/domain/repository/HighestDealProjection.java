package com.realestate.domain.repository;

import java.math.BigDecimal;

public interface HighestDealProjection {
    Long getAptId();
    String getAptName();
    Long getPrice();
    String getDealDate();
    BigDecimal getArea();
}
