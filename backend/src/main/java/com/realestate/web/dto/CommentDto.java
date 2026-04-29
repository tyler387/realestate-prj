package com.realestate.web.dto;

public record CommentDto(
        Long id,
        Long postId,
        String authorNickname,
        Long authorAptId,
        String authorAptName,
        String content,
        String createdAt
) {}
