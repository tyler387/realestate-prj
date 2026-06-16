-- ============================================================
-- V17: DB-level guard for community likes
-- ============================================================
-- Service code already requires VERIFIED users for likes. This trigger is a
-- second line of defense for direct writes to post_like_logs.
--
-- The current schema stores likes by author_nickname instead of user_id, so the
-- trigger checks users.nickname and users.status.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_check_post_like_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM users u
        WHERE u.nickname = NEW.author_nickname
          AND u.status = 'VERIFIED'
    ) THEN
        RAISE EXCEPTION 'Only VERIFIED users can like posts (author_nickname=%)', NEW.author_nickname
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_post_like_verified ON post_like_logs;

CREATE TRIGGER check_post_like_verified
    BEFORE INSERT ON post_like_logs
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_post_like_verified();
