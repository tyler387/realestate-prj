package com.realestate.domain.repository;

import com.realestate.domain.entity.RealTrade;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RealTradeRepository extends JpaRepository<RealTrade, Long> {
}
