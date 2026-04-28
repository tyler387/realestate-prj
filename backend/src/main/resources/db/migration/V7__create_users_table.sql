-- ============================================================
-- V7: 사용자 인증 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL    PRIMARY KEY,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    nickname         VARCHAR(50)  NOT NULL UNIQUE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    apartment_id     BIGINT       REFERENCES apartment(id),
    apartment_name   VARCHAR(255),
    marketing_agreed BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_users_status CHECK (status IN ('MEMBER', 'VERIFIED'))
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
