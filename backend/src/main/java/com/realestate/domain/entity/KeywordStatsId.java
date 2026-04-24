package com.realestate.domain.entity;

import java.io.Serializable;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class KeywordStatsId implements Serializable {

    private String keyword;
    private Long aptId;
    private LocalDate statDate;
}
