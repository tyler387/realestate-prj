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
@Table(name = "keyword_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KeywordLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keyword", nullable = false, length = 50)
    private String keyword;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "apt_id", nullable = false)
    private Long aptId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private KeywordLog(String keyword, String source, Long postId, Long aptId) {
        this.keyword = keyword;
        this.source = source;
        this.postId = postId;
        this.aptId = aptId;
    }

    public static KeywordLog ofPost(String keyword, Long postId, Long aptId) {
        return new KeywordLog(keyword, "POST", postId, aptId);
    }

    public static KeywordLog ofSearch(String keyword, Long aptId) {
        return new KeywordLog(keyword, "SEARCH", null, aptId);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
