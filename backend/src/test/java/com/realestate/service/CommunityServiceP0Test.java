package com.realestate.service;

/*
 * 존재 이유:
 * - 공통게시판 P0 마감 기준을 자동으로 검증하는 회귀 테스트다.
 *
 * 왜 필요한가:
 * - GLOBAL 게시판은 aptId가 null일 수 있어, 기존 아파트별 게시판 전제(aptId 필수)와 충돌하기 쉽다.
 * - 글쓰기/댓글/좋아요는 프론트가 보낸 작성자 정보가 아니라 서버 인증 사용자 정보로 처리되어야 한다.
 * - 공통게시판을 고치다가 기존 APARTMENT 게시판 조회가 깨지는지도 함께 잡아야 한다.
 *
 * 어떻게 쓰는가:
 * - `./gradlew.bat test --tests com.realestate.service.CommunityServiceP0Test`
 * - 커뮤니티 도메인/API를 수정한 뒤에는 전체 `./gradlew.bat test`로 함께 돌린다.
 *
 * 막는 장애:
 * - `GLOBAL/BLAH` 목록 조회가 aptId 없음 때문에 400/500으로 실패하는 문제
 * - 공통 게시글의 조회/좋아요/키워드 로그가 null aptId를 처리하지 못하는 문제
 * - 클라이언트가 조작한 nickname/apartmentName이 작성자 스냅샷으로 저장되는 문제
 * - 우리 아파트 게시판의 `APARTMENT + aptId` 조회 회귀
 */

import com.realestate.domain.entity.Comment;
import com.realestate.domain.entity.CommunityPost;
import com.realestate.domain.entity.KeywordLog;
import com.realestate.domain.entity.PostLikeLog;
import com.realestate.domain.entity.PostViewLog;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.CommentRepository;
import com.realestate.domain.repository.CommunityPostRepository;
import com.realestate.domain.repository.KeywordLogRepository;
import com.realestate.domain.repository.KeywordStatsRepository;
import com.realestate.domain.repository.PostLikeLogRepository;
import com.realestate.domain.repository.PostStatsRepository;
import com.realestate.domain.repository.PostViewLogRepository;
import com.realestate.web.dto.CommentDto;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommentRequest;
import com.realestate.web.dto.CreateCommunityPostRequest;
import com.realestate.web.dto.LikeToggleResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityServiceP0Test {

    @Mock
    private CommunityPostRepository communityPostRepository;
    @Mock
    private PostStatsRepository postStatsRepository;
    @Mock
    private KeywordStatsRepository keywordStatsRepository;
    @Mock
    private PostViewLogRepository postViewLogRepository;
    @Mock
    private KeywordLogRepository keywordLogRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostLikeLogRepository postLikeLogRepository;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private CommunityService communityService;

    @Test
    void getPosts_globalBlah_doesNotRequireAptId() {
        CommunityPost post = post(1L, null, "GLOBAL", "BLAH", "블라블라");
        when(communityPostRepository.findByBoardScopeAndBoardCodeOrderByCreatedAtDesc("GLOBAL", "BLAH"))
                .thenReturn(List.of(post));

        List<CommunityPostDto> result = communityService.getPosts("GLOBAL", null, "BLAH", null, "최신순");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).aptId()).isNull();
        assertThat(result.get(0).boardScope()).isEqualTo("GLOBAL");
        assertThat(result.get(0).boardCode()).isEqualTo("BLAH");
    }

    @Test
    void createPost_globalBlah_usesAuthenticatedVerifiedUserSnapshot() {
        User user = verifiedUser(11L, "tester", 3100L, "래미안 원베일리");
        when(authentication.getPrincipal()).thenReturn(user);
        when(communityPostRepository.save(any(CommunityPost.class))).thenAnswer(invocation -> {
            CommunityPost saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 100L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            return saved;
        });

        CommunityPostDto result = communityService.createPost(
                new CreateCommunityPostRequest(
                        "GLOBAL",
                        "BLAH",
                        null,
                        null,
                        "대출금리 체감",
                        "요즘 대출금리 체감 어떤가요",
                        "clientNick",
                        "clientApt",
                        999L,
                        9999L,
                        "clientVerifiedApt"
                ),
                authentication
        );

        ArgumentCaptor<CommunityPost> postCaptor = ArgumentCaptor.forClass(CommunityPost.class);
        verify(communityPostRepository).save(postCaptor.capture());
        CommunityPost saved = postCaptor.getValue();
        assertThat(saved.getAptId()).isNull();
        assertThat(saved.getBoardScope()).isEqualTo("GLOBAL");
        assertThat(saved.getBoardCode()).isEqualTo("BLAH");
        assertThat(saved.getAuthorNickname()).isEqualTo("tester");
        assertThat(saved.getAuthorUserId()).isEqualTo(11L);
        assertThat(saved.getAuthorVerifiedAptId()).isEqualTo(3100L);
        assertThat(saved.getAuthorVerifiedAptName()).isEqualTo("래미안 원베일리");
        assertThat(saved.getAuthorVerificationLabel()).isEqualTo("아파트 인증: 래미안 원베일리");
        assertThat(result.id()).isEqualTo(100L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<KeywordLog>> keywordCaptor =
                ArgumentCaptor.forClass((Class) Iterable.class);
        verify(keywordLogRepository).saveAll(keywordCaptor.capture());
        assertThat(keywordCaptor.getValue()).allSatisfy(log -> assertThat(log.getAptId()).isNull());
        verify(postStatsRepository).upsertFromPost(100L);
        verify(keywordStatsRepository).incrementKeyword(eq("대출금리"), isNull(), eq("GLOBAL"), eq("BLAH"), eq(-1L));
    }

    @Test
    void createPost_globalBlah_allowsAuthenticatedMemberWithoutApartmentVerification() {
        User user = memberUser(12L, "member");
        when(authentication.getPrincipal()).thenReturn(user);
        when(communityPostRepository.save(any(CommunityPost.class))).thenAnswer(invocation -> {
            CommunityPost saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 101L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            return saved;
        });

        CommunityPostDto result = communityService.createPost(
                new CreateCommunityPostRequest(
                        "GLOBAL",
                        "BLAH",
                        null,
                        null,
                        "hello title",
                        "hello body",
                        "clientNick",
                        "clientApt",
                        999L,
                        9999L,
                        "clientVerifiedApt"
                ),
                authentication
        );

        ArgumentCaptor<CommunityPost> postCaptor = ArgumentCaptor.forClass(CommunityPost.class);
        verify(communityPostRepository).save(postCaptor.capture());
        CommunityPost saved = postCaptor.getValue();
        assertThat(saved.getAptId()).isNull();
        assertThat(saved.getBoardScope()).isEqualTo("GLOBAL");
        assertThat(saved.getBoardCode()).isEqualTo("BLAH");
        assertThat(saved.getAuthorNickname()).isEqualTo("member");
        assertThat(saved.getAuthorUserId()).isEqualTo(12L);
        assertThat(saved.getComplexName()).isEqualTo("전체 커뮤니티");
        assertThat(saved.getAuthorVerifiedAptId()).isNull();
        assertThat(saved.getAuthorVerifiedAptName()).isNull();
        assertThat(saved.getAuthorVerificationLabel()).isNull();
        assertThat(result.id()).isEqualTo(101L);
    }

    @Test
    void getPost_globalPost_recordsViewWithNullableAptIdAndLikedState() {
        CommunityPost post = post(20L, null, "GLOBAL", "BLAH", "블라블라");
        when(communityPostRepository.findById(20L)).thenReturn(Optional.of(post));
        when(postLikeLogRepository.existsByPostIdAndAuthorNickname(20L, "tester")).thenReturn(true);

        CommunityPostDto result = communityService.getPost(20L, "tester");

        assertThat(result.id()).isEqualTo(20L);
        assertThat(result.liked()).isTrue();
        ArgumentCaptor<PostViewLog> captor = ArgumentCaptor.forClass(PostViewLog.class);
        verify(postViewLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPostId()).isEqualTo(20L);
        assertThat(captor.getValue().getAptId()).isNull();
    }

    @Test
    void createComment_usesAuthenticatedVerifiedUserApartment() {
        User user = verifiedUser(11L, "tester", 3100L, "래미안 원베일리");
        CommunityPost post = post(20L, null, "GLOBAL", "BLAH", "블라블라");
        when(authentication.getPrincipal()).thenReturn(user);
        when(communityPostRepository.findById(20L)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 30L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            return saved;
        });

        CommentDto result = communityService.createComment(
                20L,
                new CreateCommentRequest("clientNick", 9999L, "clientApt", "댓글입니다"),
                authentication
        );

        assertThat(result.id()).isEqualTo(30L);
        assertThat(result.authorNickname()).isEqualTo("tester");
        assertThat(result.authorAptId()).isEqualTo(3100L);
        assertThat(result.authorAptName()).isEqualTo("래미안 원베일리");
        verify(communityPostRepository).incrementCommentCount(20L);
    }

    @Test
    void toggleLike_globalPost_allowsVerifiedUserAndStoresNullableAptId() {
        User user = verifiedUser(11L, "tester", 3100L, "래미안 원베일리");
        CommunityPost post = post(20L, null, "GLOBAL", "BLAH", "블라블라");
        ReflectionTestUtils.setField(post, "likeCount", 2);
        when(authentication.getPrincipal()).thenReturn(user);
        when(communityPostRepository.findById(20L)).thenReturn(Optional.of(post));
        when(postLikeLogRepository.existsByPostIdAndAuthorNickname(20L, "tester")).thenReturn(false);

        LikeToggleResponse result = communityService.toggleLike(20L, authentication);

        assertThat(result.liked()).isTrue();
        assertThat(result.likeCount()).isEqualTo(3);
        ArgumentCaptor<PostLikeLog> captor = ArgumentCaptor.forClass(PostLikeLog.class);
        verify(postLikeLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPostId()).isEqualTo(20L);
        assertThat(captor.getValue().getAuthorNickname()).isEqualTo("tester");
        assertThat(captor.getValue().getAptId()).isNull();
        verify(communityPostRepository).incrementLikeCount(20L);
    }

    @Test
    void getPosts_apartmentAll_usesApartmentScopeAndAptId() {
        CommunityPost post = post(40L, 3100L, "APARTMENT", "APT_FREE", "자유");
        when(communityPostRepository.findByBoardScopeAndAptIdOrderByCreatedAtDesc("APARTMENT", 3100L))
                .thenReturn(List.of(post));

        List<CommunityPostDto> result = communityService.getPosts("APARTMENT", 3100L, "APT_ALL", null, "최신순");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).aptId()).isEqualTo(3100L);
        assertThat(result.get(0).boardScope()).isEqualTo("APARTMENT");
        verify(communityPostRepository).findByBoardScopeAndAptIdOrderByCreatedAtDesc("APARTMENT", 3100L);
    }

    @Test
    void getPosts_commentSort_ordersByCommentCountThenCreatedAt() {
        CommunityPost low = post(70L, null, "GLOBAL", "BLAH", "블라블라");
        ReflectionTestUtils.setField(low, "commentCount", 1);
        ReflectionTestUtils.setField(low, "createdAt", LocalDateTime.now());
        CommunityPost high = post(71L, null, "GLOBAL", "BLAH", "블라블라");
        ReflectionTestUtils.setField(high, "commentCount", 5);
        ReflectionTestUtils.setField(high, "createdAt", LocalDateTime.now().minusDays(1));
        when(communityPostRepository.findByBoardScopeAndBoardCodeOrderByCreatedAtDesc("GLOBAL", "BLAH"))
                .thenReturn(List.of(low, high));

        List<CommunityPostDto> result = communityService.getPosts("GLOBAL", null, "BLAH", null, "댓글순");

        assertThat(result).extracting(CommunityPostDto::id).containsExactly(71L, 70L);
    }

    @Test
    void getMyComments_includesPostBoardContextForMyPage() {
        Comment comment = Comment.create(80L, "tester", "댓글입니다", 3100L, "래미안 원베일리");
        ReflectionTestUtils.setField(comment, "id", 90L);
        ReflectionTestUtils.setField(comment, "createdAt", LocalDateTime.now());
        CommunityPost post = post(80L, null, "GLOBAL", "BLAH", "블라블라");
        when(commentRepository.findByAuthorNicknameOrderByCreatedAtDesc("tester")).thenReturn(List.of(comment));
        when(communityPostRepository.findById(80L)).thenReturn(Optional.of(post));

        List<CommentDto> result = communityService.getMyComments("tester");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).postTitle()).isEqualTo("제목");
        assertThat(result.get(0).postBoardScope()).isEqualTo("GLOBAL");
        assertThat(result.get(0).postBoardCode()).isEqualTo("BLAH");
        assertThat(result.get(0).postCategory()).isEqualTo("블라블라");
    }

    @Test
    void getPopularPosts_globalBlah_readsFromScopeAwarePostStatsRanking() {
        CommunityPost ranked = post(50L, null, "GLOBAL", "BLAH", "블라블라");
        when(communityPostRepository.findRankedPopularByScope("GLOBAL", "BLAH", 5))
                .thenReturn(List.of(ranked));

        List<CommunityPostDto> result = communityService.getPopularPosts("GLOBAL", null, "BLAH");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(50L);
        assertThat(result.get(0).boardScope()).isEqualTo("GLOBAL");
        assertThat(result.get(0).boardCode()).isEqualTo("BLAH");
    }

    @Test
    void getPopularPosts_globalBlah_fallsBackToPostsWhenStatsRowsAreMissing() {
        CommunityPost fallback = post(51L, null, "GLOBAL", "BLAH", "BLAH");
        when(communityPostRepository.findRankedPopularByScope("GLOBAL", "BLAH", 5))
                .thenReturn(List.of());
        when(communityPostRepository.findPopularByScope(eq("GLOBAL"), eq("BLAH"), any(Pageable.class)))
                .thenReturn(List.of(fallback));

        List<CommunityPostDto> result = communityService.getPopularPosts("GLOBAL", null, "BLAH");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(51L);
        assertThat(result.get(0).aptId()).isNull();
        assertThat(result.get(0).boardScope()).isEqualTo("GLOBAL");
    }

    @Test
    void getMostCommentedPosts_apartmentAll_readsFromScopeAwarePostStatsRanking() {
        CommunityPost ranked = post(60L, 3100L, "APARTMENT", "APT_FREE", "자유");
        when(communityPostRepository.findRankedMostCommentedByScopeAndAptId("APARTMENT", 3100L, null, 5))
                .thenReturn(List.of(ranked));

        List<CommunityPostDto> result = communityService.getMostCommentedPosts("APARTMENT", 3100L, "APT_ALL");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(60L);
        assertThat(result.get(0).aptId()).isEqualTo(3100L);
        assertThat(result.get(0).boardScope()).isEqualTo("APARTMENT");
    }

    @Test
    void getMostCommentedPosts_globalBlah_fallsBackToPostsWhenStatsRowsAreMissing() {
        CommunityPost fallback = post(61L, null, "GLOBAL", "BLAH", "BLAH");
        ReflectionTestUtils.setField(fallback, "commentCount", 3);
        when(communityPostRepository.findRankedMostCommentedByScope("GLOBAL", "BLAH", 5))
                .thenReturn(List.of());
        when(communityPostRepository.findMostCommentedByScope(eq("GLOBAL"), eq("BLAH"), any(Pageable.class)))
                .thenReturn(List.of(fallback));

        List<CommunityPostDto> result = communityService.getMostCommentedPosts("GLOBAL", null, "BLAH");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(61L);
        assertThat(result.get(0).aptId()).isNull();
        assertThat(result.get(0).commentCount()).isEqualTo(3);
    }

    @Test
    void getTrendingKeywords_globalBoard_readsFromScopeAwareKeywordStats() {
        when(keywordStatsRepository.findTrendingKeywords("GLOBAL", null, "BLAH"))
                .thenReturn(List.of("대출금리", "청약"));

        List<String> result = communityService.getTrendingKeywords("GLOBAL", null, "BLAH");

        assertThat(result).containsExactly("대출금리", "청약");
    }

    @Test
    void getTrendingKeywords_globalBoard_fallsBackToPostTextWhenStatsRowsAreMissing() {
        CommunityPost post = CommunityPost.create(
                null,
                "BLAH",
                "GLOBAL",
                "BLAH",
                "loan rate",
                "loan market rate",
                "author",
                "전체 커뮤니티",
                11L,
                null,
                null,
                null
        );
        ReflectionTestUtils.setField(post, "id", 70L);
        ReflectionTestUtils.setField(post, "createdAt", LocalDateTime.now());
        when(keywordStatsRepository.findTrendingKeywords("GLOBAL", null, "BLAH"))
                .thenReturn(List.of());
        when(communityPostRepository.findByBoardScopeAndBoardCodeOrderByCreatedAtDesc("GLOBAL", "BLAH"))
                .thenReturn(List.of(post));

        List<String> result = communityService.getTrendingKeywords("GLOBAL", null, "BLAH");

        assertThat(result).contains("loan", "rate");
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
        return user;
    }

    private User memberUser(Long id, String nickname) {
        User user = User.builder()
                .email(nickname + "@example.com")
                .passwordHash("encoded")
                .nickname(nickname)
                .marketingAgreed(false)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private CommunityPost post(Long id, Long aptId, String scope, String boardCode, String category) {
        CommunityPost post = CommunityPost.create(
                aptId,
                category,
                scope,
                boardCode,
                "제목",
                "본문입니다",
                "author",
                "래미안 원베일리",
                11L,
                3100L,
                "래미안 원베일리",
                "아파트 인증: 래미안 원베일리"
        );
        ReflectionTestUtils.setField(post, "id", id);
        ReflectionTestUtils.setField(post, "createdAt", LocalDateTime.now().minusMinutes(5));
        return post;
    }
}
