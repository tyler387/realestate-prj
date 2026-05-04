package com.realestate.service;

import com.realestate.auth.JwtUtil;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.CommentRepository;
import com.realestate.domain.repository.CommunityPostRepository;
import com.realestate.domain.repository.PostLikeLogRepository;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.AuthResponse;
import com.realestate.web.dto.ChangePasswordRequest;
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
    private final CommunityPostRepository communityPostRepository;
    private final CommentRepository commentRepository;
    private final PostLikeLogRepository postLikeLogRepository;

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

        if (user.getPasswordHash() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "카카오 계정으로 로그인하세요");
        }
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

    /**
     * 현재 비밀번호를 검증한 뒤 새 비밀번호로 변경한다.
     * - 소셜 계정은 password_hash가 없어 matches() 자체가 실패하므로 사전에 차단한다.
     * - currentPassword가 null이면 BCrypt가 IllegalArgumentException을 던지므로 사전에 검사한다.
     * - JwtAuthenticationFilter가 로드한 user는 트랜잭션 밖에서 생성된 detached entity이므로
     *   findById()로 managed entity를 다시 조회해야 dirty checking이 동작한다.
     */
    @Transactional
    public void changePassword(User user, ChangePasswordRequest req) {
        // 소셜 계정은 password_hash가 없으므로 변경 불가
        if (user.getOauthProvider() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "소셜 계정은 비밀번호를 변경할 수 없어요");
        }
        // null이면 BCrypt가 IllegalArgumentException → 500이 되므로 사전 차단
        if (req.currentPassword() == null || req.currentPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호를 입력해주세요");
        }
        if (req.newPassword() == null || req.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "새 비밀번호는 8자 이상이어야 해요");
        }
        // detached → managed entity 교체 (dirty checking 활성화)
        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요"));
        if (!passwordEncoder.matches(req.currentPassword(), managed.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 올바르지 않아요");
        }
        managed.updatePassword(passwordEncoder.encode(req.newPassword()));
    }

    /**
     * 게시글·댓글 작성자를 익명 처리한 뒤 계정을 삭제한다.
     * - 삭제 순서: 콘텐츠 익명화 → 좋아요 로그 삭제 → 계정 삭제
     * - post_like_logs를 먼저 정리하지 않으면 동일 닉네임으로 재가입한 사용자가
     *   이전 사용자의 좋아요 기록을 물려받는 문제가 발생한다.
     * - password_reset_tokens는 user_id FK에 ON DELETE CASCADE가 설정되어 있어
     *   userRepository.deleteById() 호출 시 DB가 자동으로 삭제한다.
     */
    @Transactional
    public void deleteAccount(User user) {
        String nickname = user.getNickname();
        // 게시글·댓글 작성자명 일괄 익명 처리 (@Modifying clearAutomatically=true 포함)
        communityPostRepository.updateAuthorNickname(nickname, "탈퇴한 사용자");
        commentRepository.updateAuthorNickname(nickname, "탈퇴한 사용자");
        // 닉네임 기반 좋아요 기록 삭제 (닉네임 재사용으로 인한 오판 방지)
        postLikeLogRepository.deleteByAuthorNickname(nickname);
        // 계정 삭제 — ON DELETE CASCADE로 password_reset_tokens도 자동 삭제됨
        userRepository.deleteById(user.getId());
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
}
