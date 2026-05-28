package com.realestate.web.dto;

public record CommentDto(
        Long id,
        Long postId,
        String postTitle,
        String postBoardScope,
        String postBoardCode,
        String postCategory,
        String authorNickname,
        Long authorAptId,
        String authorAptName,
        String content,
        String createdAt
) {}
