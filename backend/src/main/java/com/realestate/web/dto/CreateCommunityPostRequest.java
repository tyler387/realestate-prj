package com.realestate.web.dto;

public record CreateCommunityPostRequest(
        String scope,
        String boardCode,
        Long aptId,
        String category,
        String title,
        String content
) {
}
