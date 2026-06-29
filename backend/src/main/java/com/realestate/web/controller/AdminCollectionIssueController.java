package com.realestate.web.controller;

import com.realestate.service.CollectionIssueService;
import com.realestate.web.dto.CollectionIssueDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/collection-issues")
@RequiredArgsConstructor
public class AdminCollectionIssueController {

    private final CollectionIssueService collectionIssueService;

    @GetMapping
    public List<CollectionIssueDto> issues(
            @RequestParam(required = false) String jobId,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String issueType,
            @RequestParam(required = false) Integer limit
    ) {
        return collectionIssueService.getRecentIssues(jobId, sourceType, issueType, limit);
    }
}
