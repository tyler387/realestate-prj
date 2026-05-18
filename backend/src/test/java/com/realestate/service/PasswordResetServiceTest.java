package com.realestate.service;

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
