package com.realestate.domain.repository;

import com.realestate.domain.entity.CollectionIssue;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CollectionIssueRepository extends JpaRepository<CollectionIssue, Long> {

    @Query("""
            SELECT issue
            FROM CollectionIssue issue
            WHERE (:jobId IS NULL OR issue.jobId = :jobId)
              AND (:sourceType IS NULL OR issue.sourceType = :sourceType)
              AND (:issueType IS NULL OR issue.issueType = :issueType)
            ORDER BY issue.createdAt DESC
            """)
    List<CollectionIssue> findRecent(
            @Param("jobId") String jobId,
            @Param("sourceType") String sourceType,
            @Param("issueType") String issueType,
            Pageable pageable
    );

    @Query("""
            SELECT CASE WHEN COUNT(issue) > 0 THEN true ELSE false END
            FROM CollectionIssue issue
            WHERE issue.sourceType = :sourceType
              AND issue.issueType = :issueType
              AND COALESCE(issue.sigungu, '') = COALESCE(:sigungu, '')
              AND COALESCE(issue.eupMyeonDong, '') = COALESCE(:eupMyeonDong, '')
              AND COALESCE(issue.aptName, '') = COALESCE(:aptName, '')
              AND COALESCE(issue.dealYmd, '') = COALESCE(:dealYmd, '')
            """)
    boolean existsDuplicate(
            @Param("sourceType") String sourceType,
            @Param("issueType") String issueType,
            @Param("sigungu") String sigungu,
            @Param("eupMyeonDong") String eupMyeonDong,
            @Param("aptName") String aptName,
            @Param("dealYmd") String dealYmd
    );
}
