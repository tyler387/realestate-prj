package com.realestate.web.controller;

import com.realestate.domain.entity.User;
import com.realestate.service.AuthService;
import com.realestate.service.PasswordResetService;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.ChangePasswordRequest;
import com.realestate.web.dto.LoginRequest;
import com.realestate.web.dto.PasswordResetConfirmDto;
import com.realestate.web.dto.PasswordResetRequestDto;
import com.realestate.web.dto.PasswordResetVerifyDto;
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
    private final PasswordResetService passwordResetService;

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

    // [비밀번호 찾기 1단계] 이메일로 6자리 인증코드 발송 — 소셜 계정 요청 시 400 반환
    @PostMapping("/password-reset/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void passwordResetRequest(@RequestBody PasswordResetRequestDto dto) {
        passwordResetService.requestReset(dto);
    }

    // [비밀번호 찾기 2단계] 인증코드 유효성 확인 — 토큰을 소비하지 않고 검증만 수행
    @PostMapping("/password-reset/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void passwordResetVerify(@RequestBody PasswordResetVerifyDto dto) {
        passwordResetService.verifyToken(dto);
    }

    // [비밀번호 찾기 3단계] 코드 재검증 후 새 비밀번호 저장 — 성공 시 토큰 사용 처리
    @PostMapping("/password-reset/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void passwordResetConfirm(@RequestBody PasswordResetConfirmDto dto) {
        passwordResetService.confirmReset(dto);
    }

    // [비밀번호 변경] 현재 비밀번호 확인 후 새 비밀번호로 변경 — 로그인 상태(JWT) 필수
    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody ChangePasswordRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        authService.changePassword(user, req);
    }

    // [회원 탈퇴] 게시글·댓글 익명화 및 좋아요 기록 삭제 후 계정 삭제 — 로그인 상태(JWT) 필수
    @DeleteMapping("/account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        authService.deleteAccount(user);
    }
}
