package com.realestate.service;

/*
 * 존재 이유:
 * - 카카오 OAuth 로그인에서 redirectUri 검증 정책이 유지되는지 확인한다.
 *
 * 왜 필요한가:
 * - OAuth redirectUri 검증이 느슨하면 공격자가 인증 코드를 외부 도메인으로 빼돌리는 흐름이 생길 수 있다.
 * - 허용 목록에 없는 도메인이나 query가 붙은 callback URL을 거부해야 로그인 보안 경계가 유지된다.
 *
 * 어떻게 쓰는가:
 * - `./gradlew.bat test --tests com.realestate.service.KakaoOAuthServiceTest`
 * - 카카오 API 호출 자체가 아니라, 외부 호출 전 입력 검증 단계만 mock 환경에서 확인한다.
 *
 * 막는 장애:
 * - `https://evil.example.com/callback` 같은 비허용 redirectUri를 허용하는 문제
 * - 허용된 callback에 query를 붙여 검증을 우회하는 문제
 */

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
