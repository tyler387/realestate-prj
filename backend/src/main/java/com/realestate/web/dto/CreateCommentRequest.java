package com.realestate.web.dto;

public record CreateCommentRequest(
        String authorNickname,
        String content
) {}
