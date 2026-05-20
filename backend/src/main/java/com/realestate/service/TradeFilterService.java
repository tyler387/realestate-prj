package com.realestate.service;

import com.realestate.domain.entity.SavedTradeFilter;
import com.realestate.domain.entity.User;
import com.realestate.domain.repository.SavedTradeFilterRepository;
import com.realestate.web.dto.SavedTradeFilterDto;
import com.realestate.web.dto.SavedTradeFilterUpsertRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TradeFilterService {

    private static final int MAX_SAVED_FILTERS = 10;

    private final SavedTradeFilterRepository savedTradeFilterRepository;

    @Transactional(readOnly = true)
    public List<SavedTradeFilterDto> list(User user) {
        return savedTradeFilterRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public SavedTradeFilterDto create(User user, SavedTradeFilterUpsertRequest request) {
        validate(request);
        long count = savedTradeFilterRepository.countByUserId(user.getId());
        if (count >= MAX_SAVED_FILTERS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "저장 필터는 최대 10개까지 가능합니다.");
        }

        SavedTradeFilter saved = savedTradeFilterRepository.save(
                SavedTradeFilter.create(user, request.name().trim(), request.payload())
        );
        return toDto(saved);
    }

    @Transactional
    public SavedTradeFilterDto update(User user, Long id, SavedTradeFilterUpsertRequest request) {
        validate(request);
        SavedTradeFilter saved = savedTradeFilterRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "저장 필터를 찾을 수 없습니다."));

        saved.update(request.name().trim(), request.payload());
        return toDto(saved);
    }

    @Transactional
    public void delete(User user, Long id) {
        SavedTradeFilter saved = savedTradeFilterRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "저장 필터를 찾을 수 없습니다."));
        savedTradeFilterRepository.delete(saved);
    }

    private void validate(SavedTradeFilterUpsertRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필터 이름을 입력해주세요.");
        }
        if (request.payload() == null || request.payload().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필터 데이터가 비어 있습니다.");
        }
    }

    private SavedTradeFilterDto toDto(SavedTradeFilter entity) {
        return new SavedTradeFilterDto(
                entity.getId(),
                entity.getFilterName(),
                entity.getPayload(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
