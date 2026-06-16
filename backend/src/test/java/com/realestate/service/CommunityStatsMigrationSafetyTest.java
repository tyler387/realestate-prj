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

    @Test
    void v18MigrationDefinesBatchRefreshFunctionsButDoesNotScheduleCronInFlyway() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/db/migration/V18__community_stats_refresh_functions.sql"));

        assertThat(sql)
                .contains("CREATE OR REPLACE FUNCTION refresh_community_post_stats()")
                .contains("CREATE OR REPLACE FUNCTION refresh_community_keyword_stats()")
                .contains("pg_try_advisory_xact_lock")
                .contains("INSERT INTO post_stats")
                .contains("ON CONFLICT (post_id) DO UPDATE")
                .contains("DELETE FROM keyword_stats")
                .contains("INSERT INTO keyword_stats")
                .contains("ON CONFLICT (keyword, board_scope, board_code, scope_apt_key, stat_date)")
                .doesNotContain("cron.schedule");
    }

    @Test
    void manualCronRegistrationSchedulesPostAndKeywordRefreshJobs() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/db/manual/register_community_stats_pg_cron.sql"));

        assertThat(sql)
                .contains("CREATE EXTENSION IF NOT EXISTS pg_cron")
                .contains("cron.schedule")
                .contains("refresh-community-post-stats")
                .contains("*/5 * * * *")
                .contains("SELECT refresh_community_post_stats();")
                .contains("refresh-community-keyword-stats")
                .contains("*/10 * * * *")
                .contains("SELECT refresh_community_keyword_stats();");
    }
}
