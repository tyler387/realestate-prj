package com.realestate.service;

import com.realestate.domain.entity.CollectionJob;
import com.realestate.domain.repository.CollectionJobRepository;
import com.realestate.web.dto.AdminJobStatusDto;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminCollectionJobServiceTest {

    private final Map<String, CollectionJob> jobs = new HashMap<>();
    private CollectionJobRepository collectionJobRepository;
    private CollectionJobContext collectionJobContext;
    private ExecutorService executor;
    private AdminCollectionJobService service;

    @BeforeEach
    void setUp() {
        collectionJobRepository = mock(CollectionJobRepository.class);
        collectionJobContext = new CollectionJobContext();
        executor = Executors.newSingleThreadExecutor();
        service = new AdminCollectionJobService(collectionJobRepository, executor, collectionJobContext);

        when(collectionJobRepository.saveAndFlush(any(CollectionJob.class))).thenAnswer(invocation -> {
            CollectionJob job = invocation.getArgument(0);
            jobs.put(job.getJobId(), job);
            return job;
        });
        when(collectionJobRepository.findById(any(String.class))).thenAnswer(invocation ->
                Optional.ofNullable(jobs.get(invocation.getArgument(0))));
        when(collectionJobRepository.findTop20ByOrderByStartedAtDesc()).thenAnswer(invocation ->
                jobs.values()
                        .stream()
                        .sorted(Comparator.comparing(CollectionJob::getStartedAt).reversed())
                        .limit(20)
                        .toList());
        when(collectionJobRepository.findByStatus(any(String.class))).thenAnswer(invocation -> {
            String status = invocation.getArgument(0);
            return jobs.values()
                    .stream()
                    .filter(job -> status.equals(job.getStatus()))
                    .toList();
        });
    }

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    @Test
    void begin_rejectsSecondJobWhileOneIsRunning() {
        Optional<AdminCollectionJobService.JobHandle> first = service.begin("FIRST");
        Optional<AdminCollectionJobService.JobHandle> second = service.begin("SECOND");

        assertThat(first).isPresent();
        assertThat(second).isEmpty();
        assertThat(service.getRunningJob()).isPresent();

        first.get().markSucceeded();

        assertThat(service.getRunningJob()).isEmpty();
        assertThat(service.begin("THIRD")).isPresent();
    }

    @Test
    void startAsync_recordsStatusTransitionsAndStats() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);

        Optional<AdminJobStatusDto> started = service.startAsync("ASYNC", () -> {
            latch.countDown();
            return Map.of("savedTrades", 3, "duplicateTrades", 1, "skippedNoApartment", 2);
        });

        assertThat(started).isPresent();
        assertThat(started.get().status()).isEqualTo("RUNNING");
        assertThat(latch.await(2, TimeUnit.SECONDS)).isTrue();

        AdminJobStatusDto finished = waitForFinishedStatus(started.get().jobId());
        assertThat(finished.status()).isEqualTo("SUCCEEDED");
        assertThat(finished.finishedAt()).isNotNull();
        assertThat(finished.savedCount()).isEqualTo(3);
        assertThat(finished.duplicateCount()).isEqualTo(1);
        assertThat(finished.skippedCount()).isEqualTo(2);
        assertThat(collectionJobContext.getCurrentJobId()).isEmpty();
    }

    @Test
    void startAsync_recordsProgressUpdatesBeforeCompletion() throws Exception {
        CountDownLatch progressReported = new CountDownLatch(1);
        CountDownLatch allowCompletion = new CountDownLatch(1);

        Optional<AdminJobStatusDto> started = service.startAsync("ASYNC_PROGRESS", progress -> {
            progress.update("Collecting page 1", Map.of("processedCount", 2));
            progressReported.countDown();
            try {
                allowCompletion.await(2, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
            return Map.of("savedTrades", 1);
        });

        assertThat(started).isPresent();
        assertThat(progressReported.await(2, TimeUnit.SECONDS)).isTrue();

        AdminJobStatusDto running = service.getJob(started.get().jobId()).orElseThrow();
        assertThat(running.status()).isEqualTo("RUNNING");
        assertThat(running.progressMessage()).isEqualTo("Collecting page 1");
        assertThat(running.processedCount()).isEqualTo(2);

        allowCompletion.countDown();
        AdminJobStatusDto finished = waitForFinishedStatus(started.get().jobId());
        assertThat(finished.status()).isEqualTo("SUCCEEDED");
        assertThat(finished.savedCount()).isEqualTo(1);
    }

    @Test
    void failedJob_releasesLockAndRecordsError() {
        AdminCollectionJobService.JobHandle job = service.begin("FAIL").orElseThrow();

        job.markFailed(new IllegalStateException("collector failed"));

        AdminJobStatusDto failed = service.getJob(job.toDto().jobId()).orElseThrow();
        assertThat(failed.status()).isEqualTo("FAILED");
        assertThat(failed.errorMessage()).isEqualTo("collector failed");
        assertThat(service.getRunningJob()).isEmpty();
    }

    @Test
    void getRecentJobs_returnsPersistedJobs() {
        AdminCollectionJobService.JobHandle first = service.begin("FIRST").orElseThrow();
        first.markSucceeded();
        AdminCollectionJobService.JobHandle second = service.begin("SECOND").orElseThrow();
        second.markSucceeded();

        assertThat(service.getRecentJobs())
                .extracting(AdminJobStatusDto::type)
                .containsExactlyInAnyOrderElementsOf(List.of("SECOND", "FIRST"));
    }

    @Test
    void markStaleRunningJobsFailed_marksPersistedRunningJobsFailedOnStartup() {
        CollectionJob stale = CollectionJob.start("stale-job", "STALE");
        jobs.put(stale.getJobId(), stale);

        service.markStaleRunningJobsFailed();

        AdminJobStatusDto result = service.getJob(stale.getJobId()).orElseThrow();
        assertThat(result.status()).isEqualTo("FAILED");
        assertThat(result.errorMessage()).isEqualTo("Server restarted before collection job completed");
    }

    private AdminJobStatusDto waitForFinishedStatus(String jobId) throws InterruptedException {
        for (int i = 0; i < 20; i++) {
            AdminJobStatusDto job = service.getJob(jobId).orElseThrow();
            if (!"RUNNING".equals(job.status())) {
                return job;
            }
            Thread.sleep(50);
        }
        return service.getJob(jobId).orElseThrow();
    }
}
