package com.realestate.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "keyword_stats")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KeywordStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "keyword", length = 50)
    private String keyword;

    @Column(name = "apt_id")
    private Long aptId;

    @Column(name = "board_scope", nullable = false, length = 20)
    private String boardScope;

    @Column(name = "board_code", nullable = false, length = 40)
    private String boardCode;

    @Column(name = "scope_apt_key", nullable = false)
    private Long scopeAptKey;

    @Column(name = "stat_date")
    private LocalDate statDate;

    @Column(name = "count", nullable = false)
    private Integer count;
}
