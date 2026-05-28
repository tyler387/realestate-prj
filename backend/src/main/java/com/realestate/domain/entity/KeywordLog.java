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

    @Column(name = "apt_id")
    private Long aptId;

    @Column(name = "board_scope", nullable = false, length = 20)
    private String boardScope;

    @Column(name = "board_code", nullable = false, length = 40)
    private String boardCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    private KeywordLog(String keyword, String source, Long postId, Long aptId, String boardScope, String boardCode) {
        this.keyword = keyword;
        this.source = source;
        this.postId = postId;
        this.aptId = aptId;
        this.boardScope = boardScope;
        this.boardCode = boardCode;
    }

    public static KeywordLog ofPost(String keyword, Long postId, Long aptId, String boardScope, String boardCode) {
        return new KeywordLog(keyword, "POST", postId, aptId, boardScope, boardCode);
    }

    public static KeywordLog ofSearch(String keyword, Long aptId, String boardScope, String boardCode) {
        return new KeywordLog(keyword, "SEARCH", null, aptId, boardScope, boardCode);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
