-- Normalize community rows that may already have been created by older
-- migrations before the UTF-8 text cleanup.

UPDATE posts
SET category = CASE board_code
    WHEN 'REAL_ESTATE' THEN '부동산'
    WHEN 'STOCK' THEN '주식'
    WHEN 'DATING' THEN '연애'
    WHEN 'BLAH' THEN '블라블라'
    ELSE category
END
WHERE board_scope = 'GLOBAL'
  AND board_code IN ('REAL_ESTATE', 'STOCK', 'DATING', 'BLAH');

UPDATE posts
SET category = CASE board_code
    WHEN 'APT_QNA' THEN '질문'
    WHEN 'APT_INFO' THEN '정보'
    WHEN 'APT_TRADE' THEN '실거래'
    WHEN 'APT_ISSUE' THEN '민원/하자'
    WHEN 'APT_ALL' THEN '자유'
    WHEN 'APT_FREE' THEN '자유'
    ELSE category
END
WHERE board_scope = 'APARTMENT'
  AND board_code IN ('APT_QNA', 'APT_INFO', 'APT_TRADE', 'APT_ISSUE', 'APT_ALL', 'APT_FREE');

UPDATE posts
SET complex_name = '전체 커뮤니티'
WHERE board_scope = 'GLOBAL'
  AND (complex_name IS NULL OR complex_name = '' OR complex_name = '아파트');

UPDATE posts
SET author_verified_apt_id = apt_id
WHERE board_scope = 'APARTMENT'
  AND author_verified_apt_id IS NULL
  AND apt_id IS NOT NULL;

UPDATE posts
SET author_verified_apt_name = complex_name
WHERE board_scope = 'APARTMENT'
  AND (author_verified_apt_name IS NULL OR author_verified_apt_name = '')
  AND complex_name IS NOT NULL
  AND complex_name <> '';

UPDATE posts
SET author_verification_label = CONCAT('아파트 인증: ', author_verified_apt_name)
WHERE author_verified_apt_name IS NOT NULL
  AND author_verified_apt_name <> '';

UPDATE post_view_logs l
SET board_scope = p.board_scope,
    board_code = p.board_code,
    apt_id = p.apt_id
FROM posts p
WHERE l.post_id = p.id
  AND (
      l.board_scope IS DISTINCT FROM p.board_scope
      OR l.board_code IS DISTINCT FROM p.board_code
      OR l.apt_id IS DISTINCT FROM p.apt_id
  );

UPDATE post_like_logs l
SET board_scope = p.board_scope,
    board_code = p.board_code,
    apt_id = p.apt_id
FROM posts p
WHERE l.post_id = p.id
  AND (
      l.board_scope IS DISTINCT FROM p.board_scope
      OR l.board_code IS DISTINCT FROM p.board_code
      OR l.apt_id IS DISTINCT FROM p.apt_id
  );

UPDATE keyword_logs l
SET board_scope = p.board_scope,
    board_code = p.board_code,
    apt_id = p.apt_id
FROM posts p
WHERE l.post_id = p.id
  AND (
      l.board_scope IS DISTINCT FROM p.board_scope
      OR l.board_code IS DISTINCT FROM p.board_code
      OR l.apt_id IS DISTINCT FROM p.apt_id
  );

UPDATE post_stats s
SET board_scope = p.board_scope,
    board_code = p.board_code,
    apt_id = p.apt_id,
    like_count = p.like_count,
    comment_count = p.comment_count,
    score = p.like_count * 2 + p.comment_count,
    post_created_at = p.created_at,
    updated_at = NOW()
FROM posts p
WHERE s.post_id = p.id
  AND (
      s.board_scope IS DISTINCT FROM p.board_scope
      OR s.board_code IS DISTINCT FROM p.board_code
      OR s.apt_id IS DISTINCT FROM p.apt_id
      OR s.like_count IS DISTINCT FROM p.like_count
      OR s.comment_count IS DISTINCT FROM p.comment_count
      OR s.post_created_at IS DISTINCT FROM p.created_at
  );

TRUNCATE TABLE keyword_stats;

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
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY l.keyword, l.apt_id, l.board_scope, l.board_code, COALESCE(l.apt_id, -1), l.created_at::DATE;
