package com.realestate.web.controller;

import com.realestate.domain.entity.User;
import com.realestate.service.TradeFilterService;
import com.realestate.web.dto.SavedTradeFilterDto;
import com.realestate.web.dto.SavedTradeFilterUpsertRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/trades/filters")
@RequiredArgsConstructor
public class TradeFilterController {

    private final TradeFilterService tradeFilterService;

    @GetMapping
    public List<SavedTradeFilterDto> list(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return tradeFilterService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedTradeFilterDto create(@RequestBody SavedTradeFilterUpsertRequest request, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return tradeFilterService.create(user, request);
    }

    @PutMapping("/{id}")
    public SavedTradeFilterDto update(
            @PathVariable Long id,
            @RequestBody SavedTradeFilterUpsertRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return tradeFilterService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        tradeFilterService.delete(user, id);
    }
}
