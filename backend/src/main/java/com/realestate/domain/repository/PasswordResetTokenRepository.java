package com.realestate.domain.repository;

import com.realestate.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // 가장 최근에 발급된 미사용 토큰 1개 조회 — 재발급 시 이전 코드를 무시하기 위해 최신순 정렬
    Optional<PasswordResetToken> findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);

    // 재요청 또는 회원 탈퇴 시 해당 사용자의 토큰 전체 삭제 (user_id FK ON DELETE CASCADE 보완)
    void deleteByUserId(Long userId);
}
