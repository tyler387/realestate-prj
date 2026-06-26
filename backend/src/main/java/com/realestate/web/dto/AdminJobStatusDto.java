package com.realestate.web.dto;

import java.time.LocalDateTime;

public record AdminJobStatusDto(
        String jobId,
        String type,
        String status,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String errorMessage
) {
}
