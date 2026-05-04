package com.realestate.service;

import com.realestate.domain.entity.Comment;
import com.realestate.domain.entity.CommunityPost;
import com.realestate.domain.entity.KeywordLog;
import com.realestate.domain.entity.PostLikeLog;
import com.realestate.domain.entity.PostViewLog;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private static final String CATEGORY_ALL = "전체";
    private static final String SORT_POPULAR = "인기순";
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
    public List<CommunityPostDto> getPosts(Long aptId, String category, String sortType) {
        validateAptId(aptId);
        String normalizedCategory = category == null ? "" : category.trim();
        String normalizedSort = sortType == null ? "" : sortType.trim();

        List<CommunityPost> posts = isCategoryAll(normalizedCategory)
                ? communityPostRepository.findByAptIdOrderByCreatedAtDesc(aptId)
                : communityPostRepository.findByAptIdAndCategoryOrderByCreatedAtDesc(aptId, normalizedCategory);

        if (SORT_POPULAR.equals(normalizedSort)) {
            posts = posts.stream()
                    .sorted(Comparator
                            .comparingInt((CommunityPost post) -> post.getLikeCount() * 2 + post.getCommentCount())
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
        postViewLogRepository.save(PostViewLog.create(post.getId(), post.getAptId()));
        boolean liked = nickname != null && postLikeLogRepository.existsByPostIdAndAuthorNickname(id, nickname);
        return toDto(post, liked);
    }

    // 작성 시 keyword_logs 기록 (PRD §11.4)
    @Transactional
    public CommunityPostDto createPost(CreateCommunityPostRequest request) {
        validateCreateRequest(request);
        CommunityPost created = communityPostRepository.save(
                CommunityPost.create(
                        request.aptId(),
                        request.category().trim(),
                        request.title().trim(),
                        request.content().trim(),
                        request.authorNickname().trim(),
                        request.complexName().trim()
                )
        );

        List<KeywordLog> keywordLogs = extractKeywords(created.getTitle(), created.getContent())
                .stream()
                .map(kw -> KeywordLog.ofPost(kw, created.getId(), created.getAptId()))
                .toList();
        if (!keywordLogs.isEmpty()) {
            keywordLogRepository.saveAll(keywordLogs);
        }

        return toDto(created);
    }

    // posts 테이블 기반 — score(좋아요*2+댓글) 내림차순 Top 5
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPopularPosts(Long aptId) {
        validateAptId(aptId);
        return communityPostRepository.findPopularByAptId(aptId, PageRequest.of(0, 5))
                .stream().map(this::toDto).toList();
    }

    // posts 테이블 기반 — 댓글 수 내림차순 Top 5
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getMostCommentedPosts(Long aptId) {
        validateAptId(aptId);
        return communityPostRepository.findMostCommentedByAptId(aptId, PageRequest.of(0, 5))
                .stream().map(this::toDto).toList();
    }

    // keyword_stats 기반 Top 10, 데이터 없으면 텍스트 파싱 fallback (PRD §10.3)
    @Transactional(readOnly = true)
    public List<String> getTrendingKeywords(Long aptId) {
        validateAptId(aptId);
        List<String> keywords = keywordStatsRepository.findTrendingKeywords(aptId);
        if (!keywords.isEmpty()) {
            return keywords;
        }
        return extractKeywordsFromPosts(aptId);
    }

    // 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream().map(this::toCommentDto).toList();
    }

    // 댓글 작성
    @Transactional
    public CommentDto createComment(Long postId, CreateCommentRequest request) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (isBlank(request.authorNickname())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        }
        if (isBlank(request.content())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        Comment saved = commentRepository.save(
                Comment.create(postId, request.authorNickname().trim(), request.content().trim(),
                        request.authorAptId(), request.authorAptName()));
        communityPostRepository.incrementCommentCount(postId);
        return toCommentDto(saved);
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long postId, String authorNickname) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!post.getAuthorNickname().equals(authorNickname)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this post");
        }
        commentRepository.deleteByPostId(postId);
        postLikeLogRepository.deleteByPostId(postId);
        postStatsRepository.deleteById(postId);
        communityPostRepository.delete(post);
    }

    // 댓글 삭제
    @Transactional
    public void deleteComment(Long commentId, String authorNickname) {
        Comment comment = commentRepository.findByIdAndAuthorNickname(commentId, authorNickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this comment"));
        commentRepository.delete(comment);
        communityPostRepository.decrementCommentCount(comment.getPostId());
    }

    // 좋아요 토글
    @Transactional
    public LikeToggleResponse toggleLike(Long postId, String authorNickname) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (isBlank(authorNickname)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        }
        boolean alreadyLiked = postLikeLogRepository.existsByPostIdAndAuthorNickname(postId, authorNickname);
        if (alreadyLiked) {
            postLikeLogRepository.deleteByPostIdAndAuthorNickname(postId, authorNickname);
            communityPostRepository.decrementLikeCount(postId);
            return new LikeToggleResponse(false, Math.max(0, post.getLikeCount() - 1));
        } else {
            postLikeLogRepository.save(PostLikeLog.create(postId, authorNickname, post.getAptId()));
            communityPostRepository.incrementLikeCount(postId);
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
                .stream().map(this::toCommentDto).toList();
    }

    // ── private helpers ──────────────────────────────────────

    private CommentDto toCommentDto(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getPostId(),
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
                post.getCategory(),
                post.getTitle(),
                post.getContent(),
                post.getAuthorNickname(),
                post.getComplexName(),
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
    private List<String> extractKeywordsFromPosts(Long aptId) {
        List<CommunityPost> posts = communityPostRepository.findByAptIdOrderByCreatedAtDesc(aptId,
                org.springframework.data.domain.PageRequest.of(0, 50));
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

    private void validateAptId(Long aptId) {
        if (aptId == null || aptId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "aptId is required");
        }
    }

    private void validateCreateRequest(CreateCommunityPostRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        validateAptId(request.aptId());
        if (isBlank(request.category()))      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "category is required");
        if (isBlank(request.title()))         throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        if (isBlank(request.content()))       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        if (isBlank(request.authorNickname())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        if (isBlank(request.complexName()))   throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "complexName is required");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
