package com.realestate.domain.repository;

import com.realestate.domain.entity.CollectionJob;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionJobRepository extends JpaRepository<CollectionJob, String> {
    List<CollectionJob> findTop20ByOrderByStartedAtDesc();
    List<CollectionJob> findByStatus(String status);
}
