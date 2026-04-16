-- 시드 게시글의 apt_id를 실제 수집된 아파트 ID에 맞게 수정
UPDATE posts p
SET apt_id     = a.id,
    complex_name = a.complex_name
FROM apartment a
WHERE a.complex_name = p.complex_name;

-- 매칭되는 아파트가 없는 시드 게시글 삭제
DELETE FROM posts
WHERE apt_id NOT IN (SELECT id FROM apartment);
