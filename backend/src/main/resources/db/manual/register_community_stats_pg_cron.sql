-- ============================================================
-- Register Supabase pg_cron jobs for community stats refresh
-- ============================================================
-- Run this in Supabase SQL Editor or another connection using the postgres
-- role. Do not run it through the Spring/Flyway application user.
--
-- Required first:
-- 1. Deploy Flyway migration V18__community_stats_refresh_functions.sql.
-- 2. Enable the pg_cron extension in Supabase Database > Extensions, or run
--    CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
    'refresh-community-post-stats',
    'refresh-community-keyword-stats'
);

SELECT cron.schedule(
    'refresh-community-post-stats',
    '*/5 * * * *',
    $$SELECT refresh_community_post_stats();$$
);

SELECT cron.schedule(
    'refresh-community-keyword-stats',
    '*/10 * * * *',
    $$SELECT refresh_community_keyword_stats();$$
);

-- Verification:
-- SELECT jobid, schedule, jobname, active
-- FROM cron.job
-- WHERE jobname IN ('refresh-community-post-stats', 'refresh-community-keyword-stats')
-- ORDER BY jobname;
--
-- SELECT jobid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid IN (
--     SELECT jobid
--     FROM cron.job
--     WHERE jobname IN ('refresh-community-post-stats', 'refresh-community-keyword-stats')
-- )
-- ORDER BY start_time DESC
-- LIMIT 10;
