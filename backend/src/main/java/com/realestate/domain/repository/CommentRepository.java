package com.realestate.domain.repository;

import com.realestate.domain.entity.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    Optional<Comment> findByIdAndAuthorNickname(Long id, String authorNickname);

    List<Comment> findByAuthorNicknameOrderByCreatedAtDesc(String authorNickname);

    void deleteByPostId(Long postId);

    // 회원 탈퇴 시 작성자 닉네임을 익명으로 일괄 변경
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Comment c SET c.authorNickname = :newNick WHERE c.authorNickname = :oldNick")
    void updateAuthorNickname(@Param("oldNick") String oldNick, @Param("newNick") String newNick);
}
