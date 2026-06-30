package com.realestate.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.realestate.auth.AdminApiKeyFilter;
import com.realestate.auth.AuthRateLimitService;
import com.realestate.auth.JwtUtil;
import com.realestate.auth.SecurityConfig;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.UserRepository;
import com.realestate.service.CommunityService;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CommunityPostPageDto;
import jakarta.servlet.FilterChain;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CommunityController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "jwt.secret=test-secret-test-secret-test-secret-test-secret",
        "jwt.expiration=86400000"
})
class CommunityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommunityService communityService;
    @MockBean
    private JwtUtil jwtUtil;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private AdminApiKeyFilter adminApiKeyFilter;
    @MockBean
    private AuthRateLimitService authRateLimitService;

    @BeforeEach
    void passThroughAdminFilter() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(adminApiKeyFilter).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void getPosts_isPublicAndDelegatesPagingSearchParameters() throws Exception {
        CommunityPostDto post = postDto(1L, "GLOBAL", "BLAH", "블라블라");
        when(communityService.getPosts(eq("GLOBAL"), isNull(), eq("BLAH"), isNull(), eq("LATEST"), eq("loan"), eq(0), eq(10)))
                .thenReturn(new CommunityPostPageDto(List.of(post), 0, 10, 1, 1, false));

        mockMvc.perform(get("/api/community/posts")
                        .param("scope", "GLOBAL")
                        .param("boardCode", "BLAH")
                        .param("sortType", "LATEST")
                        .param("q", "loan")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].boardScope").value("GLOBAL"))
                .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    void getMyPosts_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/community/my/posts"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(communityService);
    }

    @Test
    void getMyPosts_usesAuthenticatedPrincipalNotNicknameParameter() throws Exception {
        User user = verifiedUser(11L, "tester", 3100L, "래미안 원베일리");
        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
        when(communityService.getMyPosts(org.mockito.ArgumentMatchers.any(Authentication.class)))
                .thenReturn(List.of(postDto(2L, "GLOBAL", "BLAH", "블라블라")));

        mockMvc.perform(get("/api/community/my/posts")
                        .param("nickname", "other-user")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2));

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(communityService).getMyPosts(captor.capture());
        assertThat(captor.getValue().getPrincipal()).isSameAs(user);
    }

    @Test
    void getMyComments_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/community/my/comments"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(communityService);
    }

    private CommunityPostDto postDto(Long id, String scope, String boardCode, String category) {
        return new CommunityPostDto(
                id,
                null,
                scope,
                boardCode,
                category,
                "제목",
                "본문입니다",
                "tester",
                "전체 커뮤니티",
                3100L,
                "래미안 원베일리",
                "아파트 인증: 래미안 원베일리",
                "방금 전",
                0,
                0,
                false
        );
    }

    private User verifiedUser(Long id, String nickname, Long apartmentId, String apartmentName) {
        User user = User.builder()
                .email(nickname + "@example.com")
                .passwordHash("encoded")
                .nickname(nickname)
                .marketingAgreed(false)
                .build();
        user.verify(apartmentId, apartmentName);
        ReflectionTestUtils.setField(user, "id", id);
        ReflectionTestUtils.setField(user, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(user, "updatedAt", LocalDateTime.now());
        return user;
    }
}
