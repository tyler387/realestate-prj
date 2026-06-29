package com.realestate.web.controller;

import com.realestate.auth.AuthRateLimitService;
import com.realestate.service.CollectionIssueService;
import com.realestate.web.dto.CollectionIssueDto;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminCollectionIssueController.class)
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = "admin.api-key=server-key")
class AdminCollectionIssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CollectionIssueService collectionIssueService;
    @MockBean
    private AuthRateLimitService authRateLimitService;

    @Test
    void issues_returnsFilteredCollectionIssues() throws Exception {
        when(collectionIssueService.getRecentIssues(eq("job-1"), eq("REAL_TRADE"), eq("API_ERROR"), eq(10)))
                .thenReturn(List.of(new CollectionIssueDto(
                        1L,
                        "job-1",
                        "REAL_TRADE",
                        "API_ERROR",
                        "강남구",
                        null,
                        null,
                        "11680",
                        "202606",
                        null,
                        "failed",
                        LocalDateTime.of(2026, 6, 26, 10, 0)
                )));

        mockMvc.perform(get("/api/v1/admin/collection-issues")
                        .header("X-Admin-Api-Key", "server-key")
                        .param("jobId", "job-1")
                        .param("sourceType", "REAL_TRADE")
                        .param("issueType", "API_ERROR")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].jobId").value("job-1"))
                .andExpect(jsonPath("$[0].issueType").value("API_ERROR"));
    }
}
