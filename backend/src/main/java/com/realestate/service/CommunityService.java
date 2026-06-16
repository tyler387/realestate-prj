package com.realestate.service;

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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private static final String CATEGORY_ALL = "전체";
    private static final String SORT_POPULAR = "인기순";
    private static final String SORT_COMMENT = "댓글순";
    private static final String SCOPE_GLOBAL = "GLOBAL";
    private static final String SCOPE_APARTMENT = "APARTMENT";
    private static final String BOARD_GLOBAL_DEFAULT = "BLAH";
    private static final String BOARD_APARTMENT_ALL = "APT_ALL";
    private static final List<String> STOP_WORDS = List.of(
            "이", "가", "을", "를", "은", "는", "의", "에", "에서", "와", "과", "도", "로", "으로",
            "하다", "있다", "없다", "되다", "것", "수", "그", "저", "이것", "저것", "어떻게",
            "어디", "누가", "왜", "언제", "얼마", "어느", "그런데", "그리고", "하지만", "그러나",
            "너무", "정말", "진짜", "좀", "더", "같은", "같아요", "같습니다", "입니다", "합니다", "아요",
            "있나요", "있어요", "계신가요", "주세요", "분들", "해요", "했어요", "인가요", "해주세요"
    );

    private final CommunityPostRepository communityPostRepository;
    private final PostStatsRepository postStatsRepository;
    private final KeywordStatsRepository keywordStatsRepository;
    private final PostViewLogRepository postViewLogRepository;
    private final KeywordLogRepository keywordLogRepository;
    private final CommentRepository commentRepository;
    private final PostLikeLogRepository postLikeLogRepository;

    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPosts(String scope, Long aptId, String boardCode, String category, String sortType) {
        String normalizedScope = normalizeScope(scope, aptId);
        String normalizedCategory = category == null ? "" : category.trim();
        String normalizedBoardCode = resolveBoardCodeFilter(normalizedScope, boardCode, normalizedCategory);
        String normalizedSort = sortType == null ? "" : sortType.trim();

        List<CommunityPost> posts;
        if (SCOPE_GLOBAL.equals(normalizedScope)) {
            posts = isBoardAll(normalizedBoardCode)
                    ? communityPostRepository.findByBoardScopeOrderByCreatedAtDesc(SCOPE_GLOBAL)
                    : communityPostRepository.findByBoardScopeAndBoardCodeOrderByCreatedAtDesc(SCOPE_GLOBAL, normalizedBoardCode);
        } else {
            validateAptId(aptId);
            posts = isBoardAll(normalizedBoardCode)
                    ? communityPostRepository.findByBoardScopeAndAptIdOrderByCreatedAtDesc(SCOPE_APARTMENT, aptId)
                    : communityPostRepository.findByBoardScopeAndAptIdAndBoardCodeOrderByCreatedAtDesc(SCOPE_APARTMENT, aptId, normalizedBoardCode);
        }

        if (SORT_POPULAR.equals(normalizedSort)) {
            posts = posts.stream()
                    .sorted(Comparator
                            .comparingInt((CommunityPost post) -> post.getLikeCount() * 2 + post.getCommentCount())
                            .reversed()
                            .thenComparing(CommunityPost::getCreatedAt, Comparator.reverseOrder()))
                    .toList();
        } else if (SORT_COMMENT.equals(normalizedSort)) {
            posts = posts.stream()
                    .sorted(Comparator
                            .comparingInt(CommunityPost::getCommentCount)
                            .reversed()
                            .thenComparing(CommunityPost::getCreatedAt, Comparator.reverseOrder()))
                    .toList();
        }

        return posts.stream().map(this::toDto).toList();
    }

    // 조회 시 view_log 기록 (PRD §11.2)
    @Transactional
    public CommunityPostDto getPost(Long id, String nickname) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        postViewLogRepository.save(PostViewLog.create(post.getId(), post.getAptId(), post.getBoardScope(), post.getBoardCode()));
        postStatsRepository.incrementViewCount(post.getId());
        boolean liked = nickname != null && postLikeLogRepository.existsByPostIdAndAuthorNickname(id, nickname);
        return toDto(post, liked);
    }

    // 작성 시 keyword_logs 기록 (PRD §11.4)
    @Transactional
    public CommunityPostDto createPost(CreateCommunityPostRequest request, Authentication authentication) {
        User user = requireAuthenticatedUser(authentication);
        validateCreateRequest(request, user);
        Long requestedAptId = firstNonNull(request.aptId(), user.getApartmentId());
        String scope = normalizeScope(request.scope(), requestedAptId);
        if (SCOPE_APARTMENT.equals(scope)) {
            requireVerifiedUser(user);
        }
        String boardCode = resolveBoardCodeForCreate(scope, request.boardCode(), request.category());
        String category = resolveCategoryLabel(scope, boardCode, request.category());
        Long aptId = SCOPE_APARTMENT.equals(scope) ? requestedAptId : null;
        Long verifiedAptId = isVerifiedUser(user) ? user.getApartmentId() : null;
        String verifiedAptName = isVerifiedUser(user) ? user.getApartmentName() : null;
        String verificationLabel = isBlank(verifiedAptName) ? null : "아파트 인증: " + verifiedAptName.trim();
        CommunityPost created = communityPostRepository.save(
                CommunityPost.create(
                        aptId,
                        category,
                        scope,
                        boardCode,
                        request.title().trim(),
                        request.content().trim(),
                        user.getNickname(),
                        firstNonBlank(verifiedAptName, SCOPE_GLOBAL.equals(scope) ? "전체 커뮤니티" : "아파트"),
                        user.getId(),
                        verifiedAptId,
                        verifiedAptName,
                        verificationLabel
                )
        );
        postStatsRepository.upsertFromPost(created.getId());

        List<KeywordLog> keywordLogs = extractKeywords(created.getTitle(), created.getContent())
                .stream()
                .map(kw -> KeywordLog.ofPost(kw, created.getId(), created.getAptId(), created.getBoardScope(), created.getBoardCode()))
                .toList();
        if (!keywordLogs.isEmpty()) {
            keywordLogRepository.saveAll(keywordLogs);
            keywordLogs.forEach(log ->
                    keywordStatsRepository.incrementKeyword(
                            log.getKeyword(),
                            log.getAptId(),
                            log.getBoardScope(),
                            log.getBoardCode(),
                            scopeAptKey(log.getAptId())));
        }

        return toDto(created);
    }

    // post_stats 기반 — scope/board/apt가 섞이지 않도록 랭킹 집계 테이블에서 Top 5를 읽는다.
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPopularPosts(String scope, Long aptId, String boardCode) {
        String normalizedScope = normalizeScope(scope, aptId);
        String normalizedBoardCode = resolveBoardCodeFilter(normalizedScope, boardCode, null);
        if (SCOPE_GLOBAL.equals(normalizedScope)) {
            List<CommunityPost> ranked = communityPostRepository.findRankedPopularByScope(SCOPE_GLOBAL, normalizedBoardCode, 5);
            if (!ranked.isEmpty()) return ranked.stream().map(this::toDto).toList();
            return communityPostRepository.findPopularByScope(SCOPE_GLOBAL, normalizedBoardCode, PageRequest.of(0, 5))
                    .stream().map(this::toDto).toList();
        }
        validateAptId(aptId);
        List<CommunityPost> ranked = communityPostRepository.findRankedPopularByScopeAndAptId(
                SCOPE_APARTMENT, aptId, normalizedBoardCode, 5);
        if (!ranked.isEmpty()) return ranked.stream().map(this::toDto).toList();
        return communityPostRepository.findPopularByScopeAndAptId(
                SCOPE_APARTMENT, aptId, normalizedBoardCode, PageRequest.of(0, 5))
                .stream().map(this::toDto).toList();
    }

    // post_stats 기반 — 댓글 수 내림차순 Top 5
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getMostCommentedPosts(String scope, Long aptId, String boardCode) {
        String normalizedScope = normalizeScope(scope, aptId);
        String normalizedBoardCode = resolveBoardCodeFilter(normalizedScope, boardCode, null);
        if (SCOPE_GLOBAL.equals(normalizedScope)) {
            List<CommunityPost> ranked = communityPostRepository.findRankedMostCommentedByScope(SCOPE_GLOBAL, normalizedBoardCode, 5);
            if (!ranked.isEmpty()) return ranked.stream().map(this::toDto).toList();
            return communityPostRepository.findMostCommentedByScope(SCOPE_GLOBAL, normalizedBoardCode, PageRequest.of(0, 5))
                    .stream().map(this::toDto).toList();
        }
        validateAptId(aptId);
        List<CommunityPost> ranked = communityPostRepository.findRankedMostCommentedByScopeAndAptId(
                SCOPE_APARTMENT, aptId, normalizedBoardCode, 5);
        if (!ranked.isEmpty()) return ranked.stream().map(this::toDto).toList();
        return communityPostRepository.findMostCommentedByScopeAndAptId(
                SCOPE_APARTMENT, aptId, normalizedBoardCode, PageRequest.of(0, 5))
                .stream().map(this::toDto).toList();
    }

    // keyword_stats 기반 Top 10, 데이터 없으면 텍스트 파싱 fallback (PRD §10.3)
    @Transactional(readOnly = true)
    public List<String> getTrendingKeywords(String scope, Long aptId, String boardCode) {
        String normalizedScope = normalizeScope(scope, aptId);
        String normalizedBoardCode = resolveBoardCodeFilter(normalizedScope, boardCode, null);
        if (SCOPE_APARTMENT.equals(normalizedScope)) validateAptId(aptId);

        List<String> keywords = keywordStatsRepository.findTrendingKeywords(normalizedScope, aptId, normalizedBoardCode);
        if (!keywords.isEmpty()) {
            return keywords;
        }
        return extractKeywordsFromPosts(normalizedScope, aptId, normalizedBoardCode);
    }

    // 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream().map(this::toCommentDto).toList();
    }

    // 댓글 작성
    @Transactional
    public CommentDto createComment(Long postId, CreateCommentRequest request, Authentication authentication) {
        User user = requireVerifiedUser(authentication);
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (request == null || isBlank(request.content())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        Comment saved = commentRepository.save(
                Comment.create(post.getId(), user.getNickname(), request.content().trim(),
                        user.getApartmentId(), user.getApartmentName()));
        communityPostRepository.incrementCommentCount(postId);
        postStatsRepository.incrementCommentCount(postId);
        return toCommentDto(saved);
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long postId, Authentication authentication) {
        User user = requireAuthenticatedUser(authentication);
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!isPostOwner(post, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this post");
        }
        commentRepository.deleteByPostId(postId);
        postLikeLogRepository.deleteByPostId(postId);
        postStatsRepository.deleteById(postId);
        communityPostRepository.delete(post);
    }

    // 댓글 삭제
    @Transactional
    public void deleteComment(Long commentId, Authentication authentication) {
        User user = requireAuthenticatedUser(authentication);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!isSameNickname(comment.getAuthorNickname(), user.getNickname())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this comment");
        }
        commentRepository.delete(comment);
        communityPostRepository.decrementCommentCount(comment.getPostId());
        postStatsRepository.decrementCommentCount(comment.getPostId());
    }

    // 좋아요 토글
    @Transactional
    public LikeToggleResponse toggleLike(Long postId, Authentication authentication) {
        User user = requireVerifiedUser(authentication);
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        String authorNickname = user.getNickname();
        boolean alreadyLiked = postLikeLogRepository.existsByPostIdAndAuthorNickname(postId, authorNickname);
        if (alreadyLiked) {
            postLikeLogRepository.deleteByPostIdAndAuthorNickname(postId, authorNickname);
            communityPostRepository.decrementLikeCount(postId);
            postStatsRepository.decrementLikeCount(postId);
            return new LikeToggleResponse(false, Math.max(0, post.getLikeCount() - 1));
        } else {
            postLikeLogRepository.save(PostLikeLog.create(postId, authorNickname, post.getAptId(), post.getBoardScope(), post.getBoardCode()));
            communityPostRepository.incrementLikeCount(postId);
            postStatsRepository.incrementLikeCount(postId);
            return new LikeToggleResponse(true, post.getLikeCount() + 1);
        }
    }

    // 내가 쓴 게시글
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getMyPosts(String authorNickname) {
        if (isBlank(authorNickname)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        }
        return communityPostRepository.findByAuthorNicknameOrderByCreatedAtDesc(authorNickname)
                .stream().map(this::toDto).toList();
    }

    // 내가 쓴 댓글
    @Transactional(readOnly = true)
    public List<CommentDto> getMyComments(String authorNickname) {
        if (isBlank(authorNickname)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        }
        return commentRepository.findByAuthorNicknameOrderByCreatedAtDesc(authorNickname)
                .stream().map(comment -> {
                    CommunityPost post = communityPostRepository.findById(comment.getPostId()).orElse(null);
                    return toCommentDto(comment, post);
                }).toList();
    }

    // ── private helpers ──────────────────────────────────────

    private CommentDto toCommentDto(Comment comment) {
        return toCommentDto(comment, null);
    }

    private CommentDto toCommentDto(Comment comment, CommunityPost post) {
        return new CommentDto(
                comment.getId(),
                comment.getPostId(),
                post == null ? null : post.getTitle(),
                post == null ? null : post.getBoardScope(),
                post == null ? null : post.getBoardCode(),
                post == null ? null : post.getCategory(),
                comment.getAuthorNickname(),
                comment.getAuthorAptId(),
                comment.getAuthorAptName(),
                comment.getContent(),
                toRelativeTime(comment.getCreatedAt())
        );
    }

    private CommunityPostDto toDto(CommunityPost post) {
        return toDto(post, false);
    }

    private CommunityPostDto toDto(CommunityPost post, boolean liked) {
        return new CommunityPostDto(
                post.getId(),
                post.getAptId(),
                post.getBoardScope(),
                post.getBoardCode(),
                post.getCategory(),
                post.getTitle(),
                post.getContent(),
                post.getAuthorNickname(),
                post.getComplexName(),
                post.getAuthorVerifiedAptId(),
                post.getAuthorVerifiedAptName(),
                post.getAuthorVerificationLabel(),
                toRelativeTime(post.getCreatedAt()),
                post.getLikeCount(),
                post.getCommentCount(),
                liked
        );
    }

    // title + content에서 키워드 추출 (PRD §11.4 KeywordExtractor 로직)
    private List<String> extractKeywords(String title, String content) {
        return Arrays.stream((title + " " + content).split("\\s+"))
                .map(w -> w.replaceAll("[^가-힣a-zA-Z0-9]", ""))
                .filter(w -> w.length() >= 2 && w.length() <= 50 && !STOP_WORDS.contains(w))
                .distinct()
                .toList();
    }

    // keyword_stats 없을 때 텍스트 파싱 fallback — 최근 50개만 분석
    private List<String> extractKeywordsFromPosts(String scope, Long aptId, String boardCode) {
        List<CommunityPost> posts = findPostsForKeywordFallback(scope, aptId, boardCode);
        Map<String, Long> wordCount = posts.stream()
                .flatMap(post -> Arrays.stream((post.getTitle() + " " + post.getContent()).split("[\\s,!?.]+"))
                        .map(w -> w.replaceAll("[^가-힣a-zA-Z0-9]", ""))
                        .filter(w -> w.length() >= 2 && !STOP_WORDS.contains(w)))
                .collect(Collectors.groupingBy(w -> w, Collectors.counting()));

        return wordCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<CommunityPost> findPostsForKeywordFallback(String scope, Long aptId, String boardCode) {
        List<CommunityPost> posts;
        if (SCOPE_GLOBAL.equals(scope)) {
            posts = boardCode == null
                    ? communityPostRepository.findByBoardScopeOrderByCreatedAtDesc(SCOPE_GLOBAL)
                    : communityPostRepository.findByBoardScopeAndBoardCodeOrderByCreatedAtDesc(SCOPE_GLOBAL, boardCode);
        } else {
            validateAptId(aptId);
            posts = boardCode == null
                    ? communityPostRepository.findByBoardScopeAndAptIdOrderByCreatedAtDesc(SCOPE_APARTMENT, aptId)
                    : communityPostRepository.findByBoardScopeAndAptIdAndBoardCodeOrderByCreatedAtDesc(SCOPE_APARTMENT, aptId, boardCode);
        }
        return posts.stream().limit(50).toList();
    }

    private String toRelativeTime(LocalDateTime createdAt) {
        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        long minutes = Math.max(duration.toMinutes(), 0);
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";
        long hours = minutes / 60;
        if (hours < 24) return hours + "시간 전";
        return hours / 24 + "일 전";
    }

    private boolean isCategoryAll(String category) {
        return category.isBlank() || CATEGORY_ALL.equals(category);
    }

    private boolean isBoardAll(String boardCode) {
        return boardCode == null || boardCode.isBlank() || BOARD_APARTMENT_ALL.equals(boardCode);
    }

    private String normalizeScope(String scope, Long aptId) {
        if (SCOPE_GLOBAL.equals(scope)) return SCOPE_GLOBAL;
        if (SCOPE_APARTMENT.equals(scope)) return SCOPE_APARTMENT;
        return aptId == null ? SCOPE_GLOBAL : SCOPE_APARTMENT;
    }

    private String resolveBoardCodeFilter(String scope, String boardCode, String category) {
        if (!isBlank(boardCode)) {
            String normalizedBoardCode = boardCode.trim();
            return isBoardAll(normalizedBoardCode) ? null : normalizedBoardCode;
        }
        String normalizedCategory = category == null ? "" : category.trim();
        if (isCategoryAll(normalizedCategory)) return null;
        return resolveBoardCodeForCreate(scope, null, normalizedCategory);
    }

    private String resolveBoardCodeForCreate(String scope, String boardCode, String category) {
        if (!isBlank(boardCode)) return boardCode.trim();
        String normalizedCategory = category == null ? "" : category.trim();
        if (SCOPE_GLOBAL.equals(scope)) {
            return switch (normalizedCategory) {
                case "부동산" -> "REAL_ESTATE";
                case "주식" -> "STOCK";
                case "연애" -> "DATING";
                case "블라블라", "" -> BOARD_GLOBAL_DEFAULT;
                default -> BOARD_GLOBAL_DEFAULT;
            };
        }
        return switch (normalizedCategory) {
            case "", "전체" -> BOARD_APARTMENT_ALL;
            case "질문" -> "APT_QNA";
            case "정보" -> "APT_INFO";
            case "실거래", "거래" -> "APT_TRADE";
            case "민원", "민원/하자" -> "APT_ISSUE";
            case "자유" -> "APT_FREE";
            default -> "APT_FREE";
        };
    }

    private String resolveCategoryLabel(String scope, String boardCode, String fallback) {
        if (!isBlank(fallback) && !CATEGORY_ALL.equals(fallback.trim())) return fallback.trim();
        if (SCOPE_GLOBAL.equals(scope)) {
            return switch (boardCode) {
                case "REAL_ESTATE" -> "부동산";
                case "STOCK" -> "주식";
                case "DATING" -> "연애";
                case "BLAH" -> "블라블라";
                default -> "블라블라";
            };
        }
        return switch (boardCode) {
            case "APT_QNA" -> "질문";
            case "APT_INFO" -> "정보";
            case "APT_TRADE" -> "실거래";
            case "APT_ISSUE" -> "민원/하자";
            case "APT_ALL", "APT_FREE" -> "자유";
            default -> "자유";
        };
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) return value.trim();
        }
        return "";
    }

    private Long firstNonNull(Long... values) {
        for (Long value : values) {
            if (value != null) return value;
        }
        return null;
    }

    private Long scopeAptKey(Long aptId) {
        return aptId == null ? -1L : aptId;
    }

    private void validateAptId(Long aptId) {
        if (aptId == null || aptId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "aptId is required");
        }
    }

    private User requireVerifiedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login is required");
        }
        if (user.getStatus() != User.UserStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "아파트 인증 후 이용할 수 있습니다.");
        }
        if (user.getApartmentId() == null || isBlank(user.getApartmentName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "아파트 인증 정보가 없습니다.");
        }
        return user;
    }

    private User requireAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login is required");
        }
        return user;
    }

    private void requireVerifiedUser(User user) {
        if (!isVerifiedUser(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apartment verification is required");
        }
    }

    private boolean isVerifiedUser(User user) {
        return user.getStatus() == User.UserStatus.VERIFIED
                && user.getApartmentId() != null
                && !isBlank(user.getApartmentName());
    }

    private boolean isPostOwner(CommunityPost post, User user) {
        if (post.getAuthorUserId() != null && user.getId() != null) {
            return post.getAuthorUserId().equals(user.getId());
        }
        return isSameNickname(post.getAuthorNickname(), user.getNickname());
    }

    private boolean isSameNickname(String left, String right) {
        return left != null && left.equals(right);
    }

    private void validateCreateRequest(CreateCommunityPostRequest request, User user) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        Long requestedAptId = firstNonNull(request.aptId(), user.getApartmentId());
        String scope = normalizeScope(request.scope(), requestedAptId);
        if (SCOPE_APARTMENT.equals(scope)) validateAptId(requestedAptId);
        if (isBlank(request.title()))         throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        if (isBlank(request.content()))       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
