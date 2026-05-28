package com.realestate.service;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class CommunityStatsMigrationSafetyTest {

    @Test
    void v16MigrationContainsScopeAwareBackfillAndNullableGlobalStatsGuards() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/db/migration/V16__community_scope_stats.sql"));

        assertThat(sql)
                .contains("ALTER TABLE post_stats")
                .contains("ALTER COLUMN apt_id DROP NOT NULL")
                .contains("INSERT INTO post_stats")
                .contains("FROM posts p")
                .contains("ON CONFLICT (post_id) DO UPDATE")
                .contains("TRUNCATE TABLE keyword_stats")
                .contains("INSERT INTO keyword_stats")
                .contains("COALESCE(l.apt_id, -1)")
                .contains("uk_keyword_stats_scope_board_apt_date_keyword");
    }
}
