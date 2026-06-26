package com.realestate.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AdminApiKeyFilter extends OncePerRequestFilter {

    private static final String ADMIN_PATH_PREFIX = "/api/v1/admin/";
    private static final String ADMIN_PATH = "/api/v1/admin";
    private static final String HEADER_NAME = "X-Admin-Api-Key";

    @Value("${admin.api-key:}")
    private String expectedApiKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !ADMIN_PATH.equals(path) && !path.startsWith(ADMIN_PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (expectedApiKey == null || expectedApiKey.isBlank()) {
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Admin API key not configured on server");
            return;
        }

        String provided = request.getHeader(HEADER_NAME);
        if (!expectedApiKey.equals(provided)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or missing X-Admin-Api-Key header");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
