ALTER TABLE posts
    ALTER COLUMN apt_id DROP NOT NULL;

ALTER TABLE post_view_logs
    ALTER COLUMN apt_id DROP NOT NULL;

ALTER TABLE post_like_logs
    ALTER COLUMN apt_id DROP NOT NULL;

ALTER TABLE keyword_logs
    ALTER COLUMN apt_id DROP NOT NULL;

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20) NOT NULL DEFAULT 'APARTMENT',
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40) NOT NULL DEFAULT 'APT_FREE',
    ADD COLUMN IF NOT EXISTS author_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS author_verified_apt_id BIGINT,
    ADD COLUMN IF NOT EXISTS author_verified_apt_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS author_verification_label VARCHAR(120);

UPDATE posts
SET board_scope = 'APARTMENT'
WHERE board_scope IS NULL OR board_scope = '';

UPDATE posts
SET board_code = CASE category
    WHEN '전체' THEN 'APT_ALL'
    WHEN '자유' THEN 'APT_FREE'
    WHEN '질문' THEN 'APT_QNA'
    WHEN '정보' THEN 'APT_INFO'
    WHEN '실거래' THEN 'APT_TRADE'
    WHEN '거래' THEN 'APT_TRADE'
    WHEN '민원' THEN 'APT_ISSUE'
    WHEN '민원/하자' THEN 'APT_ISSUE'
    ELSE 'APT_FREE'
END
WHERE board_code IS NULL OR board_code = 'APT_FREE';

UPDATE posts
SET author_verified_apt_id = apt_id
WHERE author_verified_apt_id IS NULL AND apt_id IS NOT NULL;

UPDATE posts
SET author_verified_apt_name = complex_name
WHERE author_verified_apt_name IS NULL AND complex_name IS NOT NULL;

UPDATE posts
SET author_verification_label = CONCAT('아파트 인증: ', author_verified_apt_name)
WHERE author_verification_label IS NULL
  AND author_verified_apt_name IS NOT NULL
  AND author_verified_apt_name <> '';

CREATE INDEX IF NOT EXISTS idx_posts_scope_board_created
    ON posts(board_scope, board_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_apartment_board_created
    ON posts(apt_id, board_code, created_at DESC);
