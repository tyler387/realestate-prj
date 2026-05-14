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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    @Value("${password-reset.token-pepper}")
    private String tokenPepper;

    private static final int EXPIRES_MINUTES = 15;

    @Transactional
    public void requestReset(PasswordResetRequestDto dto) {
        User user = userRepository.findByEmail(dto.email()).orElse(null);
        // Prevent account enumeration: return success for non-existing/social-only accounts too.
        if (user == null || user.getOauthProvider() != null) {
            return;
        }

        tokenRepository.deleteByUserId(user.getId());

        String code = generateCode();
        String tokenHash = hashToken(code);
        PasswordResetToken token = PasswordResetToken.create(
                user.getId(), tokenHash, LocalDateTime.now().plusMinutes(EXPIRES_MINUTES));
        tokenRepository.save(token);

        sendEmail(dto.email(), code);
    }

    @Transactional(readOnly = true)
    public void verifyToken(PasswordResetVerifyDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email is not registered"));
        resolveToken(user.getId(), dto.token());
    }

    @Transactional
    public void confirmReset(PasswordResetConfirmDto dto) {
        if (dto.newPassword() == null || dto.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email is not registered"));

        if (user.getOauthProvider() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Social login account cannot reset password by email");
        }

        PasswordResetToken token = resolveToken(user.getId(), dto.token());

        user.updatePassword(passwordEncoder.encode(dto.newPassword()));
        token.markUsed();
    }

    private PasswordResetToken resolveToken(Long userId, String code) {
        PasswordResetToken token = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code is invalid"));

        if (token.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code is expired. Please request a new code.");
        }
        String expectedHash = hashToken(code);
        if (!constantTimeEquals(token.getTokenHash(), expectedHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        return token;
    }

    private String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code is invalid");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] input = (tokenPepper + ":" + rawToken.trim()).getBytes(StandardCharsets.UTF_8);
            return HexFormat.of().formatHex(digest.digest(input));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is unavailable", e);
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        if (left == null || right == null) return false;
        return MessageDigest.isEqual(
                left.getBytes(StandardCharsets.UTF_8),
                right.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendEmail(String to, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Email service is unavailable");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[HomeBlind] Password Reset Verification Code");
        message.setText(
                "Your password reset verification code is below.\n\n" +
                "Code: " + code + "\n\n" +
                "This code is valid for 15 minutes.\n" +
                "If you did not request this, you can ignore this email."
        );
        mailSender.send(message);
    }
}
