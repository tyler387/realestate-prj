package com.realestate.domain.repository;

import com.realestate.domain.entity.PostStats;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostStatsRepository extends JpaRepository<PostStats, Long> {

    // 인기 글 Top 5 — 최근 24시간 기준, score(좋아요*2+댓글) 내림차순
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - INTERVAL '1 day'
            ORDER BY s.score DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findPopularPosts(@Param("aptId") Long aptId);

    // Fallback: 24시간 내 3건 미만이면 7일로 확장
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - INTERVAL '7 days'
            ORDER BY s.score DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findPopularPostsFallback(@Param("aptId") Long aptId);

    // 댓글 많은 글 Top 5 — 최근 24시간, 댓글 수 내림차순
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - INTERVAL '1 day'
              AND s.comment_count > 0
            ORDER BY s.comment_count DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findMostCommentedPosts(@Param("aptId") Long aptId);

    // Fallback: 7일로 확장
    @Query(value = """
            SELECT p.id, p.apt_id, p.category, p.title, p.content,
                   p.author_nickname, p.complex_name, p.created_at,
                   s.like_count, s.comment_count
            FROM post_stats s
            JOIN posts p ON p.id = s.post_id
            WHERE s.apt_id = :aptId
              AND s.post_created_at > NOW() - INTERVAL '7 days'
              AND s.comment_count > 0
            ORDER BY s.comment_count DESC, s.post_created_at DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findMostCommentedPostsFallback(@Param("aptId") Long aptId);
}
