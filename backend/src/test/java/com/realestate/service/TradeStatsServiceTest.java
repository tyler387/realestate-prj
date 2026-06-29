package com.realestate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.realestate.domain.repository.RealTradeRepository;
import com.realestate.domain.repository.TopApartmentProjection;
import com.realestate.service.trade.TradeFilterCriteriaResolver;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TradeStatsServiceTest {

    @Mock
    private RealTradeRepository realTradeRepository;
    @Spy
    private TradeFilterCriteriaResolver tradeFilterCriteriaResolver = new TradeFilterCriteriaResolver();
    @InjectMocks
    private TradeStatsService tradeStatsService;

    @ParameterizedTest
    @CsvSource({
            "JEONSE, LEASE",
            "LEASE, LEASE",
            "MONTHLY, MONTHLY"
    })
    void getTopApartments_resolvesRentDealTypesToStoredTradeTypes(String dealType, String expectedTradeType) {
        when(realTradeRepository.findTopApartmentsByTransactionCountWithFilters(
                any(LocalDate.class),
                any(LocalDate.class),
                eq(expectedTradeType),
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
