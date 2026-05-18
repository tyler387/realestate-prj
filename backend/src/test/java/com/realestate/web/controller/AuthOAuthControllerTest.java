package com.realestate.web.controller;

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
