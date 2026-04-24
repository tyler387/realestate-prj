package com.realestate.domain.repository;

import com.realestate.domain.entity.PostStats;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostStatsRepository extends JpaRepository<PostStats, Long> {

    // 인기 글 Top 5 — score(좋아요*2+댓글) 내림차순
    // days=1 → 24시간, days=7 → 7일 (Service에서 fallback 처리)
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - (INTERVAL '1 day' * :days)
            ORDER BY s.score DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findPopularPosts(@Param("aptId") Long aptId, @Param("days") int days);

    // 댓글 많은 글 Top 5 — comment_count 내림차순
    // days=1 → 24시간, days=7 → 7일 (Service에서 fallback 처리)
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - (INTERVAL '1 day' * :days)
              AND s.comment_count > 0
            ORDER BY s.comment_count DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findMostCommentedPosts(@Param("aptId") Long aptId, @Param("days") int days);
}
