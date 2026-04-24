package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "keyword_stats")
@IdClass(KeywordStatsId.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KeywordStats {

    @Id
    @Column(name = "keyword", length = 50)
    private String keyword;

    @Id
    @Column(name = "apt_id")
    private Long aptId;

    @Id
    @Column(name = "stat_date")
    private LocalDate statDate;

    @Column(name = "count", nullable = false)
    private Integer count;
}
