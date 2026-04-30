package com.realestate.web.controller;

import com.realestate.service.KakaoOAuthService;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.KakaoLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final KakaoOAuthService kakaoOAuthService;

    // 프론트가 전달한 카카오 인가코드를 받아 실제 로그인/회원생성 처리를 위임
    @PostMapping("/kakao")
    public AuthResponse kakaoLogin(@RequestBody KakaoLoginRequest req) {
        return kakaoOAuthService.kakaoLogin(req);
    }
}
