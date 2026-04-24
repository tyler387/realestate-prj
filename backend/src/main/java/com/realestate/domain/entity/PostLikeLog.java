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
@Table(name = "post_like_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostLikeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "author_nickname", nullable = false, length = 60)
    private String authorNickname;

    @Column(name = "apt_id", nullable = false)
    private Long aptId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private PostLikeLog(Long postId, String authorNickname, Long aptId) {
        this.postId = postId;
        this.authorNickname = authorNickname;
        this.aptId = aptId;
    }

    public static PostLikeLog create(Long postId, String authorNickname, Long aptId) {
        return new PostLikeLog(postId, authorNickname, aptId);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
