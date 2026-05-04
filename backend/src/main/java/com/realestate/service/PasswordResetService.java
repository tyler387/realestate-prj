package com.realestate.service;

import com.realestate.domain.entity.PasswordResetToken;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.PasswordResetTokenRepository;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.PasswordResetConfirmDto;
import com.realestate.web.dto.PasswordResetRequestDto;
import com.realestate.web.dto.PasswordResetVerifyDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    private static final int EXPIRES_MINUTES = 15;

    /**
     * [1단계] 이메일로 인증코드를 발급하고 발송한다.
     * - 재요청 시 이전 토큰을 모두 삭제하여 한 번에 하나의 유효 코드만 존재하도록 한다.
     * - 소셜 계정은 password_hash가 없으므로 이 플로우를 통해 비밀번호를 부여하지 못하도록 차단한다.
     */
    @Transactional
    public void requestReset(PasswordResetRequestDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));

        // 소셜 계정에 비밀번호를 부여하면 이메일 로그인 경로가 생겨 계정 탈취 위험이 있으므로 차단
        if (user.getOauthProvider() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "소셜 계정은 이메일로 비밀번호를 변경할 수 없어요. 소셜 로그인을 이용해주세요");
        }

        // 재요청 시 미사용 토큰 포함 기존 토큰을 전부 삭제하고 새 코드 발급
        tokenRepository.deleteByUserId(user.getId());

        String code = generateCode();
        PasswordResetToken token = PasswordResetToken.create(
                user.getId(), code, LocalDateTime.now().plusMinutes(EXPIRES_MINUTES));
        tokenRepository.save(token);

        sendEmail(dto.email(), code);
    }

    /**
     * [2단계] 사용자가 입력한 인증코드를 서버에서 검증한다.
     * - 토큰을 소비(markUsed)하지 않으므로 이 단계에서 코드를 검증만 하고,
     *   실제 비밀번호 변경은 3단계(confirmReset)에서 코드를 재검증 후 처리한다.
     */
    @Transactional(readOnly = true)
    public void verifyToken(PasswordResetVerifyDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));
        resolveToken(user.getId(), dto.token());
    }

    /**
     * [3단계] 인증코드를 재검증한 후 새 비밀번호로 저장한다.
     * - API가 stateless이므로 2단계 verify와 세션이 연결되지 않아 코드를 다시 검증한다.
     * - 성공 시 토큰을 사용 처리(markUsed)하여 동일 코드로 재사용하지 못하게 한다.
     */
    @Transactional
    public void confirmReset(PasswordResetConfirmDto dto) {
        if (dto.newPassword() == null || dto.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상이어야 해요");
        }

        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));

        // requestReset 단계에서도 차단하지만 직접 API 호출에 대한 방어 이중 확인
        if (user.getOauthProvider() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "소셜 계정은 비밀번호를 변경할 수 없어요");
        }

        PasswordResetToken token = resolveToken(user.getId(), dto.token());

        // user는 @Transactional 컨텍스트 내 managed entity이므로 dirty checking으로 자동 반영
        user.updatePassword(passwordEncoder.encode(dto.newPassword()));
        // 동일 코드로 비밀번호를 다시 변경하지 못하도록 토큰을 사용 처리
        token.markUsed();
    }

    /**
     * 미사용·미만료 토큰을 조회하고 코드가 일치하면 반환한다.
     * 유효하지 않은 경우 모두 400 예외를 던진다.
     */
    private PasswordResetToken resolveToken(Long userId, String code) {
        PasswordResetToken token = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 유효하지 않아요"));

        if (token.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 만료되었어요. 다시 요청해주세요");
        }
        if (!token.getToken().equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 올바르지 않아요");
        }
        return token;
    }

    /** 암호학적으로 안전한 6자리 숫자 코드를 생성한다 (SecureRandom 사용). */
    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /** ObjectProvider를 통해 메일 설정이 없는 환경에서도 앱이 기동되도록 하고, 발송 불가 시 503을 반환한다. */
    private void sendEmail(String to, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "이메일 서비스를 사용할 수 없습니다. 관리자에게 문의해주세요.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[HomeBlind] 비밀번호 재설정 인증코드");
        message.setText(
                "비밀번호 재설정을 위한 인증코드를 안내해 드립니다.\n\n" +
                "인증코드: " + code + "\n\n" +
                "인증코드는 15분간 유효합니다.\n" +
                "본인이 요청하지 않은 경우 이 메일을 무시하세요."
        );
        mailSender.send(message);
    }
}
