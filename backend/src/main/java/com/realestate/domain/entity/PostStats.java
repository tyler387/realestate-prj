package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "post_stats")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostStats {

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "apt_id", nullable = false)
    private Long aptId;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "post_created_at", nullable = false)
    private LocalDateTime postCreatedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
