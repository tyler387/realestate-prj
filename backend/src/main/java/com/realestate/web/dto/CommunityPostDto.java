package com.realestate.web.dto;

public record CommunityPostDto(
        Long id,
        Long aptId,
        String category,
        String title,
        String content,
        String authorNickname,
        String complexName,
        String createdAt,
        Integer likeCount,
        Integer commentCount,
        boolean liked
) {
}
