package com.realestate.web.controller;

import com.realestate.service.CommunityStatsHealthService;
import com.realestate.web.dto.CommunityStatsHealthDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/community")
@RequiredArgsConstructor
public class AdminCommunityStatsController {

    private final CommunityStatsHealthService communityStatsHealthService;

    @GetMapping("/stats-health")
    public CommunityStatsHealthDto getStatsHealth(
            @RequestParam(required = false, defaultValue = "GLOBAL") String scope,
            @RequestParam(required = false) Long aptId,
            @RequestParam(required = false) String boardCode
    ) {
        return communityStatsHealthService.inspect(scope, aptId, boardCode);
    }
}
