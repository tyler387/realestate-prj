package com.realestate.web.controller;

import com.realestate.auth.AuthRateLimitService;
import com.realestate.service.ApartmentService;
import com.realestate.web.dto.TradeRecordDto;
import com.realestate.web.dto.TradeRecordResponseDto;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApartmentController.class)
@Import(TestSecurityConfig.class)
class ApartmentControllerTradeTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApartmentService apartmentService;
    @MockBean
    private AuthRateLimitService authRateLimitService;

    @Test
    void getTrades_returnsResponseEnvelopeWithLimitMetadata() throws Exception {
        TradeRecordDto record = new TradeRecordDto(
                10L,
                12,
                new BigDecimal("84.99"),
                "매매",
                150_000L,
                "2026.06.01",
                5_800L
        );
        when(apartmentService.getTradeRecords(
                eq(1L),
                any(),
                eq("12m"),
                any(),
                eq("SALE"),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                eq(true)
        )).thenReturn(new TradeRecordResponseDto(List.of(record), 1, 500, false));

        mockMvc.perform(get("/api/v1/apartments/1/trades")
                        .param("period", "12m")
                        .param("dealType", "SALE")
                        .param("excludeOutliers", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.records").isArray())
                .andExpect(jsonPath("$.records[0].id").value(10))
                .andExpect(jsonPath("$.records[0].tradeType").value("매매"))
                .andExpect(jsonPath("$.displayedCount").value(1))
                .andExpect(jsonPath("$.limit").value(500))
                .andExpect(jsonPath("$.hasMore").value(false));
    }
}
