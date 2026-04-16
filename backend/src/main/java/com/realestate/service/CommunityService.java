package com.realestate.service;

import com.realestate.domain.entity.CommunityPost;
import com.realestate.domain.repository.CommunityPostRepository;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommunityPostRequest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
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

        return posts.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommunityPostDto getPost(Long id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return toDto(post);
    }

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
        return toDto(created);
    }

    @Transactional(readOnly = true)
    public List<CommunityPostDto> getPopularPosts(Long aptId) {
        validateAptId(aptId);
        return communityPostRepository.findPopularByAptId(aptId, PageRequest.of(0, 5))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityPostDto> getMostCommentedPosts(Long aptId) {
        validateAptId(aptId);
        return communityPostRepository.findMostCommentedByAptId(aptId, PageRequest.of(0, 5))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getTrendingKeywords(Long aptId) {
        validateAptId(aptId);
        List<CommunityPost> posts = communityPostRepository.findByAptIdOrderByCreatedAtDesc(aptId);

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

    private String toRelativeTime(LocalDateTime createdAt) {
        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        long minutes = Math.max(duration.toMinutes(), 0);
        if (minutes < 1) {
            return "방금 전";
        }
        if (minutes < 60) {
            return minutes + "분 전";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "시간 전";
        }
        long days = hours / 24;
        return days + "일 전";
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
        if (isBlank(request.category())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "category is required");
        }
        if (isBlank(request.title())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        if (isBlank(request.content())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        if (isBlank(request.authorNickname())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorNickname is required");
        }
        if (isBlank(request.complexName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "complexName is required");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
