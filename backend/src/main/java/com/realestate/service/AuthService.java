package com.realestate.service;

import com.realestate.auth.JwtUtil;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.LoginRequest;
import com.realestate.web.dto.SignupRequest;
import com.realestate.web.dto.VerifyRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (!req.serviceAgreed() || !req.privacyAgreed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 약관에 동의해주세요");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일이에요");
        }
        if (userRepository.existsByNickname(req.nickname())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임이에요");
        }

        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .nickname(req.nickname())
                .marketingAgreed(req.marketingAgreed())
                .build();

        userRepository.save(user);
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않아요"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않아요");
        }

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse getMe(User user) {
        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse verifyResidence(User user, VerifyRequest req) {
        if (req.apartmentId() == null || req.apartmentName() == null || req.apartmentName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아파트 정보가 올바르지 않아요");
        }
        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요"));
        managed.verify(req.apartmentId(), req.apartmentName().trim());
        return toAuthResponse(managed);
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(
                jwtUtil.generateToken(user),
                user.getId(),
                user.getNickname(),
                user.getStatus().name(),
                user.getApartmentId(),
                user.getApartmentName()
        );
    }
}
