package com.realestate.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "password_reset_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // SecureRandom으로 생성한 6자리 숫자 문자열 (generateCode 참고)
    @Column(nullable = false, length = 6)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // 사용 후 재사용을 막기 위한 플래그 — confirmReset 성공 시 true로 전환
    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /** 정적 팩토리 메서드 — 생성자 대신 사용하여 불변 필드를 명확히 한다. */
    public static PasswordResetToken create(Long userId, String token, LocalDateTime expiresAt) {
        PasswordResetToken t = new PasswordResetToken();
        t.userId = userId;
        t.token = token;
        t.expiresAt = expiresAt;
        return t;
    }

    /** 현재 시각이 만료 시각을 지났으면 true를 반환한다. */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /** confirmReset 성공 시 호출하여 동일 코드로 재사용하지 못하게 한다. */
    public void markUsed() {
        this.used = true;
    }
}
