package com.realestate.web.controller;

import com.realestate.service.CommunityService;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommunityPostRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/posts")
    public List<CommunityPostDto> getPosts(
            @RequestParam Long aptId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "최신순") String sortType
    ) {
        return communityService.getPosts(aptId, category, sortType);
    }

    @GetMapping("/posts/{id}")
    public CommunityPostDto getPost(@PathVariable Long id) {
        return communityService.getPost(id);
    }

    @PostMapping("/posts")
    public CommunityPostDto createPost(@RequestBody CreateCommunityPostRequest request) {
        return communityService.createPost(request);
    }

    @GetMapping("/posts/popular")
    public List<CommunityPostDto> getPopularPosts(@RequestParam Long aptId) {
        return communityService.getPopularPosts(aptId);
    }

    @GetMapping("/posts/hot-comments")
    public List<CommunityPostDto> getMostCommentedPosts(@RequestParam Long aptId) {
        return communityService.getMostCommentedPosts(aptId);
    }

    @GetMapping("/{aptId}/keywords")
    public List<String> getTrendingKeywords(@PathVariable Long aptId) {
        return communityService.getTrendingKeywords(aptId);
    }
}
