package com.realestate.web.dto;

public record PasswordResetConfirmDto(String email, String token, String newPassword) {}
