package com.realestate.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.realestate.domain.entity.CollectionIssue;
import com.realestate.domain.repository.CollectionIssueRepository;
import com.realestate.web.dto.CollectionIssueDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CollectionIssueService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 500;

    private final CollectionIssueRepository collectionIssueRepository;
    private final CollectionJobContext collectionJobContext;

    @Transactional
    public void recordIssue(
            String sourceType,
            String issueType,
            String sigungu,
            String eupMyeonDong,
            String aptName,
            String lawdCd,
            String dealYmd,
            JsonNode rawPayload,
            String message
    ) {
        if (collectionIssueRepository.existsDuplicate(sourceType, issueType, sigungu, eupMyeonDong, aptName, dealYmd)) {
            return;
        }

        CollectionIssue issue = CollectionIssue.create(
                collectionJobContext.getCurrentJobId().orElse(null),
                sourceType,
                issueType,
                blankToNull(sigungu),
                blankToNull(eupMyeonDong),
                blankToNull(aptName),
                blankToNull(lawdCd),
                blankToNull(dealYmd),
                rawPayload == null ? null : rawPayload.toString(),
                blankToNull(message)
        );
        collectionIssueRepository.save(issue);
    }

    @Transactional(readOnly = true)
    public List<CollectionIssueDto> getRecentIssues(String jobId, String sourceType, String issueType, Integer limit) {
        int resolvedLimit = resolveLimit(limit);
        return collectionIssueRepository.findRecent(
                        blankToNull(jobId),
                        blankToNull(sourceType),
                        blankToNull(issueType),
                        PageRequest.of(0, resolvedLimit)
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    private int resolveLimit(Integer limit) {
        if (limit == null) return DEFAULT_LIMIT;
        if (limit < 1) return DEFAULT_LIMIT;
        return Math.min(limit, MAX_LIMIT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private CollectionIssueDto toDto(CollectionIssue issue) {
        return new CollectionIssueDto(
                issue.getId(),
                issue.getJobId(),
                issue.getSourceType(),
                issue.getIssueType(),
                issue.getSigungu(),
                issue.getEupMyeonDong(),
                issue.getAptName(),
                issue.getLawdCd(),
                issue.getDealYmd(),
                issue.getRawPayload(),
                issue.getMessage(),
                issue.getCreatedAt()
        );
    }
}
