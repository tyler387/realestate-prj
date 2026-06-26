package com.realestate.service;

import com.realestate.domain.entity.Apartment;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TradeRecordProjection;
import com.realestate.web.dto.TradeRecordResponseDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApartmentServiceTradeRecordTest {

    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private RealTradeRepository realTradeRepository;
    @InjectMocks
    private ApartmentService apartmentService;

    @Test
    void getTradeRecords_capsVisibleRecordsAndReturnsHasMoreMetadata() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment()));
        when(realTradeRepository.findRecentByApartmentIdWithFilters(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class),
                eq("SALE"),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(false),
                eq(false),
                isNull(),
                eq(false),
                eq(501)
        )).thenReturn(projections(501));

        TradeRecordResponseDto result = apartmentService.getTradeRecords(
                1L,
                null,
                "12m",
                null,
                "SALE",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );

        assertThat(result.records()).hasSize(500);
        assertThat(result.displayedCount()).isEqualTo(500);
        assertThat(result.limit()).isEqualTo(500);
        assertThat(result.hasMore()).isTrue();
        assertThat(result.records().get(0).tradeType()).isEqualTo("매매");
    }

    @Test
    void getTradeRecords_returnsExactCountWhenUnderLimit() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment()));
        when(realTradeRepository.findRecentByApartmentIdWithFilters(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                anyBoolean(),
                anyBoolean(),
                isNull(),
                anyBoolean(),
                anyInt()
        )).thenReturn(projections(2));

        TradeRecordResponseDto result = apartmentService.getTradeRecords(
                1L,
                null,
                "12m",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );

        assertThat(result.records()).hasSize(2);
        assertThat(result.displayedCount()).isEqualTo(2);
        assertThat(result.limit()).isEqualTo(500);
        assertThat(result.hasMore()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"JEONSE", "LEASE", "MONTHLY"})
    void getTradeRecords_normalizesUnsupportedRentDealTypesToSale(String dealType) {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment()));
        when(realTradeRepository.findRecentByApartmentIdWithFilters(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class),
                eq("SALE"),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(false),
                eq(false),
                isNull(),
                eq(false),
                eq(501)
        )).thenReturn(projections(1));

        TradeRecordResponseDto result = apartmentService.getTradeRecords(
                1L,
                null,
                "12m",
                null,
                dealType,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );

        assertThat(result.records()).hasSize(1);
    }

    private Apartment apartment() {
        return Apartment.create(
                "테스트아파트",
                "서울시 테스트로",
                "서울",
                "강남구",
                "역삼동",
                "1168010100",
                null,
                2020,
                1000,
                null
        );
    }

    private List<TradeRecordProjection> projections(int count) {
        return IntStream.rangeClosed(1, count)
                .mapToObj(index -> new TestTradeRecordProjection((long) index))
                .map(TradeRecordProjection.class::cast)
                .toList();
    }

    private record TestTradeRecordProjection(Long id) implements TradeRecordProjection {
        @Override
        public Long getId() {
            return id;
        }

        @Override
        public Integer getFloor() {
            return 10;
        }

        @Override
        public BigDecimal getArea() {
            return new BigDecimal("84.99");
        }

        @Override
        public String getTradeType() {
            return "SALE";
        }

        @Override
        public Long getTradeAmount() {
            return 150_000L;
        }

        @Override
        public String getContractDate() {
            return "2026.06.01";
        }

        @Override
        public Long getPricePerPyeong() {
            return 5_800L;
        }
    }
}
