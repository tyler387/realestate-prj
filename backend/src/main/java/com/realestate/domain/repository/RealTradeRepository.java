package com.realestate.domain.repository;

import com.realestate.domain.entity.RealTrade;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RealTradeRepository extends JpaRepository<RealTrade, Long> {

    @Query(value = """
            SELECT
                r.id AS id,
                r.floor AS floor,
                r.exclusive_area AS area,
                r.trade_type AS tradeType,
                r.trade_amount AS tradeAmount,
                TO_CHAR(r.trade_date, 'YYYY.MM.DD') AS contractDate,
                r.price_per_pyeong AS pricePerPyeong
            FROM real_trade r
            WHERE r.apartment_id = :aptId
              AND r.is_cancelled = false
            ORDER BY r.trade_date DESC, r.id DESC
            LIMIT 50
            """, nativeQuery = true)
    List<TradeRecordProjection> findRecentByApartmentId(@Param("aptId") Long aptId);

    @Query(value = """
            SELECT
                TO_CHAR(DATE_TRUNC('month', r.trade_date), 'YY.MM') AS month,
                ROUND(AVG(r.trade_amount)) AS avgPrice,
                r.trade_type AS tradeType
            FROM real_trade r
            WHERE r.apartment_id = :aptId
              AND r.is_cancelled = false
              AND r.trade_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', r.trade_date), r.trade_type
            ORDER BY DATE_TRUNC('month', r.trade_date) ASC
            """, nativeQuery = true)
    List<PriceHistoryProjection> findPriceHistoryByApartmentId(@Param("aptId") Long aptId);

    @Query(value = """
            SELECT
                ROUND(AVG(r.trade_amount)) AS avgPrice,
                COUNT(*) AS transactionCount
            FROM real_trade r
            WHERE r.is_cancelled = false
              AND r.trade_type = 'SALE'
              AND r.trade_date >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
            """, nativeQuery = true)
    TradeSummaryProjection findTradeSummary(@Param("days") int days);

    @Query(value = """
            SELECT
                ROUND(AVG(r.trade_amount)) AS avgPrice,
                COUNT(*) AS transactionCount
            FROM real_trade r
            WHERE r.is_cancelled = false
              AND r.trade_type = 'SALE'
              AND r.trade_date >= CURRENT_DATE - CAST(:prevDays AS INTEGER) * INTERVAL '1 day'
              AND r.trade_date < CURRENT_DATE - CAST(:currentDays AS INTEGER) * INTERVAL '1 day'
            """, nativeQuery = true)
    TradeSummaryProjection findPrevTradeSummary(@Param("prevDays") int prevDays, @Param("currentDays") int currentDays);

    @Query(value = """
            SELECT
                a.id AS aptId,
                a.complex_name AS aptName,
                r.trade_amount AS price,
                TO_CHAR(r.trade_date, 'YYYY-MM-DD') AS dealDate,
                r.exclusive_area AS area
            FROM real_trade r
            JOIN apartment a ON r.apartment_id = a.id
            WHERE r.is_cancelled = false
              AND r.trade_type = 'SALE'
              AND r.trade_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY r.trade_amount DESC NULLS LAST
            LIMIT 5
            """, nativeQuery = true)
    List<HighestDealProjection> findHighestPriceDeals();

    @Query(value = """
            SELECT
                ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank,
                a.id AS aptId,
                a.complex_name AS aptName,
                a.sigungu AS sigungu,
                COUNT(*) AS transactionCount,
                (
                    SELECT r2.trade_amount
                    FROM real_trade r2
                    WHERE r2.apartment_id = a.id
                      AND r2.trade_type = 'SALE'
                      AND r2.is_cancelled = false
                    ORDER BY r2.trade_date DESC
                    LIMIT 1
                ) AS latestSalePrice
            FROM real_trade r
            JOIN apartment a ON r.apartment_id = a.id
            WHERE r.is_cancelled = false
              AND r.trade_type = 'SALE'
              AND r.trade_date >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
            GROUP BY a.id, a.complex_name, a.sigungu
            ORDER BY COUNT(*) DESC
            LIMIT 20
            """, nativeQuery = true)
    List<TopApartmentProjection> findTopApartmentsByTransactionCount(@Param("days") int days);

    @Query(value = """
            SELECT
                ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank,
                a.id AS aptId,
                a.complex_name AS aptName,
                a.sigungu AS sigungu,
                COUNT(*) AS transactionCount,
                (
                    SELECT r2.trade_amount
                    FROM real_trade r2
                    WHERE r2.apartment_id = a.id
                      AND r2.trade_type = :tradeType
                      AND r2.is_cancelled = false
                    ORDER BY r2.trade_date DESC
                    LIMIT 1
                ) AS latestSalePrice
            FROM real_trade r
            JOIN apartment a ON r.apartment_id = a.id
            WHERE r.is_cancelled = false
              AND r.trade_type = :tradeType
              AND r.trade_date BETWEEN :startDate AND :endDate
              AND (:minPrice IS NULL OR r.trade_amount >= :minPrice)
              AND (:maxPrice IS NULL OR r.trade_amount <= :maxPrice)
              AND (:minArea IS NULL OR r.exclusive_area >= :minArea)
              AND (:maxArea IS NULL OR r.exclusive_area < :maxArea)
              AND (:onlyNew = false OR (a.completion_year IS NOT NULL AND EXTRACT(YEAR FROM CURRENT_DATE) - a.completion_year <= 10))
              AND (:onlyLarge = false OR (a.total_household_count IS NOT NULL AND a.total_household_count >= 1000))
              AND (:minFloor IS NULL OR r.floor >= :minFloor)
              AND (:maxFloor IS NULL OR r.floor <= :maxFloor)
              AND (:minAge IS NULL OR (a.completion_year IS NOT NULL AND EXTRACT(YEAR FROM CURRENT_DATE) - a.completion_year >= :minAge))
              AND (:maxAge IS NULL OR (a.completion_year IS NOT NULL AND EXTRACT(YEAR FROM CURRENT_DATE) - a.completion_year <= :maxAge))
              AND (:complexKeyword IS NULL OR TRIM(:complexKeyword) = '' OR a.complex_name ILIKE CONCAT('%', :complexKeyword, '%'))
              AND (:excludeOutliers = false OR (r.price_per_pyeong IS NOT NULL AND r.price_per_pyeong > 0))
            GROUP BY a.id, a.complex_name, a.sigungu
            HAVING (:onlyHot = false OR COUNT(*) >= 3)
            ORDER BY COUNT(*) DESC
            LIMIT 20
            """, nativeQuery = true)
    List<TopApartmentProjection> findTopApartmentsByTransactionCountWithFilters(
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("tradeType") String tradeType,
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            @Param("minArea") Double minArea,
            @Param("maxArea") Double maxArea,
            @Param("onlyNew") boolean onlyNew,
            @Param("onlyLarge") boolean onlyLarge,
            @Param("onlyHot") boolean onlyHot,
            @Param("minFloor") Integer minFloor,
            @Param("maxFloor") Integer maxFloor,
            @Param("minAge") Integer minAge,
            @Param("maxAge") Integer maxAge,
            @Param("complexKeyword") String complexKeyword,
            @Param("excludeOutliers") boolean excludeOutliers
    );

    @Query(value = """
            SELECT
                ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.trade_amount)) AS medianPrice,
                ROUND(AVG(r.trade_amount)) AS avgPrice,
                COUNT(*) AS transactionCount
            FROM real_trade r
            WHERE r.is_cancelled = false
              AND r.trade_type = 'SALE'
              AND r.trade_date BETWEEN :startDate AND :endDate
            """, nativeQuery = true)
    TradeTrendCompareProjection findTradeTrendCompareSummary(
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate
    );
}

