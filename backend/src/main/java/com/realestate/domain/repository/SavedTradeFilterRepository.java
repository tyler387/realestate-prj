package com.realestate.domain.repository;

import com.realestate.domain.entity.SavedTradeFilter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedTradeFilterRepository extends JpaRepository<SavedTradeFilter, Long> {
    List<SavedTradeFilter> findByUserIdOrderByUpdatedAtDesc(Long userId);
    long countByUserId(Long userId);
    Optional<SavedTradeFilter> findByIdAndUserId(Long id, Long userId);
}
