package com.realestate.domain.repository;

import com.realestate.domain.entity.PostLikeLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeLogRepository extends JpaRepository<PostLikeLog, Long> {

    boolean existsByPostIdAndAuthorNickname(Long postId, String authorNickname);

    void deleteByPostIdAndAuthorNickname(Long postId, String authorNickname);
}
