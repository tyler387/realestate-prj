CREATE TABLE IF NOT EXISTS saved_trade_filter (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    filter_name VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_saved_trade_filter_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_trade_filter_user_id
    ON saved_trade_filter(user_id);
