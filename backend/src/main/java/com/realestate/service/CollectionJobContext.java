package com.realestate.service;

import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class CollectionJobContext {

    private final ThreadLocal<String> currentJobId = new ThreadLocal<>();

    public void setCurrentJobId(String jobId) {
        currentJobId.set(jobId);
    }

    public Optional<String> getCurrentJobId() {
        return Optional.ofNullable(currentJobId.get());
    }

    public void clear() {
        currentJobId.remove();
    }
}
