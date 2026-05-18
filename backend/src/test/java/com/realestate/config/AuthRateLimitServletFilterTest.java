package com.realestate.config;

import com.realestate.auth.AuthRateLimitService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitServletFilterTest {

    @Mock
    private AuthRateLimitService rateLimitService;

    private AuthRateLimitServletFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthRateLimitServletFilter(rateLimitService);
        ReflectionTestUtils.setField(filter, "allowedOrigins", "http://localhost:5173");
    }

    @Test
    void whenRateLimited_returns429AndRetryAfter() throws ServletException, IOException {
        when(rateLimitService.check(anyString(), anyInt(), anyInt()))
                .thenReturn(AuthRateLimitService.Decision.deny(12));

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("Origin", "http://localhost:5173");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("12");
        assertThat(response.getContentAsString()).contains("RATE_LIMITED");
    }

    @Test
    void whenPermitted_passesThrough() throws ServletException, IOException {
        when(rateLimitService.check(anyString(), anyInt(), anyInt()))
                .thenReturn(AuthRateLimitService.Decision.allow());

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
