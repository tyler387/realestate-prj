package com.realestate.service;

import com.realestate.domain.entity.CommunityPost;
import com.realestate.domain.entity.KeywordLog;
import com.realestate.domain.entity.PostViewLog;
import com.realestate.domain.repository.CommunityPostRepository;
import com.realestate.domain.repository.KeywordLogRepository;
import com.realestate.domain.repository.KeywordStatsRepository;
import com.realestate.domain.repository.PostStatsRepository;
import com.realestate.domain.repository.PostViewLogRepository;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommunityPostRequest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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
    public CommunityPostDto getPost(Long id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        postViewLogRepository.save(PostViewLog.create(post.getId(), post.getAptId()));
        return toDto(post);
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

    // stats 테이블 기반 — score(좋아요*2+댓글) 내림차순, 24h → 7d fallback
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPopularPosts(Long aptId) {
        validateAptId(aptId);
        List<Object[]> rows = postStatsRepository.findPopularPosts(aptId, 1);
        if (rows.size() < 3) {
            rows = postStatsRepository.findPopularPosts(aptId, 7);
        }
        return rows.stream().map(this::toDtoFromStats).toList();
    }

    // stats 테이블 기반 — 댓글 수 내림차순, 24h → 7d fallback
    @Transactional(readOnly = true)
    public List<CommunityPostDto> getMostCommentedPosts(Long aptId) {
        validateAptId(aptId);
        List<Object[]> rows = postStatsRepository.findMostCommentedPosts(aptId, 1);
        if (rows.size() < 3) {
            rows = postStatsRepository.findMostCommentedPosts(aptId, 7);
        }
        return rows.stream().map(this::toDtoFromStats).toList();
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

    // ── private helpers ──────────────────────────────────────

    private CommunityPostDto toDto(CommunityPost post) {
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
                false
        );
    }

    // native query Object[] → CommunityPostDto
    // 컬럼 순서: id, apt_id, category, title, content, author_nickname, complex_name, created_at, like_count, comment_count
    private CommunityPostDto toDtoFromStats(Object[] row) {
        LocalDateTime createdAt = row[7] instanceof java.sql.Timestamp ts
                ? ts.toLocalDateTime()
                : (LocalDateTime) row[7];
        return new CommunityPostDto(
                ((Number) row[0]).longValue(),
                ((Number) row[1]).longValue(),
                (String) row[2],
                (String) row[3],
                (String) row[4],
                (String) row[5],
                (String) row[6],
                toRelativeTime(createdAt),
                ((Number) row[8]).intValue(),
                ((Number) row[9]).intValue(),
                false
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
