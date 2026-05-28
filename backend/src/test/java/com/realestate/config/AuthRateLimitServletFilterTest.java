package com.realestate.config;

/*
 * 존재 이유:
 * - 로그인/인증 API를 짧은 시간에 반복 호출하는 경우 서버가 429로 차단하는지 확인한다.
 *
 * 왜 필요한가:
 * - 비밀번호 대입, 인증 코드 무차별 시도, 자동화된 로그인 공격을 막는 보안 안전장치다.
 * - CORS Origin이 있는 요청에서도 Retry-After와 에러 본문이 정상 반환되는지 보장한다.
 *
 * 어떻게 쓰는가:
 * - `./gradlew.bat test --tests com.realestate.config.AuthRateLimitServletFilterTest`
 * - 전체 회귀 검증 시에는 `./gradlew.bat test`에 포함된다.
 *
 * 막는 장애:
 * - rate limit이 걸려도 요청이 컨트롤러까지 통과하는 문제
 * - 차단 응답에 Retry-After가 빠져 프론트가 재시도 시간을 알 수 없는 문제
 * - 정상 요청까지 실수로 차단되는 문제
 */

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
