package com.realestate.domain.repository;

import com.realestate.domain.entity.PostViewLog;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewLogRepository extends JpaRepository<PostViewLog, Long> {

    boolean existsByPostIdAndAptIdAndCreatedAtAfter(Long postId, Long aptId, LocalDateTime after);
}
