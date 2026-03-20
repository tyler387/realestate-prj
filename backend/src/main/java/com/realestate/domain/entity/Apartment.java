package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Getter
@Entity
@Table(name = "apartment")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complex_name", nullable = false, length = 100)
    private String complexName;

    @Column(name = "road_address", length = 200)
    private String roadAddress;

    @Column(name = "sido", length = 20)
    private String sido;

    @Column(name = "sigungu", length = 30)
    private String sigungu;

    @Column(name = "eup_myeon_dong", length = 30)
    private String eupMyeonDong;

    @Column(name = "legal_dong_code", length = 10)
    private String legalDongCode;

    @Column(name = "location", columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(name = "completion_year")
    private Integer completionYear;

    @Column(name = "total_household_count")
    private Integer totalHouseholdCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private Apartment(
            String complexName,
            String roadAddress,
            String sido,
            String sigungu,
            String eupMyeonDong,
            String legalDongCode,
            Point location,
            Integer completionYear,
            Integer totalHouseholdCount
    ) {
        this.complexName = complexName;
        this.roadAddress = roadAddress;
        this.sido = sido;
        this.sigungu = sigungu;
        this.eupMyeonDong = eupMyeonDong;
        this.legalDongCode = legalDongCode;
        this.location = location;
        this.completionYear = completionYear;
        this.totalHouseholdCount = totalHouseholdCount;
    }

    public static Apartment create(
            String complexName,
            String roadAddress,
            String sido,
            String sigungu,
            String eupMyeonDong,
            String legalDongCode,
            Point location,
            Integer completionYear,
            Integer totalHouseholdCount
    ) {
        return new Apartment(
                complexName,
                roadAddress,
                sido,
                sigungu,
                eupMyeonDong,
                legalDongCode,
                location,
                completionYear,
                totalHouseholdCount
        );
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
