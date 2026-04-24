package com.realestate.domain.repository;

import com.realestate.domain.entity.PostViewLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewLogRepository extends JpaRepository<PostViewLog, Long> {
}
