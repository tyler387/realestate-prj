package com.realestate.web.dto;

public record VerifyRequest(
        Long apartmentId,
        String apartmentName
) {}
