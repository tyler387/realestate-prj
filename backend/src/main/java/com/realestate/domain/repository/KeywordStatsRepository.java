package com.realestate.domain.repository;

import com.realestate.domain.entity.KeywordStats;
import com.realestate.domain.entity.KeywordStatsId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KeywordStatsRepository extends JpaRepository<KeywordStats, KeywordStatsId> {

    // 인기 키워드 Top 10 — 최근 7일 합산 count 기준
    // CURRENT_DATE - 7 사용: stat_date(DATE)와 동일 타입으로 비교 (타입 안전)
    @Query(value = """
            SELECT keyword
            FROM keyword_stats
            WHERE stat_date >= CURRENT_DATE - 7
              AND apt_id = :aptId
            GROUP BY keyword
            ORDER BY SUM(count) DESC
            LIMIT 10
            """, nativeQuery = true)
    List<String> findTrendingKeywords(@Param("aptId") Long aptId);
}
