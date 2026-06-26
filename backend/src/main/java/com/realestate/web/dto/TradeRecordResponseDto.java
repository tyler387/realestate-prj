package com.realestate.web.dto;

import java.util.List;

public record TradeRecordResponseDto(
        List<TradeRecordDto> records,
        int displayedCount,
        int limit,
        boolean hasMore
) {
}
