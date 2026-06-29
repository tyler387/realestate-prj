package com.realestate.service;

import com.realestate.domain.entity.CollectionJob;
import com.realestate.domain.repository.CollectionJobRepository;
import com.realestate.web.dto.AdminJobStatusDto;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AdminCollectionJobService {

    private final CollectionJobRepository collectionJobRepository;
    private final Executor collectionJobExecutor;
    private final CollectionJobContext collectionJobContext;
    private final AtomicReference<String> runningJobId = new AtomicReference<>();

    public AdminCollectionJobService(
            CollectionJobRepository collectionJobRepository,
            @Qualifier("collectionJobExecutor") Executor collectionJobExecutor,
            CollectionJobContext collectionJobContext
    ) {
        this.collectionJobRepository = collectionJobRepository;
        this.collectionJobExecutor = collectionJobExecutor;
        this.collectionJobContext = collectionJobContext;
    }

    @PostConstruct
    void markStaleRunningJobsFailed() {
        collectionJobRepository.findByStatus("RUNNING").forEach(job -> {
            job.markFailed("Server restarted before collection job completed");
            collectionJobRepository.saveAndFlush(job);
        });
    }

    public Optional<AdminJobStatusDto> startAsync(String type, JobTask task) {
        Optional<JobHandle> handle = begin(type);
        if (handle.isEmpty()) {
            return Optional.empty();
        }

        JobHandle job = handle.get();
        try {
            CompletableFuture.runAsync(() -> {
                try {
                    collectionJobContext.setCurrentJobId(job.jobId());
                    Map<String, Integer> stats = task.run(job::updateProgress);
                    job.markSucceeded(stats);
                } catch (RuntimeException | Error ex) {
                    job.markFailed(ex);
                    log.error("Collection job failed. jobId={}, type={}", job.jobId(), type, ex);
                    throw ex;
                } finally {
                    collectionJobContext.clear();
                }
            }, collectionJobExecutor);
        } catch (RuntimeException ex) {
            job.markFailed(ex);
            log.error("Collection job submission failed. jobId={}, type={}", job.jobId(), type, ex);
            throw ex;
        }

        return Optional.of(job.toDto());
    }

    public Optional<AdminJobStatusDto> startAsync(String type, SimpleJobTask task) {
        return startAsync(type, progress -> task.run());
    }

    public Optional<JobHandle> begin(String type) {
        String jobId = UUID.randomUUID().toString();
        if (!runningJobId.compareAndSet(null, jobId)) {
            return Optional.empty();
        }

        CollectionJob job = CollectionJob.start(jobId, type);
        try {
            collectionJobRepository.saveAndFlush(job);
            return Optional.of(new JobHandle(jobId));
        } catch (RuntimeException ex) {
            runningJobId.compareAndSet(jobId, null);
            throw ex;
        }
    }

    public Optional<AdminJobStatusDto> getJob(String jobId) {
        return collectionJobRepository.findById(jobId).map(this::toDto);
    }

    public Optional<AdminJobStatusDto> getRunningJob() {
        String jobId = runningJobId.get();
        return jobId == null ? Optional.empty() : getJob(jobId);
    }

    public List<AdminJobStatusDto> getRecentJobs() {
        return collectionJobRepository.findTop20ByOrderByStartedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public class JobHandle {
        private final String jobId;

        private JobHandle(String jobId) {
            this.jobId = jobId;
        }

        public String jobId() {
            return jobId;
        }

        public AdminJobStatusDto toDto() {
            return getJob(jobId).orElseThrow();
        }

        public void markSucceeded() {
            markSucceeded(Map.of());
        }

        public void markSucceeded(Map<String, Integer> stats) {
            CollectionJob job = collectionJobRepository.findById(jobId).orElseThrow();
            job.markSucceeded(stats);
            collectionJobRepository.saveAndFlush(job);
            runningJobId.compareAndSet(jobId, null);
        }

        public void markFailed(Throwable ex) {
            CollectionJob job = collectionJobRepository.findById(jobId).orElseThrow();
            job.markFailed(ex.getMessage());
            collectionJobRepository.saveAndFlush(job);
            runningJobId.compareAndSet(jobId, null);
        }

        public void updateProgress(String progressMessage, Map<String, Integer> stats) {
            CollectionJob job = collectionJobRepository.findById(jobId).orElseThrow();
            job.updateProgress(progressMessage, stats);
            collectionJobRepository.saveAndFlush(job);
        }
    }

    private AdminJobStatusDto toDto(CollectionJob job) {
        return new AdminJobStatusDto(
                job.getJobId(),
                job.getType(),
                job.getStatus(),
                job.getStartedAt(),
                job.getFinishedAt(),
                job.getErrorMessage(),
                job.getProgressMessage(),
                job.getTotalCount(),
                job.getProcessedCount(),
                job.getSavedCount(),
                job.getSkippedCount(),
                job.getDuplicateCount()
        );
    }

    @FunctionalInterface
    public interface JobTask {
        Map<String, Integer> run(ProgressSink progress);
    }

    @FunctionalInterface
    public interface SimpleJobTask {
        Map<String, Integer> run();
    }

    @FunctionalInterface
    public interface ProgressSink {
        void update(String progressMessage, Map<String, Integer> stats);
    }
}
