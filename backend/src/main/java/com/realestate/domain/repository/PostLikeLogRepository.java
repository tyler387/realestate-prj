package com.realestate.domain.repository;

import com.realestate.domain.entity.PostLikeLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeLogRepository extends JpaRepository<PostLikeLog, Long> {

    boolean existsByPostIdAndAuthorNickname(Long postId, String authorNickname);

    void deleteByPostIdAndAuthorNickname(Long postId, String authorNickname);

    void deleteByPostId(Long postId);

    // 회원 탈퇴 시 해당 사용자의 좋아요 기록 일괄 삭제 (닉네임 재사용 충돌 방지)
    void deleteByAuthorNickname(String authorNickname);
}
