package com.realestate.domain.repository;

import com.realestate.domain.entity.KeywordLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KeywordLogRepository extends JpaRepository<KeywordLog, Long> {
}
