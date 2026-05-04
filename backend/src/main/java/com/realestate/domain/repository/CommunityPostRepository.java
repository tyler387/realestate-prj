package com.realestate.domain.repository;

import com.realestate.domain.entity.CommunityPost;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    List<CommunityPost> findByAptIdOrderByCreatedAtDesc(Long aptId);

    List<CommunityPost> findByAptIdOrderByCreatedAtDesc(Long aptId, Pageable pageable);

    List<CommunityPost> findByAuthorNicknameOrderByCreatedAtDesc(String authorNickname);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
    void incrementCommentCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.commentCount = GREATEST(p.commentCount - 1, 0) WHERE p.id = :id")
    void decrementCommentCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.likeCount = GREATEST(p.likeCount - 1, 0) WHERE p.id = :id")
    void decrementLikeCount(@Param("id") Long id);

    List<CommunityPost> findByAptIdAndCategoryOrderByCreatedAtDesc(Long aptId, String category);

    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.aptId = :aptId
            ORDER BY (p.likeCount * 2 + p.commentCount) DESC, p.createdAt DESC
            """)
    List<CommunityPost> findPopularByAptId(@Param("aptId") Long aptId,
            org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.aptId = :aptId AND p.commentCount > 0
            ORDER BY p.commentCount DESC, p.createdAt DESC
            """)
    List<CommunityPost> findMostCommentedByAptId(@Param("aptId") Long aptId,
            org.springframework.data.domain.Pageable pageable);

    // 회원 탈퇴 시 작성자 닉네임을 익명으로 일괄 변경
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE CommunityPost p SET p.authorNickname = :newNick WHERE p.authorNickname = :oldNick")
    void updateAuthorNickname(@Param("oldNick") String oldNick, @Param("newNick") String newNick);
}
