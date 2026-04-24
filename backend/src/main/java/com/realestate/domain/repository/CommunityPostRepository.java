package com.realestate.domain.repository;

import com.realestate.domain.entity.CommunityPost;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    List<CommunityPost> findByAptIdOrderByCreatedAtDesc(Long aptId);

    List<CommunityPost> findByAptIdOrderByCreatedAtDesc(Long aptId, Pageable pageable);

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
            WHERE p.aptId = :aptId
            ORDER BY p.commentCount DESC, p.createdAt DESC
            """)
    List<CommunityPost> findMostCommentedByAptId(@Param("aptId") Long aptId,
            org.springframework.data.domain.Pageable pageable);
}
