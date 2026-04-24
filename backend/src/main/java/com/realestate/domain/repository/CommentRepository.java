package com.realestate.domain.repository;

import com.realestate.domain.entity.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    Optional<Comment> findByIdAndAuthorNickname(Long id, String authorNickname);

    List<Comment> findByAuthorNicknameOrderByCreatedAtDesc(String authorNickname);
}
