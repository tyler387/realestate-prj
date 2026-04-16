CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    apt_id BIGINT NOT NULL,
    category VARCHAR(20) NOT NULL,
    title VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    author_nickname VARCHAR(60) NOT NULL,
    complex_name VARCHAR(100) NOT NULL,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_apt_created_at ON posts (apt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_apt_popular ON posts (apt_id, like_count DESC, comment_count DESC, created_at DESC);

INSERT INTO posts (apt_id, category, title, content, author_nickname, complex_name, like_count, comment_count, created_at)
SELECT *
FROM (
    VALUES
        (
            1,
            '자유',
            '주차 문제 어떻게 생각하세요?',
            '요즘 방문 차량이 많아서 거주자 주차 공간이 부족한 것 같아요. 의견이 궁금해요.',
            '익명_1024',
            '잠실엘스',
            12,
            7,
            now() - interval '3 hour'
        ),
        (
            1,
            '정보',
            '관리비 고지서 확인하세요',
            '이번 달 관리비가 인상되었습니다. 공용부 교체 공사로 인한 변동입니다.',
            '익명_2010',
            '잠실엘스',
            8,
            3,
            now() - interval '5 hour'
        ),
        (
            1,
            '질문',
            '헬스장 이용 시간 변경되었나요?',
            '최근 운영 시간이 바뀐 것 같은데 공지 확인하신 분 계신가요?',
            '익명_3055',
            '잠실엘스',
            3,
            5,
            now() - interval '1 day'
        ),
        (
            6,
            '민원',
            '헬리오시티 주차 문제 심각해요',
            '주차 공간이 턱없이 부족합니다. 관리사무소에 민원 넣으신 분 계신가요?',
            '익명_9012',
            '헬리오시티',
            12,
            7,
            now() - interval '4 hour'
        ),
        (
            6,
            '자유',
            '헬리오시티 조경 너무 예쁘지 않나요',
            '봄이 되니 단지 내 꽃이 만발했네요. 산책하기 너무 좋아요.',
            '익명_8801',
            '헬리오시티',
            25,
            11,
            now() - interval '2 day'
        )
) AS seed(apt_id, category, title, content, author_nickname, complex_name, like_count, comment_count, created_at)
WHERE NOT EXISTS (SELECT 1 FROM posts);
