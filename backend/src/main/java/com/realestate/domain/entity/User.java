package com.realestate.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    @Column(name = "oauth_id", length = 100)
    private String oauthId;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.MEMBER;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "apartment_name")
    private String apartmentName;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum UserStatus { MEMBER, VERIFIED }

    @Builder
    public User(String email, String passwordHash, String nickname, boolean marketingAgreed) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.marketingAgreed = marketingAgreed;
    }

    public static User createOAuthUser(String email, String nickname, String oauthProvider, String oauthId) {
        User user = new User();
        user.email = email;
        user.nickname = nickname;
        user.oauthProvider = oauthProvider;
        user.oauthId = oauthId;
        user.marketingAgreed = false;
        return user;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void verify(Long apartmentId, String apartmentName) {
        this.status = UserStatus.VERIFIED;
        this.apartmentId = apartmentId;
        this.apartmentName = apartmentName;
    }

    public void updatePassword(String encodedPassword) {
        this.passwordHash = encodedPassword;
    }
}
