-- ============================================================
-- pg_cron 배치 등록 — 현 프로젝트 스키마 기준 (PRD §12.2 수정본)
-- 실행 위치: Supabase SQL Editor (postgres 역할 필수)
-- PRD 원문 오류 수정:
--   p.post_id     → p.id         (실제 PK 컬럼명)
--   p.apartment_id → p.apt_id    (실제 FK 컬럼명)
-- ============================================================

-- 0. pg_cron 확장 활성화 (이미 되어 있으면 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. post_stats 갱신 — 5분 주기
--    score = like_count * 2 + comment_count
--    posts.like_count / comment_count 도 동기화
-- ============================================================
SELECT cron.schedule(
  'refresh-post-stats',
  '*/5 * * * *',
  $$
  -- post_stats UPSERT
  INSERT INTO post_stats (
    post_id, apt_id, view_count, like_count, comment_count,
    score, post_created_at, updated_at
  )
  SELECT
    p.id,
    p.apt_id,
    COALESCE(v.view_count, 0),
    COALESCE(l.like_count, 0),
    COALESCE(c.comment_count, 0),
    (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)),
    p.created_at,
    NOW()
  FROM posts p
  LEFT JOIN (SELECT post_id, COUNT(*) AS view_count    FROM post_view_logs GROUP BY post_id) v ON p.id = v.post_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS like_count    FROM post_like_logs GROUP BY post_id) l ON p.id = l.post_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM comments       GROUP BY post_id) c ON p.id = c.post_id
  WHERE p.created_at > NOW() - INTERVAL '30 days'
  ON CONFLICT (post_id) DO UPDATE SET
    view_count    = EXCLUDED.view_count,
    like_count    = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    score         = EXCLUDED.score,
    updated_at    = EXCLUDED.updated_at;

  -- posts 카운터 동기화 (인기순 정렬 일관성)
  UPDATE posts p
  SET like_count    = s.like_count,
      comment_count = s.comment_count
  FROM post_stats s
  WHERE p.id = s.post_id;
  $$
);

-- ============================================================
-- 2. keyword_stats 갱신 — 10분 주기
-- ============================================================
SELECT cron.schedule(
  'refresh-keyword-stats',
  '*/10 * * * *',
  $$
  INSERT INTO keyword_stats (keyword, apt_id, stat_date, count)
  SELECT
    keyword,
    apt_id,
    created_at::DATE AS stat_date,
    COUNT(*)
  FROM keyword_logs
  WHERE created_at > NOW() - INTERVAL '8 days'
  GROUP BY keyword, apt_id, created_at::DATE
  ON CONFLICT (keyword, apt_id, stat_date) DO UPDATE SET
    count = EXCLUDED.count;
  $$
);

-- ============================================================
-- 3. 등록 확인
-- ============================================================
SELECT jobid, schedule, jobname, active FROM cron.job;

-- ============================================================
-- 4. 실행 이력 확인 (등록 후 15분 대기)
-- ============================================================
-- SELECT jobid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================================
-- 5. job 제거 (필요 시)
-- ============================================================
-- SELECT cron.unschedule('refresh-post-stats');
-- SELECT cron.unschedule('refresh-keyword-stats');
