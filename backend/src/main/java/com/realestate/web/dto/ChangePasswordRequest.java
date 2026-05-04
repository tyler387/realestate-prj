package com.realestate.web.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {}
