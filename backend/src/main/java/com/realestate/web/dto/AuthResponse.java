package com.realestate.web.dto;

public record AuthResponse(
        String token,
        Long userId,
        String nickname,
        String status,
        Long apartmentId,
        String apartmentName,
        String oauthProvider
) {}
