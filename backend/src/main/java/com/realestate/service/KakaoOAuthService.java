package com.realestate.service;

import com.realestate.auth.JwtUtil;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.KakaoLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KakaoOAuthService {

    private final WebClient webClient;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${kakao.rest-api-key}")
    private String restApiKey;

    @Value("${kakao.client-secret:}")
    private String clientSecret;

    @Value("${kakao.token-url}")
    private String tokenUrl;

    @Value("${kakao.user-info-url}")
    private String userInfoUrl;

    @Transactional
    public AuthResponse kakaoLogin(KakaoLoginRequest req) {
        String accessToken = getKakaoAccessToken(req.code(), req.redirectUri());
        KakaoUserInfo kakaoUser = getKakaoUserInfo(accessToken);

        Optional<User> existingUser = userRepository.findByOauthProviderAndOauthId("KAKAO", kakaoUser.id());
        if (existingUser.isPresent()) {
            return toAuthResponse(existingUser.get());
        }

        if (kakaoUser.email() != null) {
            userRepository.findByEmail(kakaoUser.email()).ifPresent(u -> {
                if (u.getOauthProvider() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "이미 이메일로 가입된 계정이에요. 이메일로 로그인해주세요.");
                }
            });
        }

        String email = kakaoUser.email() != null
                ? kakaoUser.email()
                : "kakao_" + kakaoUser.id() + "@noreply.local";
        String nickname = generateUniqueNickname(kakaoUser.nickname());
        User user = User.createOAuthUser(email, nickname, "KAKAO", kakaoUser.id());
        userRepository.save(user);
        return toAuthResponse(user);
    }

    @SuppressWarnings("unchecked")
    private String getKakaoAccessToken(String code, String redirectUri) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", restApiKey);
        formData.add("redirect_uri", redirectUri);
        formData.add("code", code);
        if (clientSecret != null && !clientSecret.isBlank()) {
            formData.add("client_secret", clientSecret);
        }

        Map<String, Object> response = webClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(formData)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .map(body -> new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY, "카카오 토큰 오류: " + body)))
                .bodyToMono(Map.class)
                .block();

        if (response == null || !response.containsKey("access_token")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 토큰 발급에 실패했어요");
        }
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private KakaoUserInfo getKakaoUserInfo(String accessToken) {
        Map<String, Object> response = webClient.get()
                .uri(userInfoUrl)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 사용자 정보 조회에 실패했어요");
        }

        String kakaoId = String.valueOf(response.get("id"));
        Map<String, Object> kakaoAccount = (Map<String, Object>) response.get("kakao_account");

        String email = null;
        String nickname = null;
        if (kakaoAccount != null) {
            email = (String) kakaoAccount.get("email");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile != null) {
                nickname = (String) profile.get("nickname");
            }
        }
        return new KakaoUserInfo(kakaoId, email, nickname);
    }

    private String generateUniqueNickname(String base) {
        if (base == null || base.isBlank()) base = "카카오유저";
        if (base.length() > 8) base = base.substring(0, 8);
        if (!userRepository.existsByNickname(base)) return base;

        for (int i = 0; i < 20; i++) {
            String candidate = base + String.format("%02d", (int) (Math.random() * 100));
            if (candidate.length() > 10) candidate = candidate.substring(0, 10);
            if (!userRepository.existsByNickname(candidate)) return candidate;
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "닉네임 생성에 실패했어요. 다시 시도해주세요.");
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(
                jwtUtil.generateToken(user),
                user.getId(),
                user.getNickname(),
                user.getStatus().name(),
                user.getApartmentId(),
                user.getApartmentName(),
                user.getOauthProvider()
        );
    }

    record KakaoUserInfo(String id, String email, String nickname) {}
}
