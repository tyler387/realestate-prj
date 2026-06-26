package com.realestate.service;

import com.realestate.web.dto.AdminJobStatusDto;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;

@Service
public class AdminCollectionJobService {

    private static final int RECENT_JOB_LIMIT = 20;

    private final ConcurrentMap<String, MutableAdminJob> jobs = new ConcurrentHashMap<>();
    private final AtomicReference<String> runningJobId = new AtomicReference<>();

    public Optional<AdminJobStatusDto> startAsync(String type, Runnable task) {
        Optional<JobHandle> handle = begin(type);
        if (handle.isEmpty()) {
            return Optional.empty();
        }

        JobHandle job = handle.get();
        CompletableFuture.runAsync(() -> {
            try {
                task.run();
                job.markSucceeded();
            } catch (RuntimeException | Error ex) {
                job.markFailed(ex);
                throw ex;
            }
        });

        return Optional.of(job.toDto());
    }

    public Optional<JobHandle> begin(String type) {
        String jobId = UUID.randomUUID().toString();
        if (!runningJobId.compareAndSet(null, jobId)) {
            return Optional.empty();
        }

        MutableAdminJob job = new MutableAdminJob(jobId, type, "RUNNING", LocalDateTime.now(), null, null);
        jobs.put(jobId, job);
        return Optional.of(new JobHandle(job));
    }

    public Optional<AdminJobStatusDto> getJob(String jobId) {
        MutableAdminJob job = jobs.get(jobId);
        return job == null ? Optional.empty() : Optional.of(job.toDto());
    }

    public Optional<AdminJobStatusDto> getRunningJob() {
        String jobId = runningJobId.get();
        return jobId == null ? Optional.empty() : getJob(jobId);
    }

    public List<AdminJobStatusDto> getRecentJobs() {
        return jobs.values()
                .stream()
                .sorted(Comparator.comparing(MutableAdminJob::startedAt).reversed())
                .limit(RECENT_JOB_LIMIT)
                .map(MutableAdminJob::toDto)
                .toList();
    }

    public class JobHandle {
        private final MutableAdminJob job;

        private JobHandle(MutableAdminJob job) {
            this.job = job;
        }

        public AdminJobStatusDto toDto() {
            return job.toDto();
        }

        public void markSucceeded() {
            finish("SUCCEEDED", null);
        }

        public void markFailed(Throwable ex) {
            finish("FAILED", ex.getMessage());
        }

        private void finish(String status, String errorMessage) {
            job.finish(status, LocalDateTime.now(), errorMessage);
            runningJobId.compareAndSet(job.jobId(), null);
        }
    }

    private static final class MutableAdminJob {
        private final String jobId;
        private final String type;
        private final LocalDateTime startedAt;
        private volatile String status;
        private volatile LocalDateTime finishedAt;
        private volatile String errorMessage;

        private MutableAdminJob(
                String jobId,
                String type,
                String status,
                LocalDateTime startedAt,
                LocalDateTime finishedAt,
                String errorMessage
        ) {
            this.jobId = jobId;
            this.type = type;
            this.status = status;
            this.startedAt = startedAt;
            this.finishedAt = finishedAt;
            this.errorMessage = errorMessage;
        }

        private String jobId() {
            return jobId;
        }

        private LocalDateTime startedAt() {
            return startedAt;
        }

        private void finish(String status, LocalDateTime finishedAt, String errorMessage) {
            this.status = status;
            this.finishedAt = finishedAt;
            this.errorMessage = errorMessage;
        }

        private AdminJobStatusDto toDto() {
            return new AdminJobStatusDto(jobId, type, status, startedAt, finishedAt, errorMessage);
        }
    }
}
