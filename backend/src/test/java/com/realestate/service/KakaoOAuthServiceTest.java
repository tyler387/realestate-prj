package com.realestate.service;

import com.realestate.auth.JwtUtil;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.KakaoLoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class KakaoOAuthServiceTest {

    @Mock
    private WebClient webClient;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private KakaoOAuthService kakaoOAuthService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(kakaoOAuthService, "allowedRedirectUris",
                "http://localhost:5173/auth/kakao/callback,https://homeblind.com/auth/kakao/callback");
    }

    @Test
    void kakaoLogin_invalidRedirectUri_throwsBadRequest() {
        KakaoLoginRequest req = new KakaoLoginRequest("auth-code", "https://evil.example.com/callback");

        assertThatThrownBy(() -> kakaoOAuthService.kakaoLogin(req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(400);
                });
    }

    @Test
    void kakaoLogin_redirectUriWithQuery_throwsBadRequest() {
        KakaoLoginRequest req = new KakaoLoginRequest("auth-code",
                "http://localhost:5173/auth/kakao/callback?x=1");

        assertThatThrownBy(() -> kakaoOAuthService.kakaoLogin(req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(400);
                });
    }
}
