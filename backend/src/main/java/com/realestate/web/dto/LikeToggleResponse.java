package com.realestate.web.dto;

public record LikeToggleResponse(
        boolean liked,
        int likeCount
) {}
