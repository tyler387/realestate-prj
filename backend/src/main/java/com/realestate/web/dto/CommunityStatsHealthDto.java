package com.realestate.web.dto;

import java.util.List;

public record CommunityStatsHealthDto(
        String scope,
        String boardCode,
        Long aptId,
        boolean v16MigrationApplied,
        List<String> missingV16Columns,
        long postStatsMissingRows,
        long keywordStatsMissingGroups,
        long scopedPostStatsRows,
        long scopedKeywordStatsRows,
        long rankedPopularRows,
        long rankedKeywordRows,
        long fallbackPopularCandidateRows,
        long fallbackKeywordCandidateRows,
        boolean popularFallbackExpected,
        boolean keywordFallbackExpected,
        boolean healthy
) {
}
