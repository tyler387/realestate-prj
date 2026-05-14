package com.realestate.config;

import com.realestate.auth.AuthRateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class AuthRateLimitServletFilter extends OncePerRequestFilter {

    private static final String JSON_RATE_LIMITED =
            "{\"code\":\"RATE_LIMITED\",\"message\":\"잠시 후 다시 시도해주세요.\"}";

    private static final Map<String, Rule> RULES = new HashMap<>();

    static {
        RULES.put("POST:/api/auth/password-reset/request", new Rule(5, 60));
        RULES.put("POST:/api/auth/password-reset/verify", new Rule(20, 60));
        RULES.put("POST:/api/auth/password-reset/confirm", new Rule(10, 60));
        RULES.put("POST:/api/auth/login", new Rule(30, 60));
        RULES.put("POST:/api/auth/oauth/kakao", new Rule(20, 60));
    }

    private final AuthRateLimitService rateLimitService;
    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String endpointKey = request.getMethod() + ":" + request.getRequestURI();
        return !RULES.containsKey(endpointKey);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String endpointKey = request.getMethod() + ":" + request.getRequestURI();
        Rule rule = RULES.get(endpointKey);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = endpointKey + "|" + resolveClientIp(request);
        AuthRateLimitService.Decision decision = rateLimitService.check(key, rule.limit, rule.windowSeconds);
        if (!decision.permitted()) {
            applyCorsHeaders(request, response);
            response.setStatus(429);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(decision.retryAfterSeconds()));
            response.getWriter().write(JSON_RATE_LIMITED);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] parts = forwardedFor.split(",");
            if (parts.length > 0 && !parts[0].isBlank()) {
                return parts[0].trim();
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }

    private void applyCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) return;

        Set<String> allowedSet = new HashSet<>();
        Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .forEach(allowedSet::add);
        if (!allowedSet.contains(origin)) return;

        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Origin", origin);
    }

    private record Rule(int limit, int windowSeconds) {}
}
