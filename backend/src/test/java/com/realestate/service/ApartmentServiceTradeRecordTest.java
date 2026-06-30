package com.realestate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.realestate.domain.entity.Apartment;
import com.realestate.domain.repository.ApartmentMarkerProjection;
import com.realestate.domain.repository.ApartmentRepository;
import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TradeRecordProjection;
import com.realestate.service.trade.TradeFilterCriteriaResolver;
import com.realestate.web.dto.ApartmentMarkerDto;
import com.realestate.web.dto.TradeRecordResponseDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApartmentServiceTradeRecordTest {

    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private RealTradeRepository realTradeRepository;
    @Spy
    private TradeFilterCriteriaResolver tradeFilterCriteriaResolver = new TradeFilterCriteriaResolver();
    @InjectMocks
    private ApartmentService apartmentService;

    @Test
    void getApartmentMarkers_resolvesJeonseFilterToStoredLeaseType() {
        when(apartmentRepository.findMarkersByViewport(
                eq(126.9),
                eq(37.4),
                eq(127.1),
                eq(37.6),
                eq("LEASE")
        )).thenReturn(List.of(markerProjection("LEASE")));

        List<ApartmentMarkerDto> result = apartmentService.getApartmentMarkers(
                126.9,
                37.4,
                127.1,
                37.6,
                "JEONSE"
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).latestTradeType()).isEqualTo("LEASE");
    }

    @Test
    void getApartmentMarkers_usesAllSaleAndLeaseTradesWhenDealTypeIsEmpty() {
        when(apartmentRepository.findMarkersByViewport(
                eq(126.9),
                eq(37.4),
                eq(127.1),
                eq(37.6),
                isNull()
        )).thenReturn(List.of(markerProjection("SALE")));

        apartmentService.getApartmentMarkers(
                126.9,
                37.4,
                127.1,
                37.6,
                ""
        );

        verify(apartmentRepository).findMarkersByViewport(126.9, 37.4, 127.1, 37.6, null);
    }

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
        )).thenReturn(projections(501, "SALE"));

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
        assertThat(result.records().get(0).tradeType()).isEqualTo("\uB9E4\uB9E4");
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
        )).thenReturn(projections(2, "SALE"));

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
    @CsvSource({
            "JEONSE, LEASE",
            "LEASE, LEASE",
            "MONTHLY, MONTHLY"
    })
    void getTradeRecords_resolvesRentDealTypesToStoredTradeTypes(String dealType, String expectedTradeType) {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment()));
        when(realTradeRepository.findRecentByApartmentIdWithFilters(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class),
                eq(expectedTradeType),
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
        )).thenReturn(projections(1, expectedTradeType));

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
                "Test Apartment",
                "Test Road",
                "Seoul",
                "Gangnam-gu",
                "Yeoksam-dong",
                "1168010100",
                null,
                2020,
                1000,
                null
        );
    }

    private List<TradeRecordProjection> projections(int count, String tradeType) {
        return IntStream.rangeClosed(1, count)
                .mapToObj(index -> new TestTradeRecordProjection((long) index, tradeType))
                .map(TradeRecordProjection.class::cast)
                .toList();
    }

    private ApartmentMarkerProjection markerProjection(String tradeType) {
        return new TestApartmentMarkerProjection(tradeType);
    }

    private record TestApartmentMarkerProjection(String tradeType) implements ApartmentMarkerProjection {
        @Override
        public Long getId() {
            return 1L;
        }

        @Override
        public String getComplexName() {
            return "Test Apartment";
        }

        @Override
        public String getSigungu() {
            return "Gangnam-gu";
        }

        @Override
        public String getEupMyeonDong() {
            return "Yeoksam-dong";
        }

        @Override
        public Double getLatitude() {
            return 37.5;
        }

        @Override
        public Double getLongitude() {
            return 127.0;
        }

        @Override
        public Long getLatestSalePrice() {
            return 150_000L;
        }

        @Override
        public BigDecimal getLatestSaleArea() {
            return new BigDecimal("84.99");
        }

        @Override
        public LocalDate getLatestTradeDate() {
            return LocalDate.of(2026, 6, 1);
        }

        @Override
        public String getLatestTradeType() {
            return tradeType;
        }
    }

    private record TestTradeRecordProjection(Long id, String tradeType) implements TradeRecordProjection {
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
            return tradeType;
        }

        @Override
        public Long getTradeAmount() {
            return 150_000L;
        }

        @Override
        public Long getDepositAmount() {
            return "SALE".equals(tradeType) ? null : 80_000L;
        }

        @Override
        public Long getMonthlyRentAmount() {
            return "MONTHLY".equals(tradeType) ? 120L : null;
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
