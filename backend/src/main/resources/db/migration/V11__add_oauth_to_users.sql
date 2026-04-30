ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20),
    ADD COLUMN IF NOT EXISTS oauth_id       VARCHAR(100),
    ALTER COLUMN password_hash DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
