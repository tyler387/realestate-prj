package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "collection_job")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionJob {

    @Id
    @Column(name = "job_id", length = 64)
    private String jobId;

    @Column(name = "type", nullable = false, length = 100)
    private String type;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "progress_message", length = 255)
    private String progressMessage;

    @Column(name = "total_count")
    private Integer totalCount;

    @Column(name = "processed_count")
    private Integer processedCount;

    @Column(name = "saved_count")
    private Integer savedCount;

    @Column(name = "skipped_count")
    private Integer skippedCount;

    @Column(name = "duplicate_count")
    private Integer duplicateCount;

    private CollectionJob(String jobId, String type, LocalDateTime startedAt) {
        this.jobId = jobId;
        this.type = type;
        this.status = "RUNNING";
        this.startedAt = startedAt;
        this.progressMessage = "Job started";
    }

    public static CollectionJob start(String jobId, String type) {
        return new CollectionJob(jobId, type, LocalDateTime.now());
    }

    public void markSucceeded(Map<String, Integer> stats) {
        this.status = "SUCCEEDED";
        this.finishedAt = LocalDateTime.now();
        this.errorMessage = null;
        this.progressMessage = "Job completed";
        applyStats(stats);
    }

    public void markFailed(String errorMessage) {
        this.status = "FAILED";
        this.finishedAt = LocalDateTime.now();
        this.errorMessage = errorMessage;
        this.progressMessage = "Job failed";
    }

    public void updateProgress(String progressMessage, Map<String, Integer> stats) {
        this.progressMessage = progressMessage;
        applyStats(stats);
    }

    private void applyStats(Map<String, Integer> stats) {
        if (stats == null || stats.isEmpty()) return;
        this.totalCount = firstPresent(stats, "totalCount", "totalFromApi");
        this.processedCount = firstPresent(stats, "processedCount", "processed", "totalFetched");
        Integer savedCount = firstPresent(stats, "savedCount");
        this.savedCount = savedCount != null
                ? savedCount
                : sumPresent(stats, "savedTrades", "savedLeases", "savedMonthlyRents", "savedApartments", "updated");
        this.skippedCount = sumPresent(stats, "skippedCount", "skippedNoApartment", "skippedAlreadyExists", "skippedNoCoordinate");
        Integer duplicateCount = firstPresent(stats, "duplicateCount");
        this.duplicateCount = duplicateCount != null
                ? duplicateCount
                : sumPresent(stats, "duplicateTrades", "duplicateRents");
    }

    private Integer firstPresent(Map<String, Integer> stats, String... keys) {
        for (String key : keys) {
            Integer value = stats.get(key);
            if (value != null) return value;
        }
        return null;
    }

    private Integer sumPresent(Map<String, Integer> stats, String... keys) {
        int sum = 0;
        boolean found = false;
        for (String key : keys) {
            Integer value = stats.get(key);
            if (value != null) {
                sum += value;
                found = true;
            }
        }
        return found ? sum : null;
    }
}
