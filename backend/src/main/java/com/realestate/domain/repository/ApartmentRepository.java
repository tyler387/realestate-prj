package com.realestate.domain.repository;

import com.realestate.domain.entity.Apartment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    Optional<Apartment> findFirstByComplexNameAndSigungu(String complexName, String sigungu);

    Optional<Apartment> findFirstByComplexNameAndEupMyeonDong(String complexName, String eupMyeonDong);

    @Modifying
    @Query("UPDATE Apartment a SET a.kaptCode = :kaptCode WHERE a.complexName = :name AND a.sigungu = :sigungu AND a.kaptCode IS NULL")
    int updateKaptCodeIfNull(@Param("name") String name, @Param("sigungu") String sigungu, @Param("kaptCode") String kaptCode);

    @Modifying
    @Query("UPDATE Apartment a SET a.totalHouseholdCount = :count WHERE a.complexName = :name AND a.sigungu = :sigungu AND a.totalHouseholdCount IS NULL")
    int updateHouseholdCountIfNull(@Param("name") String name, @Param("sigungu") String sigungu, @Param("count") Integer count);

    @Modifying
    @Query("UPDATE Apartment a SET a.completionYear = :year WHERE a.complexName = :name AND a.sigungu = :sigungu AND a.completionYear IS NULL")
    int updateCompletionYearIfNull(@Param("name") String name, @Param("sigungu") String sigungu, @Param("year") Integer year);

    @Query(value = "SELECT id, kapt_code FROM apartment WHERE kapt_code IS NOT NULL AND (total_household_count IS NULL OR completion_year IS NULL)", nativeQuery = true)
    List<ApartmentKaptCodeProjection> findAllWithKaptCodeAndNullHousehold();

    @Modifying
    @Query("UPDATE Apartment a SET a.totalHouseholdCount = :count WHERE a.id = :id")
    int updateHouseholdCountById(@Param("id") Long id, @Param("count") Integer count);

    @Modifying
    @Query("UPDATE Apartment a SET a.completionYear = :year WHERE a.id = :id")
    int updateCompletionYearById(@Param("id") Long id, @Param("year") Integer year);

    @Query(value = """
            SELECT
                a.id AS id,
                a.complex_name AS complexName,
                a.eup_myeon_dong AS eupMyeonDong,
                ST_Y(a.location) AS latitude,
                ST_X(a.location) AS longitude,
                rt.trade_amount AS latestSalePrice,
                rt.exclusive_area AS latestSaleArea,
                rt.trade_date AS latestTradeDate
            FROM apartment a
            LEFT JOIN LATERAL (
                SELECT
                    r.trade_amount,
                    r.exclusive_area,
                    r.trade_date
                FROM real_trade r
                WHERE r.apartment_id = a.id
                  AND r.trade_type = 'SALE'
                  AND r.is_cancelled = false
                ORDER BY r.trade_date DESC, r.id DESC
                LIMIT 1
            ) rt ON true
            WHERE ST_Within(
                a.location,
                ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)
            )
            LIMIT 200
            """, nativeQuery = true)
    List<ApartmentMarkerProjection> findMarkersByViewport(
            @Param("swLng") double swLng,
            @Param("swLat") double swLat,
            @Param("neLng") double neLng,
            @Param("neLat") double neLat
    );

    @Query(value = """
            SELECT
                a.id AS id,
                a.complex_name AS complexName,
                a.road_address AS roadAddress,
                a.sigungu AS sigungu,
                a.eup_myeon_dong AS eupMyeonDong,
                ST_Y(a.location) AS latitude,
                ST_X(a.location) AS longitude
            FROM apartment a
            WHERE a.complex_name ILIKE '%' || :keyword || '%'
               OR a.road_address ILIKE '%' || :keyword || '%'
            ORDER BY a.complex_name
            LIMIT 20
            """, nativeQuery = true)
    List<ApartmentSearchProjection> searchByKeyword(@Param("keyword") String keyword);

    @Query(value = """
            SELECT
                a.id AS id,
                a.complex_name AS complexName,
                CONCAT(a.sido, ' ', a.sigungu, ' ', a.eup_myeon_dong) AS location,
                a.total_household_count AS totalHouseholdCount,
                a.completion_year AS completionYear,
                rt.trade_amount AS recentSalePrice,
                rt.exclusive_area AS recentSaleArea
            FROM apartment a
            LEFT JOIN LATERAL (
                SELECT r.trade_amount, r.exclusive_area
                FROM real_trade r
                WHERE r.apartment_id = a.id
                  AND r.trade_type = 'SALE'
                  AND r.is_cancelled = false
                ORDER BY r.trade_date DESC, r.id DESC
                LIMIT 1
            ) rt ON true
            WHERE a.id = :id
            """, nativeQuery = true)
    Optional<ApartmentSummaryProjection> findSummaryById(@Param("id") Long id);
}
