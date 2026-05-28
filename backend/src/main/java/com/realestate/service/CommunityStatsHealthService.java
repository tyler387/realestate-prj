package com.realestate.service;

import com.realestate.web.dto.CommunityStatsHealthDto;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CommunityStatsHealthService {

    private static final String SCOPE_GLOBAL = "GLOBAL";
    private static final String SCOPE_APARTMENT = "APARTMENT";
    private static final String DEFAULT_GLOBAL_BOARD = "BLAH";

    private static final List<ExpectedColumn> V16_COLUMNS = List.of(
            new ExpectedColumn("post_view_logs", "board_scope"),
            new ExpectedColumn("post_view_logs", "board_code"),
            new ExpectedColumn("post_like_logs", "board_scope"),
            new ExpectedColumn("post_like_logs", "board_code"),
            new ExpectedColumn("keyword_logs", "board_scope"),
            new ExpectedColumn("keyword_logs", "board_code"),
            new ExpectedColumn("post_stats", "board_scope"),
            new ExpectedColumn("post_stats", "board_code"),
            new ExpectedColumn("keyword_stats", "id"),
            new ExpectedColumn("keyword_stats", "board_scope"),
            new ExpectedColumn("keyword_stats", "board_code"),
            new ExpectedColumn("keyword_stats", "scope_apt_key")
    );

    private final JdbcTemplate jdbcTemplate;

    public CommunityStatsHealthDto inspect(String scope, Long aptId, String boardCode) {
        String normalizedScope = SCOPE_APARTMENT.equals(scope) ? SCOPE_APARTMENT : SCOPE_GLOBAL;
        Long normalizedAptId = SCOPE_APARTMENT.equals(normalizedScope) ? aptId : null;
        String normalizedBoardCode = normalizeBoardCode(normalizedScope, boardCode);

        List<String> missingColumns = findMissingV16Columns();
        boolean v16MigrationApplied = missingColumns.isEmpty();

        long postStatsMissingRows = countPostStatsMissingRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long keywordStatsMissingGroups = countKeywordStatsMissingGroups(normalizedScope, normalizedAptId, normalizedBoardCode);
        long scopedPostStatsRows = countScopedPostStatsRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long scopedKeywordStatsRows = countScopedKeywordStatsRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long rankedPopularRows = countRankedPopularRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long rankedKeywordRows = countRankedKeywordRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long fallbackPopularCandidateRows = countFallbackPopularCandidateRows(normalizedScope, normalizedAptId, normalizedBoardCode);
        long fallbackKeywordCandidateRows = countFallbackKeywordCandidateRows(normalizedScope, normalizedAptId, normalizedBoardCode);

        boolean popularFallbackExpected = rankedPopularRows == 0 && fallbackPopularCandidateRows > 0;
        boolean keywordFallbackExpected = rankedKeywordRows == 0 && fallbackKeywordCandidateRows > 0;
        boolean healthy = v16MigrationApplied && postStatsMissingRows == 0 && keywordStatsMissingGroups == 0;

        return new CommunityStatsHealthDto(
                normalizedScope,
                normalizedBoardCode,
                normalizedAptId,
                v16MigrationApplied,
                missingColumns,
                postStatsMissingRows,
                keywordStatsMissingGroups,
                scopedPostStatsRows,
                scopedKeywordStatsRows,
                rankedPopularRows,
                rankedKeywordRows,
                fallbackPopularCandidateRows,
                fallbackKeywordCandidateRows,
                popularFallbackExpected,
                keywordFallbackExpected,
                healthy
        );
    }

    private List<String> findMissingV16Columns() {
        return V16_COLUMNS.stream()
                .filter(column -> !columnExists(column.tableName(), column.columnName()))
                .map(column -> column.tableName() + "." + column.columnName())
                .toList();
    }

    private boolean columnExists(String tableName, String columnName) {
        Long count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = ?
                  AND column_name = ?
                """, Long.class, tableName, columnName);
        return count != null && count > 0;
    }

    private long countPostStatsMissingRows(String scope, Long aptId, String boardCode) {
        QueryParts query = postScopedQuery("""
                SELECT COUNT(*)
                FROM posts p
                LEFT JOIN post_stats s ON s.post_id = p.id
                WHERE s.post_id IS NULL
                """, "p", scope, aptId, boardCode);
        return count(query);
    }

    private long countKeywordStatsMissingGroups(String scope, Long aptId, String boardCode) {
        QueryParts scopedLogs = keywordLogScopedQuery("""
                SELECT l.keyword,
                       l.board_scope,
                       l.board_code,
                       COALESCE(l.apt_id, -1) AS scope_apt_key,
                       l.created_at::DATE AS stat_date
                FROM keyword_logs l
                WHERE l.created_at > NOW() - INTERVAL '30 days'
                """, scope, aptId, boardCode);

        String sql = """
                SELECT COUNT(*)
                FROM (
                """ + scopedLogs.sql() + """
                    GROUP BY l.keyword, l.board_scope, l.board_code, COALESCE(l.apt_id, -1), l.created_at::DATE
                ) g
                LEFT JOIN keyword_stats s
                  ON s.keyword = g.keyword
                 AND s.board_scope = g.board_scope
                 AND s.board_code = g.board_code
                 AND s.scope_apt_key = g.scope_apt_key
                 AND s.stat_date = g.stat_date
                WHERE s.id IS NULL
                """;
        return count(new QueryParts(sql, scopedLogs.params()));
    }

    private long countScopedPostStatsRows(String scope, Long aptId, String boardCode) {
        QueryParts query = postScopedQuery("""
                SELECT COUNT(*)
                FROM post_stats s
                WHERE 1 = 1
                """, "s", scope, aptId, boardCode);
        return count(query);
    }

    private long countScopedKeywordStatsRows(String scope, Long aptId, String boardCode) {
        QueryParts query = keywordStatsScopedQuery("""
                SELECT COUNT(*)
                FROM keyword_stats s
                WHERE 1 = 1
                """, scope, aptId, boardCode);
        return count(query);
    }

    private long countRankedPopularRows(String scope, Long aptId, String boardCode) {
        QueryParts scoped = postStatsScopedQuery("""
                SELECT s.post_id
                FROM post_stats s
                JOIN posts p ON p.id = s.post_id
                WHERE 1 = 1
                """, "s", scope, aptId, boardCode);
        return count(new QueryParts("""
                SELECT COUNT(*)
                FROM (
                """ + scoped.sql() + """
                    ORDER BY s.score DESC, s.post_created_at DESC
                    LIMIT 5
                ) ranked
                """, scoped.params()));
    }

    private long countRankedKeywordRows(String scope, Long aptId, String boardCode) {
        QueryParts scoped = keywordStatsScopedQuery("""
                SELECT keyword
                FROM keyword_stats s
                WHERE s.stat_date >= CURRENT_DATE - 7
                """, scope, aptId, boardCode);
        return count(new QueryParts("""
                SELECT COUNT(*)
                FROM (
                """ + scoped.sql() + """
                    GROUP BY keyword
                    ORDER BY SUM(count) DESC
                    LIMIT 10
                ) ranked
                """, scoped.params()));
    }

    private long countFallbackPopularCandidateRows(String scope, Long aptId, String boardCode) {
        QueryParts query = postScopedQuery("""
                SELECT COUNT(*)
                FROM posts p
                WHERE 1 = 1
                """, "p", scope, aptId, boardCode);
        return count(query);
    }

    private long countFallbackKeywordCandidateRows(String scope, Long aptId, String boardCode) {
        QueryParts query = postScopedQuery("""
                SELECT COUNT(*)
                FROM posts p
                WHERE 1 = 1
                """, "p", scope, aptId, boardCode);
        return Math.min(count(query), 50);
    }

    private QueryParts postScopedQuery(String baseSql, String alias, String scope, Long aptId, String boardCode) {
        QueryParts query = new QueryParts(baseSql);
        query.add(" AND " + alias + ".board_scope = ?", scope);
        if (SCOPE_GLOBAL.equals(scope)) {
            query.add(" AND " + alias + ".apt_id IS NULL");
        } else {
            query.add(" AND " + alias + ".apt_id = ?", aptId);
        }
        if (boardCode != null) {
            query.add(" AND " + alias + ".board_code = ?", boardCode);
        }
        return query;
    }

    private QueryParts postStatsScopedQuery(String baseSql, String alias, String scope, Long aptId, String boardCode) {
        QueryParts query = new QueryParts(baseSql);
        query.add(" AND " + alias + ".board_scope = ?", scope);
        if (SCOPE_GLOBAL.equals(scope)) {
            query.add(" AND " + alias + ".apt_id IS NULL");
        } else {
            query.add(" AND " + alias + ".apt_id = ?", aptId);
        }
        if (boardCode != null) {
            query.add(" AND " + alias + ".board_code = ?", boardCode);
        }
        return query;
    }

    private QueryParts keywordLogScopedQuery(String baseSql, String scope, Long aptId, String boardCode) {
        QueryParts query = new QueryParts(baseSql);
        query.add(" AND l.board_scope = ?", scope);
        if (SCOPE_GLOBAL.equals(scope)) {
            query.add(" AND l.apt_id IS NULL");
        } else {
            query.add(" AND l.apt_id = ?", aptId);
        }
        if (boardCode != null) {
            query.add(" AND l.board_code = ?", boardCode);
        }
        return query;
    }

    private QueryParts keywordStatsScopedQuery(String baseSql, String scope, Long aptId, String boardCode) {
        QueryParts query = new QueryParts(baseSql);
        query.add(" AND s.board_scope = ?", scope);
        if (SCOPE_GLOBAL.equals(scope)) {
            query.add(" AND s.scope_apt_key = -1");
        } else {
            query.add(" AND s.scope_apt_key = ?", aptId);
        }
        if (boardCode != null) {
            query.add(" AND s.board_code = ?", boardCode);
        }
        return query;
    }

    private long count(QueryParts query) {
        Long count = jdbcTemplate.queryForObject(query.sql(), Long.class, query.params().toArray());
        return count == null ? 0 : count;
    }

    private String normalizeBoardCode(String scope, String boardCode) {
        if (!StringUtils.hasText(boardCode)) {
            return SCOPE_GLOBAL.equals(scope) ? DEFAULT_GLOBAL_BOARD : null;
        }
        String normalized = boardCode.trim();
        if (SCOPE_APARTMENT.equals(scope) && "APT_ALL".equals(normalized)) {
            return null;
        }
        return normalized;
    }

    private record ExpectedColumn(String tableName, String columnName) {
    }

    private static final class QueryParts {
        private final StringBuilder sql;
        private final List<Object> params;

        private QueryParts(String baseSql) {
            this.sql = new StringBuilder(baseSql);
            this.params = new ArrayList<>();
        }

        private QueryParts(String baseSql, List<Object> params) {
            this.sql = new StringBuilder(baseSql);
            this.params = new ArrayList<>(params);
        }

        private void add(String sqlPart, Object... values) {
            sql.append(sqlPart);
            Collections.addAll(params, values);
        }

        private String sql() {
            return sql.toString();
        }

        private List<Object> params() {
            return params;
        }
    }
}
