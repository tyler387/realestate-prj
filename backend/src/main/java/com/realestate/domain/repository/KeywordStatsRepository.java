package com.realestate.domain.repository;

import com.realestate.domain.entity.KeywordStats;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KeywordStatsRepository extends JpaRepository<KeywordStats, Long> {

    /**
     * 게시글 작성 시 추출한 키워드를 일별/게시판별 집계에 즉시 반영한다.
     *
     * <p>GLOBAL 게시판은 apt_id가 null이므로 scope_apt_key=-1로 유일성을 보장한다.
     * APARTMENT 게시판은 실제 apt_id를 scope_apt_key로 사용해 단지별 키워드가 섞이지 않게 한다.
     */
    @Modifying
    @Query(value = """
            INSERT INTO keyword_stats (
                keyword,
                apt_id,
                board_scope,
                board_code,
                scope_apt_key,
                stat_date,
                count
            )
            VALUES (
                :keyword,
                :aptId,
                :boardScope,
                :boardCode,
                :scopeAptKey,
                CURRENT_DATE,
                1
            )
            ON CONFLICT (keyword, board_scope, board_code, scope_apt_key, stat_date)
            DO UPDATE SET count = keyword_stats.count + 1
            """, nativeQuery = true)
    void incrementKeyword(
            @Param("keyword") String keyword,
            @Param("aptId") Long aptId,
            @Param("boardScope") String boardScope,
            @Param("boardCode") String boardCode,
            @Param("scopeAptKey") Long scopeAptKey
    );

    /**
     * 인기 키워드 Top 10.
     *
     * <p>boardCode가 null이면 해당 scope/aptId 전체 board를 합산한다.
     * boardCode가 있으면 특정 게시판 키워드만 집계한다.
     */
    @Query(value = """
            SELECT keyword
            FROM keyword_stats
            WHERE stat_date >= CURRENT_DATE - 7
              AND board_scope = :boardScope
              AND (:boardCode IS NULL OR board_code = :boardCode)
              AND (
                  (:boardScope = 'GLOBAL' AND scope_apt_key = -1)
                  OR (:boardScope = 'APARTMENT' AND apt_id = :aptId)
              )
            GROUP BY keyword
            ORDER BY SUM(count) DESC
            LIMIT 10
            """, nativeQuery = true)
    List<String> findTrendingKeywords(
            @Param("boardScope") String boardScope,
            @Param("aptId") Long aptId,
            @Param("boardCode") String boardCode
    );
}
