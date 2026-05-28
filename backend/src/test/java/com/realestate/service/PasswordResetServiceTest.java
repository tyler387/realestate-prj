package com.realestate.service;

/*
 * 존재 이유:
 * - 비밀번호 재설정 토큰 발급/검증/변경 흐름이 보안 요구사항대로 동작하는지 확인한다.
 *
 * 왜 필요한가:
 * - 비밀번호 재설정은 계정 탈취와 직접 연결되는 고위험 기능이다.
 * - 토큰을 평문으로 저장하거나, 만료 토큰을 허용하거나, 잘못된 사용자에게 존재 여부를 노출하면 보안 사고가 된다.
 *
 * 어떻게 쓰는가:
 * - `./gradlew.bat test --tests com.realestate.service.PasswordResetServiceTest`
 * - 메일 발송기는 mock으로 대체하고, 토큰 저장/검증/비밀번호 변경 로직만 빠르게 검증한다.
 *
 * 막는 장애:
 * - 가입되지 않은 이메일 요청에서 사용자 존재 여부가 드러나는 문제
 * - 6자리 인증 코드가 DB에 평문 저장되는 문제
 * - 만료된 인증 코드로 비밀번호 변경이 가능한 문제
 * - 정상 인증 후 비밀번호가 갱신되지 않거나 토큰이 사용 처리되지 않는 문제
 */

import com.realestate.domain.entity.PasswordResetToken;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.PasswordResetTokenRepository;
import com.realestate.domain.repository.UserRepository;
import com.realestate.web.dto.PasswordResetConfirmDto;
import com.realestate.web.dto.PasswordResetRequestDto;
import com.realestate.web.dto.PasswordResetVerifyDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;
    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(passwordResetService, "tokenPepper", "pepper-for-test");
        lenient().when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);
    }

    @Test
    void requestReset_nonExistingEmail_doesNotThrowAndDoesNotSaveToken() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestReset(new PasswordResetRequestDto("missing@example.com"));

        verify(tokenRepository, never()).save(any());
    }

    @Test
    void requestReset_existingEmail_savesHashedTokenNotPlaintext() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("encoded")
                .nickname("tester")
                .marketingAgreed(false)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestReset(new PasswordResetRequestDto("user@example.com"));

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(captor.capture());
        PasswordResetToken saved = captor.getValue();
        assertThat(saved.getTokenHash()).isNotNull();
        assertThat(saved.getTokenHash().length()).isEqualTo(64);
        assertThat(saved.getTokenHash()).doesNotMatch("\\d{6}");
    }

    @Test
    void verifyToken_expiredToken_throwsBadRequest() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("encoded")
                .nickname("tester")
                .marketingAgreed(false)
                .build();
        ReflectionTestUtils.setField(user, "id", 10L);
        PasswordResetToken token = PasswordResetToken.create(10L, "a".repeat(64), LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(10L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.verifyToken(new PasswordResetVerifyDto("user@example.com", "123456")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode.value")
                .isEqualTo(400);
    }

    @Test
    void confirmReset_validToken_updatesPasswordAndMarksTokenUsed() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("old")
                .nickname("tester")
                .marketingAgreed(false)
                .build();
        ReflectionTestUtils.setField(user, "id", 22L);

        String rawToken = "123456";
        String hash = sha256("pepper-for-test:" + rawToken);
        PasswordResetToken token = PasswordResetToken.create(22L, hash, LocalDateTime.now().plusMinutes(10));

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(22L)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPass1234")).thenReturn("encoded-new");

        passwordResetService.confirmReset(new PasswordResetConfirmDto("user@example.com", rawToken, "NewPass1234"));

        assertThat(user.getPasswordHash()).isEqualTo("encoded-new");
        assertThat(token.isUsed()).isTrue();
    }

    private String sha256(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
