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
@Table(name = "comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "author_nickname", nullable = false, length = 60)
    private String authorNickname;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "author_apt_id")
    private Long authorAptId;

    @Column(name = "author_apt_name", length = 100)
    private String authorAptName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private Comment(Long postId, String authorNickname, String content, Long authorAptId, String authorAptName) {
        this.postId = postId;
        this.authorNickname = authorNickname;
        this.content = content;
        this.authorAptId = authorAptId;
        this.authorAptName = authorAptName;
    }

    public static Comment create(Long postId, String authorNickname, String content, Long authorAptId, String authorAptName) {
        return new Comment(postId, authorNickname, content, authorAptId, authorAptName);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
