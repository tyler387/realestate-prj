package com.realestate.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminApiKeyInterceptor implements HandlerInterceptor {

    @Value("${admin.api-key:}")
    private String expectedApiKey;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (expectedApiKey == null || expectedApiKey.isBlank()) {
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Admin API key not configured on server");
            return false;
        }
        String provided = request.getHeader("X-Admin-Api-Key");
        if (!expectedApiKey.equals(provided)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or missing X-Admin-Api-Key header");
            return false;
        }
        return true;
    }
}
