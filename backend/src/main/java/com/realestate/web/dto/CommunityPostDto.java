package com.realestate.web.dto;

public record CommunityPostDto(
        Long id,
        Long aptId,
        String boardScope,
        String boardCode,
        String category,
        String title,
        String content,
        String authorNickname,
        String complexName,
        Long authorVerifiedAptId,
        String authorVerifiedAptName,
        String authorVerificationLabel,
        String createdAt,
        Integer likeCount,
        Integer commentCount,
        boolean liked
) {
}
