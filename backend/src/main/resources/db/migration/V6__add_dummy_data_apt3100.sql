-- ============================================================
-- V6: apt_id = 3100 더미 데이터 추가
-- ============================================================

DO $$
DECLARE
    apt_name TEXT;
    post_id_arr BIGINT[];
    n_posts INT;
BEGIN
    SELECT complex_name INTO apt_name FROM apartment WHERE id = 3100;
    IF apt_name IS NULL THEN
        RAISE EXCEPTION 'apt_id 3100인 아파트가 없습니다.';
    END IF;

    -- 500 게시글
    INSERT INTO posts (apt_id, category, title, content, author_nickname, complex_name, like_count, comment_count, created_at)
    SELECT
        3100,
        (ARRAY['자유','질문','정보','민원','거래'])[(floor(random() * 5) + 1)::INT],
        (ARRAY[
            '헬스장 이용 시간 변경되었나요','관리비 고지서 확인하세요','주차 문제 어떻게 생각하세요',
            '택배 보관함 위치 아시는 분','분리수거 요일 바뀌었어요','엘리베이터 소음 민원 넣으신 분',
            '헬스장 회원 등록 어떻게 하나요','놀이터 보수 공사 일정','경비실 택배 보관 정책',
            '재활용 분리 기준 공지','이사 업체 추천 부탁드려요','층간소음 어떻게 해결하셨나요',
            '인테리어 업체 후기 공유','매물 시세 어떻게 보세요','전세 재계약 관련 문의'
        ])[(floor(random() * 15) + 1)::INT] || ' #' || gs::TEXT,
        '본문 내용입니다. 주차 헬스장 관리비 택배 분리수거 엘리베이터 소음 놀이터 경비실 재활용 이사 층간소음 인테리어 매물 전세 관련해서 공유합니다. #' || gs::TEXT,
        '익명_' || lpad((floor(random() * 9999) + 1)::INT::TEXT, 4, '0'),
        apt_name,
        0, 0,
        NOW() - (random() * INTERVAL '7 days')
    FROM generate_series(1, 500) AS gs;

    -- 방금 삽입한 게시글 ID 수집
    SELECT ARRAY(SELECT id FROM posts WHERE apt_id = 3100 ORDER BY id)
    INTO post_id_arr;
    n_posts := array_length(post_id_arr, 1);

    -- 2,000 댓글
    INSERT INTO comments (post_id, author_nickname, content, created_at)
    SELECT
        p.id,
        '익명_' || lpad((floor(random() * 9999) + 1)::INT::TEXT, 4, '0'),
        (ARRAY[
            '정말 유용한 정보네요!','저도 같은 생각이에요','감사합니다!','좋은 글 잘 읽었습니다',
            '도움이 되었어요','저희 단지도 그렇더라고요','관리사무소에 문의해보세요',
            '공감합니다!','좋은 정보 공유 감사해요','이런 문제가 있었군요'
        ])[(floor(random() * 10) + 1)::INT],
        NOW() - (random() * INTERVAL '6 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 2000)) sub
    JOIN posts p ON p.id = sub.pid;

    -- 3,000 조회 로그
    INSERT INTO post_view_logs (post_id, apt_id, created_at)
    SELECT p.id, 3100, NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 3000)) sub
    JOIN posts p ON p.id = sub.pid;

    -- ~500 좋아요 로그
    INSERT INTO post_like_logs (post_id, author_nickname, apt_id, created_at)
    SELECT p.id, '익명_' || lpad((floor(random() * 200) + 1)::INT::TEXT, 4, '0'), 3100, NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 1000)) sub
    JOIN posts p ON p.id = sub.pid
    ON CONFLICT (post_id, author_nickname) DO NOTHING;

    -- 500 키워드 로그
    INSERT INTO keyword_logs (keyword, source, post_id, apt_id, created_at)
    SELECT
        (ARRAY['주차','헬스장','관리비','택배','분리수거','엘리베이터','소음','놀이터','경비실','재활용','이사','층간소음','인테리어','매물','전세'])[(floor(random() * 15) + 1)::INT],
        CASE WHEN random() < 0.5 THEN 'POST' ELSE 'SEARCH' END,
        p.id, 3100,
        NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 500)) sub
    JOIN posts p ON p.id = sub.pid;

END $$;

-- 집계 갱신 (apt_id = 3100)
INSERT INTO post_stats (post_id, apt_id, view_count, like_count, comment_count, score, post_created_at, updated_at)
SELECT
    p.id, p.apt_id,
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
WHERE p.apt_id = 3100
  AND p.created_at > NOW() - INTERVAL '30 days'
ON CONFLICT (post_id) DO UPDATE SET
    view_count    = EXCLUDED.view_count,
    like_count    = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    score         = EXCLUDED.score,
    updated_at    = EXCLUDED.updated_at;

INSERT INTO keyword_stats (keyword, apt_id, stat_date, count)
SELECT keyword, apt_id, created_at::DATE, COUNT(*)
FROM keyword_logs
WHERE apt_id = 3100
  AND created_at > NOW() - INTERVAL '8 days'
GROUP BY keyword, apt_id, created_at::DATE
ON CONFLICT (keyword, apt_id, stat_date) DO UPDATE SET count = EXCLUDED.count;

UPDATE posts p
SET like_count    = s.like_count,
    comment_count = s.comment_count
FROM post_stats s
WHERE p.id = s.post_id
  AND p.apt_id = 3100;
