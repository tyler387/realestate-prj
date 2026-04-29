package com.realestate.web.controller;

import com.realestate.service.CommunityService;
import com.realestate.web.dto.CommentDto;
import com.realestate.web.dto.CommunityPostDto;
import com.realestate.web.dto.CreateCommentRequest;
import com.realestate.web.dto.CreateCommunityPostRequest;
import com.realestate.web.dto.LikeToggleResponse;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
            @RequestParam Long aptId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "최신순") String sortType
    ) {
        return communityService.getPosts(aptId, category, sortType);
    }

    @GetMapping("/posts/{id}")
    public CommunityPostDto getPost(
            @PathVariable Long id,
            @RequestParam(required = false) String nickname
    ) {
        return communityService.getPost(id, nickname);
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

    @GetMapping("/posts/{postId}/comments")
    public List<CommentDto> getComments(@PathVariable Long postId) {
        return communityService.getComments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public CommentDto createComment(@PathVariable Long postId, @RequestBody CreateCommentRequest request) {
        return communityService.createComment(postId, request);
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
    public LikeToggleResponse toggleLike(@PathVariable Long postId, @RequestBody Map<String, String> body) {
        return communityService.toggleLike(postId, body.get("authorNickname"));
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
