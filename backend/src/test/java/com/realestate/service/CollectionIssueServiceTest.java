package com.realestate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realestate.domain.entity.CollectionIssue;
import com.realestate.domain.repository.CollectionIssueRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

class CollectionIssueServiceTest {

    private final CollectionIssueRepository collectionIssueRepository = mock(CollectionIssueRepository.class);
    private final CollectionJobContext collectionJobContext = new CollectionJobContext();
    private final CollectionIssueService service = new CollectionIssueService(collectionIssueRepository, collectionJobContext);

    @Test
    void recordIssue_savesIssueWithCurrentJobIdAndRawPayload() throws Exception {
        collectionJobContext.setCurrentJobId("job-1");
        when(collectionIssueRepository.existsDuplicate(
                eq("REAL_TRADE"),
                eq("NO_APARTMENT_MATCH"),
                eq("강남구"),
                eq("역삼동"),
                eq("테스트아파트"),
                eq("202606")
        )).thenReturn(false);

        service.recordIssue(
                "REAL_TRADE",
                "NO_APARTMENT_MATCH",
                "강남구",
                "역삼동",
                "테스트아파트",
                "11680",
                "202606",
                new ObjectMapper().readTree("{\"aptNm\":\"테스트아파트\"}"),
                "No apartment matched"
        );

        ArgumentCaptor<CollectionIssue> captor = ArgumentCaptor.forClass(CollectionIssue.class);
        verify(collectionIssueRepository).save(captor.capture());
        assertThat(captor.getValue().getJobId()).isEqualTo("job-1");
        assertThat(captor.getValue().getRawPayload()).contains("테스트아파트");
    }

    @Test
    void recordIssue_skipsDuplicateIssue() {
        when(collectionIssueRepository.existsDuplicate(
                eq("REAL_TRADE"),
                eq("NO_APARTMENT_MATCH"),
                eq("강남구"),
                eq("역삼동"),
                eq("테스트아파트"),
                eq("202606")
        )).thenReturn(true);

        service.recordIssue(
                "REAL_TRADE",
                "NO_APARTMENT_MATCH",
                "강남구",
                "역삼동",
                "테스트아파트",
                "11680",
                "202606",
                null,
                "No apartment matched"
        );

        verify(collectionIssueRepository, never()).save(any(CollectionIssue.class));
    }

    @Test
    void getRecentIssues_clampsLimitAndMapsDtos() {
        CollectionIssue issue = CollectionIssue.create(
                "job-1",
                "REAL_TRADE",
                "API_ERROR",
                "강남구",
                null,
                null,
                "11680",
                "202606",
                null,
                "failed"
        );
        when(collectionIssueRepository.findRecent(eq("job-1"), isNull(), eq("API_ERROR"), any(Pageable.class)))
                .thenReturn(List.of(issue));

        var result = service.getRecentIssues("job-1", null, "API_ERROR", 999);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).jobId()).isEqualTo("job-1");
        assertThat(result.get(0).issueType()).isEqualTo("API_ERROR");
    }
}
