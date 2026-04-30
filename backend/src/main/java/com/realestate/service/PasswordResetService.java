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

    private static final int CODE_LENGTH = 6;
    private static final int EXPIRES_MINUTES = 15;

    @Transactional
    public void requestReset(PasswordResetRequestDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));

        // 기존 미사용 토큰 삭제
        tokenRepository.deleteByUserId(user.getId());

        String code = generateCode();
        PasswordResetToken token = PasswordResetToken.create(
                user.getId(), code, LocalDateTime.now().plusMinutes(EXPIRES_MINUTES));
        tokenRepository.save(token);

        sendEmail(dto.email(), code);
    }

    @Transactional(readOnly = true)
    public void verifyToken(PasswordResetVerifyDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));

        PasswordResetToken token = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 유효하지 않아요"));

        if (token.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 만료되었어요. 다시 요청해주세요");
        }
        if (!token.getToken().equals(dto.token())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 올바르지 않아요");
        }
    }

    @Transactional
    public void confirmReset(PasswordResetConfirmDto dto) {
        if (dto.newPassword() == null || dto.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상이어야 해요");
        }

        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록되지 않은 이메일이에요"));

        PasswordResetToken token = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 유효하지 않아요"));

        if (token.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 만료되었어요. 다시 요청해주세요");
        }
        if (!token.getToken().equals(dto.token())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증코드가 올바르지 않아요");
        }

        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요"));
        managed.updatePassword(passwordEncoder.encode(dto.newPassword()));
        token.markUsed();
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

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
