package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "real_trade")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RealTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", length = 10)
    private TradeType tradeType;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "trade_year")
    private Integer tradeYear;

    @Column(name = "trade_month")
    private Integer tradeMonth;

    @Column(name = "exclusive_area", precision = 8, scale = 4)
    private BigDecimal exclusiveArea;

    @Column(name = "trade_amount")
    private Long tradeAmount;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "price_per_pyeong")
    private Long pricePerPyeong;

    @Column(name = "is_cancelled")
    private Boolean isCancelled;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private RealTrade(
            Apartment apartment,
            TradeType tradeType,
            LocalDate tradeDate,
            Integer tradeYear,
            Integer tradeMonth,
            BigDecimal exclusiveArea,
            Long tradeAmount,
            Integer floor,
            Boolean isCancelled
    ) {
        this.apartment = apartment;
        this.tradeType = tradeType;
        this.tradeDate = tradeDate;
        this.tradeYear = tradeYear;
        this.tradeMonth = tradeMonth;
        this.exclusiveArea = exclusiveArea;
        this.tradeAmount = tradeAmount;
        this.floor = floor;
        this.isCancelled = isCancelled;
    }

    public static RealTrade create(
            Apartment apartment,
            TradeType tradeType,
            LocalDate tradeDate,
            Integer tradeYear,
            Integer tradeMonth,
            BigDecimal exclusiveArea,
            Long tradeAmount,
            Integer floor,
            Boolean isCancelled
    ) {
        return new RealTrade(
                apartment,
                tradeType,
                tradeDate,
                tradeYear,
                tradeMonth,
                exclusiveArea,
                tradeAmount,
                floor,
                isCancelled
        );
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isCancelled == null) {
            this.isCancelled = false;
        }
        if (this.tradeAmount == null || this.exclusiveArea == null || this.exclusiveArea.compareTo(BigDecimal.ZERO) <= 0) {
            this.pricePerPyeong = null;
            return;
        }
        double pyeong = this.exclusiveArea.doubleValue() * 0.3025d;
        if (pyeong <= 0d) {
            this.pricePerPyeong = null;
            return;
        }
        this.pricePerPyeong = Math.round(this.tradeAmount / pyeong);
    }
}
