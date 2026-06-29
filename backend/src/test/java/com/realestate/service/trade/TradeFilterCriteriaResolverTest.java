package com.realestate.service.trade;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class TradeFilterCriteriaResolverTest {

    private final TradeFilterCriteriaResolver resolver = new TradeFilterCriteriaResolver();

    @Test
    void resolveForDetail_allowsNullTradeTypeAndAllPeriod() {
        TradeFilterCriteria criteria = resolver.resolveForDetail(
                "all",
                null,
                null,
                null,
                null,
                null,
                null,
                "  Test Complex  ",
                null,
                null,
                false
        );

        assertThat(criteria.tradeType()).isNull();
        assertThat(criteria.startDate()).isEqualTo(LocalDate.of(1900, 1, 1));
        assertThat(criteria.complexKeyword()).isEqualTo("Test Complex");
    }

    @Test
    void resolveForRanking_defaultsTradeTypeToSaleAndDoesNotUseAllPeriod() {
        TradeFilterCriteria criteria = resolver.resolveForRanking(
                "all",
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

        assertThat(criteria.tradeType()).isEqualTo("SALE");
        assertThat(criteria.startDate()).isAfter(LocalDate.of(1900, 1, 1));
    }

    @ParameterizedTest
    @CsvSource({
            "JEONSE, LEASE",
            "LEASE, LEASE",
            "MONTHLY, MONTHLY"
    })
    void resolveForDetail_resolvesRentDealTypesToStoredTradeTypes(String dealType, String expectedTradeType) {
        TradeFilterCriteria criteria = resolver.resolveForDetail(
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

        assertThat(criteria.tradeType()).isEqualTo(expectedTradeType);
    }

    @Test
    void resolveForRanking_resolvesAllFilterBoundsAndFlags() {
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 2, 1);

        TradeFilterCriteria criteria = resolver.resolveForRanking(
                "custom",
                "10_20",
                "SALE",
                "30",
                "HOT",
                "MID",
                "MID_11_20",
                "Raemian",
                startDate,
                endDate,
                true
        );

        assertThat(criteria.startDate()).isEqualTo(startDate);
        assertThat(criteria.endDate()).isEqualTo(endDate);
        assertThat(criteria.minPrice()).isEqualTo(100_000L);
        assertThat(criteria.maxPrice()).isEqualTo(200_000L);
        assertThat(criteria.minArea()).isEqualTo(99.0);
        assertThat(criteria.maxArea()).isEqualTo(132.0);
        assertThat(criteria.minFloor()).isEqualTo(6);
        assertThat(criteria.maxFloor()).isEqualTo(15);
        assertThat(criteria.minAge()).isEqualTo(11);
        assertThat(criteria.maxAge()).isEqualTo(20);
        assertThat(criteria.onlyHot()).isTrue();
        assertThat(criteria.excludeOutliers()).isTrue();
    }
}
