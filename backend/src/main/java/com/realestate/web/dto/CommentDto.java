package com.realestate.web.dto;

public record CommentDto(
        Long id,
        Long postId,
        String authorNickname,
        String content,
        String createdAt
) {}
