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

    @Column(name = "apt_id", nullable = false)
    private Long aptId;

    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "author_nickname", nullable = false, length = 60)
    private String authorNickname;

    @Column(name = "complex_name", nullable = false, length = 100)
    private String complexName;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private CommunityPost(Long aptId, String category, String title, String content, String authorNickname, String complexName) {
        this.aptId = aptId;
        this.category = category;
        this.title = title;
        this.content = content;
        this.authorNickname = authorNickname;
        this.complexName = complexName;
        this.likeCount = 0;
        this.commentCount = 0;
    }

    public static CommunityPost create(
            Long aptId,
            String category,
            String title,
            String content,
            String authorNickname,
            String complexName
    ) {
        return new CommunityPost(aptId, category, title, content, authorNickname, complexName);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
