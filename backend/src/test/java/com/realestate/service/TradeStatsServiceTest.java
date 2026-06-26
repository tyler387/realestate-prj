package com.realestate.service;

import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TopApartmentProjection;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TradeStatsServiceTest {

    @Mock
    private RealTradeRepository realTradeRepository;
    @InjectMocks
    private TradeStatsService tradeStatsService;

    @ParameterizedTest
    @ValueSource(strings = {"JEONSE", "LEASE", "MONTHLY"})
    void getTopApartments_normalizesUnsupportedRentDealTypesToSale(String dealType) {
        when(realTradeRepository.findTopApartmentsByTransactionCountWithFilters(
                any(LocalDate.class),
                any(LocalDate.class),
                eq("SALE"),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(false),
                eq(false),
                eq(false),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(false)
        )).thenReturn(List.of(new TestTopApartmentProjection()));

        var result = tradeStatsService.getTopApartments(
                "1m",
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

        assertThat(result).hasSize(1);
        assertThat(result.get(0).rank()).isEqualTo(1);
    }

    private static final class TestTopApartmentProjection implements TopApartmentProjection {
        @Override
        public Long getRank() {
            return 1L;
        }

        @Override
        public Long getAptId() {
            return 1L;
        }

        @Override
        public String getAptName() {
            return "Test Apartment";
        }

        @Override
        public String getSigungu() {
            return "Test District";
        }

        @Override
        public Long getTransactionCount() {
            return 3L;
        }

        @Override
        public Long getRecentMonthAvgPrice() {
            return 100_000L;
        }
    }
}
