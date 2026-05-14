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

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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

    @Value("${kakao.allowed-redirect-uris:http://localhost:5173/auth/kakao/callback}")
    private String allowedRedirectUris;

    @Transactional
    public AuthResponse kakaoLogin(KakaoLoginRequest req) {
        String validatedRedirectUri = validateRedirectUri(req.redirectUri());

        String accessToken = getKakaoAccessToken(req.code(), validatedRedirectUri);
        KakaoUserInfo kakaoUser = getKakaoUserInfo(accessToken);

        Optional<User> existingUser = userRepository.findByOauthProviderAndOauthId("KAKAO", kakaoUser.id());
        if (existingUser.isPresent()) {
            return toAuthResponse(existingUser.get());
        }

        if (kakaoUser.email() != null) {
            userRepository.findByEmail(kakaoUser.email()).ifPresent(u -> {
                if (u.getOauthProvider() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "An account with this email already exists. Please login with email/password."
                    );
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
                                        HttpStatus.BAD_GATEWAY, "Kakao token error: " + body)))
                .bodyToMono(Map.class)
                .block();

        if (response == null || !response.containsKey("access_token")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to issue Kakao access token");
        }
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private KakaoUserInfo getKakaoUserInfo(String accessToken) {
        Map<String, Object> response = webClient.get()
                .uri(userInfoUrl)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .map(body -> new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY, "Kakao user info error: " + body)))
                .bodyToMono(Map.class)
                .block();

        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch Kakao user info");
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
        if (base == null || base.isBlank()) base = "kakaoUser";
        if (base.length() > 8) base = base.substring(0, 8);
        if (!userRepository.existsByNickname(base)) return base;

        for (int i = 0; i < 20; i++) {
            String candidate = base + String.format("%02d", (int) (Math.random() * 100));
            if (candidate.length() > 10) candidate = candidate.substring(0, 10);
            if (!userRepository.existsByNickname(candidate)) return candidate;
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique nickname");
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

    private String validateRedirectUri(String redirectUri) {
        String normalized = normalizeRedirectUri(redirectUri);
        Set<String> allowed = parseAllowedRedirectUris();
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid redirect URI");
        }
        return normalized;
    }

    private Set<String> parseAllowedRedirectUris() {
        Set<String> allowed = new HashSet<>();
        Arrays.stream(allowedRedirectUris.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(this::normalizeRedirectUri)
                .forEach(allowed::add);
        return allowed;
    }

    private String normalizeRedirectUri(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "redirectUri is required");
        }
        try {
            URI uri = new URI(value.trim());
            if (!uri.isAbsolute()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid redirect URI");
            }
            if (uri.getQuery() != null || uri.getFragment() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid redirect URI");
            }
            URI normalized = new URI(
                    uri.getScheme().toLowerCase(),
                    uri.getUserInfo(),
                    uri.getHost() == null ? null : uri.getHost().toLowerCase(),
                    uri.getPort(),
                    uri.getPath(),
                    null,
                    null
            );
            return normalized.toString();
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid redirect URI");
        }
    }

    record KakaoUserInfo(String id, String email, String nickname) {}
}
