package com.realestate.web.controller;

import com.realestate.domain.entity.User;
import com.realestate.service.AuthService;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.LoginRequest;
import com.realestate.web.dto.SignupRequest;
import com.realestate.web.dto.VerifyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest req) {
        return authService.signup(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    // 로그아웃은 클라이언트에서 토큰 삭제로 처리
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {}

    @PostMapping("/verify")
    public AuthResponse verify(@RequestBody VerifyRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return authService.verifyResidence(user, req);
    }

    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return authService.getMe(user);
    }

    @GetMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestParam String email) {
        return Map.of("available", authService.isEmailAvailable(email));
    }

    @GetMapping("/check-nickname")
    public Map<String, Boolean> checkNickname(@RequestParam String nickname) {
        return Map.of("available", authService.isNicknameAvailable(nickname));
    }
}
