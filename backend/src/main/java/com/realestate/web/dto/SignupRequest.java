package com.realestate.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(min = 2, max = 10) String nickname,
        boolean serviceAgreed,
        boolean privacyAgreed,
        boolean marketingAgreed
) {}
