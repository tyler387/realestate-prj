package com.realestate.domain.repository;

import com.realestate.domain.entity.PostLikeLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeLogRepository extends JpaRepository<PostLikeLog, Long> {

    Optional<PostLikeLog> findByPostIdAndAuthorNickname(Long postId, String authorNickname);

    boolean existsByPostIdAndAuthorNickname(Long postId, String authorNickname);
}
