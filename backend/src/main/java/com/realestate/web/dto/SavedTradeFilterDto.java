package com.realestate.web.dto;

import java.time.LocalDateTime;

public record SavedTradeFilterDto(
        Long id,
        String name,
        String payload,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
