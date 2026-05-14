package com.realestate.auth;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimitService {

    private static final int MAX_TRACKED_KEYS = 50_000;
    private static final long CLEANUP_INTERVAL_MS = 60_000L;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private volatile long lastCleanupAt = 0L;

    public Decision check(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        maybeCleanup(now, windowSeconds * 1000L);

        WindowCounter counter = counters.computeIfAbsent(key, k -> new WindowCounter(now));
        synchronized (counter) {
            long windowMs = windowSeconds * 1000L;
            long elapsed = now - counter.windowStartMs;
            if (elapsed >= windowMs) {
                counter.windowStartMs = now;
                counter.count = 0;
                elapsed = 0;
            }

            counter.lastSeenMs = now;

            if (counter.count < limit) {
                counter.count++;
                return Decision.allow();
            }

            long remainingMs = Math.max(0L, windowMs - elapsed);
            long retryAfterSeconds = (remainingMs + 999L) / 1000L;
            return Decision.deny(retryAfterSeconds);
        }
    }

    private void maybeCleanup(long now, long windowMs) {
        if (counters.size() < MAX_TRACKED_KEYS) return;
        if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;

        lastCleanupAt = now;
        long staleThreshold = windowMs * 2L;
        counters.entrySet().removeIf(entry -> now - entry.getValue().lastSeenMs > staleThreshold);
    }

    public record Decision(boolean permitted, long retryAfterSeconds) {
        public static Decision allow() {
            return new Decision(true, 0L);
        }

        public static Decision deny(long retryAfterSeconds) {
            return new Decision(false, retryAfterSeconds);
        }
    }

    private static final class WindowCounter {
        long windowStartMs;
        long lastSeenMs;
        int count;

        WindowCounter(long now) {
            this.windowStartMs = now;
            this.lastSeenMs = now;
            this.count = 0;
        }
    }
}
