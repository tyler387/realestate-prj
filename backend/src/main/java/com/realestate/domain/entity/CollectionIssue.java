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
@Table(name = "collection_issue")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", length = 64)
    private String jobId;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "issue_type", nullable = false, length = 50)
    private String issueType;

    @Column(name = "sigungu", length = 50)
    private String sigungu;

    @Column(name = "eup_myeon_dong", length = 50)
    private String eupMyeonDong;

    @Column(name = "apt_name", length = 255)
    private String aptName;

    @Column(name = "lawd_cd", length = 20)
    private String lawdCd;

    @Column(name = "deal_ymd", length = 6)
    private String dealYmd;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private CollectionIssue(
            String jobId,
            String sourceType,
            String issueType,
            String sigungu,
            String eupMyeonDong,
            String aptName,
            String lawdCd,
            String dealYmd,
            String rawPayload,
            String message
    ) {
        this.jobId = jobId;
        this.sourceType = sourceType;
        this.issueType = issueType;
        this.sigungu = sigungu;
        this.eupMyeonDong = eupMyeonDong;
        this.aptName = aptName;
        this.lawdCd = lawdCd;
        this.dealYmd = dealYmd;
        this.rawPayload = rawPayload;
        this.message = message;
    }

    public static CollectionIssue create(
            String jobId,
            String sourceType,
            String issueType,
            String sigungu,
            String eupMyeonDong,
            String aptName,
            String lawdCd,
            String dealYmd,
            String rawPayload,
            String message
    ) {
        return new CollectionIssue(
                jobId,
                sourceType,
                issueType,
                sigungu,
                eupMyeonDong,
                aptName,
                lawdCd,
                dealYmd,
                rawPayload,
                message
        );
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
