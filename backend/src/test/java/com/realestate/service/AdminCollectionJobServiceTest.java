package com.realestate.service;

import com.realestate.web.dto.AdminJobStatusDto;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AdminCollectionJobServiceTest {

    @Test
    void begin_rejectsSecondJobWhileOneIsRunning() {
        AdminCollectionJobService service = new AdminCollectionJobService();

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
    void startAsync_recordsStatusTransitions() throws Exception {
        AdminCollectionJobService service = new AdminCollectionJobService();
        CountDownLatch latch = new CountDownLatch(1);

        Optional<AdminJobStatusDto> started = service.startAsync("ASYNC", latch::countDown);

        assertThat(started).isPresent();
        assertThat(started.get().status()).isEqualTo("RUNNING");
        assertThat(latch.await(2, TimeUnit.SECONDS)).isTrue();

        AdminJobStatusDto finished = waitForFinishedStatus(service, started.get().jobId());
        assertThat(finished.status()).isEqualTo("SUCCEEDED");
        assertThat(finished.finishedAt()).isNotNull();
    }

    @Test
    void failedJob_releasesLockAndRecordsError() {
        AdminCollectionJobService service = new AdminCollectionJobService();
        AdminCollectionJobService.JobHandle job = service.begin("FAIL").orElseThrow();

        job.markFailed(new IllegalStateException("collector failed"));

        AdminJobStatusDto failed = service.getJob(job.toDto().jobId()).orElseThrow();
        assertThat(failed.status()).isEqualTo("FAILED");
        assertThat(failed.errorMessage()).isEqualTo("collector failed");
        assertThat(service.getRunningJob()).isEmpty();
    }

    private AdminJobStatusDto waitForFinishedStatus(AdminCollectionJobService service, String jobId) throws InterruptedException {
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
