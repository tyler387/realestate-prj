package com.realestate.web.dto;

public record CreateCommunityPostRequest(
        Long aptId,
        String category,
        String title,
        String content,
        String authorNickname,
        String complexName
) {
}
