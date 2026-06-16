-- ============================================================
-- V18: Community statistics refresh functions
-- ============================================================
-- Flyway can safely create these functions with the application DB user.
-- pg_cron job registration is intentionally kept out of Flyway because
-- Supabase only allows scheduling from a sufficiently privileged role.
-- See db/manual/register_community_stats_pg_cron.sql.

CREATE OR REPLACE FUNCTION refresh_community_post_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT pg_try_advisory_xact_lock(hashtext('refresh_community_post_stats')) THEN
        RETURN;
    END IF;

    INSERT INTO post_stats (
        post_id,
        apt_id,
        board_scope,
        board_code,
        view_count,
        like_count,
        comment_count,
        score,
        post_created_at,
        updated_at
    )
    SELECT
        p.id,
        p.apt_id,
        p.board_scope,
        p.board_code,
        COALESCE(v.view_count, 0),
        COALESCE(l.like_count, 0),
        COALESCE(c.comment_count, 0),
        (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)) AS score,
        p.created_at,
        NOW()
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*)::INT AS view_count
        FROM post_view_logs
        GROUP BY post_id
    ) v ON v.post_id = p.id
    LEFT JOIN (
        SELECT post_id, COUNT(*)::INT AS like_count
        FROM post_like_logs
        GROUP BY post_id
    ) l ON l.post_id = p.id
    LEFT JOIN (
        SELECT post_id, COUNT(*)::INT AS comment_count
        FROM comments
        GROUP BY post_id
    ) c ON c.post_id = p.id
    WHERE p.created_at > NOW() - INTERVAL '30 days'
    ON CONFLICT (post_id) DO UPDATE SET
        apt_id = EXCLUDED.apt_id,
        board_scope = EXCLUDED.board_scope,
        board_code = EXCLUDED.board_code,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        score = EXCLUDED.score,
        post_created_at = EXCLUDED.post_created_at,
        updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_community_keyword_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT pg_try_advisory_xact_lock(hashtext('refresh_community_keyword_stats')) THEN
        RETURN;
    END IF;

    DELETE FROM keyword_stats
    WHERE stat_date >= CURRENT_DATE - 8;

    INSERT INTO keyword_stats (
        keyword,
        apt_id,
        board_scope,
        board_code,
        scope_apt_key,
        stat_date,
        count
    )
    SELECT
        l.keyword,
        l.apt_id,
        l.board_scope,
        l.board_code,
        COALESCE(l.apt_id, -1) AS scope_apt_key,
        l.created_at::DATE AS stat_date,
        COUNT(*)::INT AS count
    FROM keyword_logs l
    WHERE l.created_at > NOW() - INTERVAL '8 days'
    GROUP BY
        l.keyword,
        l.apt_id,
        l.board_scope,
        l.board_code,
        COALESCE(l.apt_id, -1),
        l.created_at::DATE
    ON CONFLICT (keyword, board_scope, board_code, scope_apt_key, stat_date)
    DO UPDATE SET
        apt_id = EXCLUDED.apt_id,
        count = EXCLUDED.count;
END;
$$;

SELECT refresh_community_post_stats();
SELECT refresh_community_keyword_stats();
