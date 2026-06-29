-- ============================================================
-- pg_cron batch registration for community statistics
-- ============================================================
-- Run location: Supabase SQL Editor with the postgres role.
--
-- This file matches the current schema after:
-- - V15__community_global_board_scope.sql
-- - V16__community_scope_stats.sql
--
-- The stats tables are scope-aware:
-- - post_stats requires board_scope and board_code.
-- - keyword_stats uses scope_apt_key so GLOBAL rows can use apt_id = NULL.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Make this script safe to rerun.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('refresh-post-stats', 'refresh-keyword-stats');

-- ============================================================
-- 1. post_stats refresh, every 5 minutes
--    score = like_count * 2 + comment_count
-- ============================================================
SELECT cron.schedule(
  'refresh-post-stats',
  '*/5 * * * *',
  $$
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
    (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)),
    p.created_at,
    NOW()
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS view_count
    FROM post_view_logs
    GROUP BY post_id
  ) v ON p.id = v.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS like_count
    FROM post_like_logs
    GROUP BY post_id
  ) l ON p.id = l.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_count
    FROM comments
    GROUP BY post_id
  ) c ON p.id = c.post_id
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

  UPDATE posts p
  SET like_count = s.like_count,
      comment_count = s.comment_count
  FROM post_stats s
  WHERE p.id = s.post_id;
  $$
);

-- ============================================================
-- 2. keyword_stats refresh, every 10 minutes
-- ============================================================
SELECT cron.schedule(
  'refresh-keyword-stats',
  '*/10 * * * *',
  $$
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
    COUNT(*) AS count
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
  $$
);

SELECT jobid, schedule, jobname, active
FROM cron.job
WHERE jobname IN ('refresh-post-stats', 'refresh-keyword-stats')
ORDER BY jobname;

-- Recent execution history after waiting for at least one schedule interval:
-- SELECT jobid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid IN (
--   SELECT jobid FROM cron.job
--   WHERE jobname IN ('refresh-post-stats', 'refresh-keyword-stats')
-- )
-- ORDER BY start_time DESC
-- LIMIT 10;
