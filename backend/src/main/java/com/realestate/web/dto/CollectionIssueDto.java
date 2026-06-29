package com.realestate.web.dto;

import java.time.LocalDateTime;

public record CollectionIssueDto(
        Long id,
        String jobId,
        String sourceType,
        String issueType,
        String sigungu,
        String eupMyeonDong,
        String aptName,
        String lawdCd,
        String dealYmd,
        String rawPayload,
        String message,
        LocalDateTime createdAt
) {
}
