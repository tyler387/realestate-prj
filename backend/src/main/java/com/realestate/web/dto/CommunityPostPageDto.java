package com.realestate.web.dto;

import java.util.List;

public record CommunityPostPageDto(
        List<CommunityPostDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
