package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "apt_id")
    private Long aptId;

    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Column(name = "board_scope", nullable = false, length = 20)
    private String boardScope;

    @Column(name = "board_code", nullable = false, length = 40)
    private String boardCode;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "author_nickname", nullable = false, length = 60)
    private String authorNickname;

    @Column(name = "complex_name", nullable = false, length = 100)
    private String complexName;

    @Column(name = "author_user_id")
    private Long authorUserId;

    @Column(name = "author_verified_apt_id")
    private Long authorVerifiedAptId;

    @Column(name = "author_verified_apt_name", length = 100)
    private String authorVerifiedAptName;

    @Column(name = "author_verification_label", length = 120)
    private String authorVerificationLabel;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private CommunityPost(
            Long aptId,
            String category,
            String boardScope,
            String boardCode,
            String title,
            String content,
            String authorNickname,
            String complexName,
            Long authorUserId,
            Long authorVerifiedAptId,
            String authorVerifiedAptName,
            String authorVerificationLabel
    ) {
        this.aptId = aptId;
        this.category = category;
        this.boardScope = boardScope;
        this.boardCode = boardCode;
        this.title = title;
        this.content = content;
        this.authorNickname = authorNickname;
        this.complexName = complexName;
        this.authorUserId = authorUserId;
        this.authorVerifiedAptId = authorVerifiedAptId;
        this.authorVerifiedAptName = authorVerifiedAptName;
        this.authorVerificationLabel = authorVerificationLabel;
        this.likeCount = 0;
        this.commentCount = 0;
    }

    public static CommunityPost create(
            Long aptId,
            String category,
            String boardScope,
            String boardCode,
            String title,
            String content,
            String authorNickname,
            String complexName,
            Long authorUserId,
            Long authorVerifiedAptId,
            String authorVerifiedAptName,
            String authorVerificationLabel
    ) {
        return new CommunityPost(
                aptId,
                category,
                boardScope,
                boardCode,
                title,
                content,
                authorNickname,
                complexName,
                authorUserId,
                authorVerifiedAptId,
                authorVerifiedAptName,
                authorVerificationLabel
        );
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
