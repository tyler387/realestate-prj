package com.realestate.web.controller;

import com.realestate.service.CommunityService;
import com.realestate.web.dto.CommentDto;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommentRequest;
import com.realestate.web.dto.CreateCommunityPostRequest;
import com.realestate.web.dto.LikeToggleResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long aptId,
            @RequestParam(required = false) String boardCode,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "최신순") String sortType
    ) {
        return communityService.getPosts(scope, aptId, boardCode, category, sortType);
    }

    @GetMapping("/posts/{id}")
    public CommunityPostDto getPost(
            @PathVariable Long id,
            @RequestParam(required = false) String nickname
    ) {
        return communityService.getPost(id, nickname);
    }

    @PostMapping("/posts")
    public CommunityPostDto createPost(@RequestBody CreateCommunityPostRequest request, Authentication authentication) {
        return communityService.createPost(request, authentication);
    }

    @GetMapping("/posts/popular")
    public List<CommunityPostDto> getPopularPosts(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long aptId,
            @RequestParam(required = false) String boardCode
    ) {
        return communityService.getPopularPosts(scope, aptId, boardCode);
    }

    @GetMapping("/posts/hot-comments")
    public List<CommunityPostDto> getMostCommentedPosts(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long aptId,
            @RequestParam(required = false) String boardCode
    ) {
        return communityService.getMostCommentedPosts(scope, aptId, boardCode);
    }

    @GetMapping("/keywords")
    public List<String> getTrendingKeywords(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long aptId,
            @RequestParam(required = false) String boardCode
    ) {
        return communityService.getTrendingKeywords(scope, aptId, boardCode);
    }

    @GetMapping("/{aptId}/keywords")
    public List<String> getTrendingKeywords(@PathVariable Long aptId) {
        return communityService.getTrendingKeywords("APARTMENT", aptId, null);
    }

    @GetMapping("/posts/{postId}/comments")
    public List<CommentDto> getComments(@PathVariable Long postId) {
        return communityService.getComments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public CommentDto createComment(
            @PathVariable Long postId,
            @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        return communityService.createComment(postId, request, authentication);
    }

    @DeleteMapping("/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable Long postId, @RequestParam String authorNickname) {
        communityService.deletePost(postId, authorNickname);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long commentId, @RequestParam String authorNickname) {
        communityService.deleteComment(commentId, authorNickname);
    }

    @PostMapping("/posts/{postId}/like")
    public LikeToggleResponse toggleLike(@PathVariable Long postId, Authentication authentication) {
        return communityService.toggleLike(postId, authentication);
    }

    @GetMapping("/my/posts")
    public List<CommunityPostDto> getMyPosts(@RequestParam String nickname) {
        return communityService.getMyPosts(nickname);
    }

    @GetMapping("/my/comments")
    public List<CommentDto> getMyComments(@RequestParam String nickname) {
        return communityService.getMyComments(nickname);
    }
}
