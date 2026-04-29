package com.realestate.web.dto;

public record CreateCommentRequest(
        String authorNickname,
        Long authorAptId,
        String authorAptName,
        String content
) {}
