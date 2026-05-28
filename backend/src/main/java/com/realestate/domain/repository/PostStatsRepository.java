package com.realestate.domain.repository;

import com.realestate.domain.entity.PostStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostStatsRepository extends JpaRepository<PostStats, Long> {

    /**
     * 신규 게시글을 랭킹 집계 테이블에 등록한다.
     *
     * <p>post_stats는 게시글당 1row를 유지하고, board_scope/board_code를 같이 저장한다.
     * 이렇게 해두면 GLOBAL과 APARTMENT 랭킹을 같은 쿼리 구조로 읽을 수 있고,
     * 공통게시판의 null apt_id도 안전하게 처리된다.
     */
    @Modifying
    @Query(value = """
            INSERT INTO post_stats (
                post_id,
                apt_id,
                board_scope,
                board_code,
                view_count,
                like_count,
                comment_count,
                score,
                post_created_at,
                updated_at
            )
            SELECT
                p.id,
                p.apt_id,
                p.board_scope,
                p.board_code,
                0,
                p.like_count,
                p.comment_count,
                (p.like_count * 2 + p.comment_count),
                p.created_at,
                NOW()
            FROM posts p
            WHERE p.id = :postId
            ON CONFLICT (post_id) DO UPDATE SET
                apt_id = EXCLUDED.apt_id,
                board_scope = EXCLUDED.board_scope,
                board_code = EXCLUDED.board_code,
                like_count = EXCLUDED.like_count,
                comment_count = EXCLUDED.comment_count,
                score = EXCLUDED.score,
                post_created_at = EXCLUDED.post_created_at,
                updated_at = NOW()
            """, nativeQuery = true)
    void upsertFromPost(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE PostStats s SET s.viewCount = s.viewCount + 1, s.updatedAt = CURRENT_TIMESTAMP WHERE s.postId = :postId")
    void incrementViewCount(@Param("postId") Long postId);

    @Modifying
    @Query("""
            UPDATE PostStats s
            SET s.likeCount = s.likeCount + 1,
                s.score = s.score + 2,
                s.updatedAt = CURRENT_TIMESTAMP
            WHERE s.postId = :postId
            """)
    void incrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Query("""
            UPDATE PostStats s
            SET s.likeCount = GREATEST(s.likeCount - 1, 0),
                s.score = GREATEST(s.score - 2, 0),
                s.updatedAt = CURRENT_TIMESTAMP
            WHERE s.postId = :postId
            """)
    void decrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Query("""
            UPDATE PostStats s
            SET s.commentCount = s.commentCount + 1,
                s.score = s.score + 1,
                s.updatedAt = CURRENT_TIMESTAMP
            WHERE s.postId = :postId
            """)
    void incrementCommentCount(@Param("postId") Long postId);

    @Modifying
    @Query("""
            UPDATE PostStats s
            SET s.commentCount = GREATEST(s.commentCount - 1, 0),
                s.score = GREATEST(s.score - 1, 0),
                s.updatedAt = CURRENT_TIMESTAMP
            WHERE s.postId = :postId
            """)
    void decrementCommentCount(@Param("postId") Long postId);
}
