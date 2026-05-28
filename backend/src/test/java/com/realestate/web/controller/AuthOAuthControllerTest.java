package com.realestate.web.controller;

/*
 * 존재 이유:
 * - 인증 컨트롤러가 비밀번호 재설정과 카카오 OAuth 요청을 올바른 URL/상태코드/JSON 형식으로 처리하는지 확인한다.
 *
 * 왜 필요한가:
 * - 프론트는 이 API의 HTTP 계약에 의존하므로, URL이나 응답 필드가 바뀌면 로그인/비밀번호 재설정 화면이 바로 깨진다.
 * - 컨트롤러 테스트는 서비스 내부 로직이 아니라 "요청을 받아 적절한 서비스로 넘기고 응답을 돌려주는 경계"를 고정한다.
 *
 * 어떻게 쓰는가:
 * - `./gradlew.bat test --tests com.realestate.web.controller.AuthOAuthControllerTest`
 * - 실제 외부 카카오 서버는 호출하지 않고 KakaoOAuthService를 mock으로 대체한다.
 *
 * 막는 장애:
 * - 비밀번호 재설정 엔드포인트가 204 대신 다른 상태코드를 반환하는 문제
 * - 카카오 로그인 응답에서 token/oauthProvider 같은 프론트 필수 필드가 빠지는 문제
 * - 컨트롤러가 서비스 메서드를 호출하지 않아 요청이 처리되지 않는 문제
 */

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realestate.auth.AuthRateLimitService;
import com.realestate.web.dto.AuthResponse;
import com.realestate.service.AuthService;
import com.realestate.service.KakaoOAuthService;
import com.realestate.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AuthController.class, OAuthController.class})
@Import(TestSecurityConfig.class)
class AuthOAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;
    @MockBean
    private PasswordResetService passwordResetService;
    @MockBean
    private KakaoOAuthService kakaoOAuthService;
    @MockBean
    private AuthRateLimitService authRateLimitService;

    @BeforeEach
    void allowRateLimitByDefault() {
        when(authRateLimitService.check(anyString(), anyInt(), anyInt()))
                .thenReturn(AuthRateLimitService.Decision.allow());
    }

    @Test
    void passwordResetRequest_returnsNoContent() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\"}"))
                .andExpect(status().isNoContent());

        verify(passwordResetService).requestReset(any());
    }

    @Test
    void passwordResetVerify_returnsNoContent() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"token\":\"123456\"}"))
                .andExpect(status().isNoContent());

        verify(passwordResetService).verifyToken(any());
    }

    @Test
    void passwordResetConfirm_returnsNoContent() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"token\":\"123456\",\"newPassword\":\"NewPass1234\"}"))
                .andExpect(status().isNoContent());

        verify(passwordResetService).confirmReset(any());
    }

    @Test
    void kakaoLogin_returnsAuthResponse() throws Exception {
        AuthResponse response = new AuthResponse("jwt", 1L, "nick", "MEMBER", null, null, "KAKAO");
        when(kakaoOAuthService.kakaoLogin(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/oauth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new com.realestate.web.dto.KakaoLoginRequest(
                                "code", "http://localhost:5173/auth/kakao/callback"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(jsonPath("$.oauthProvider").value("KAKAO"));
    }
}
