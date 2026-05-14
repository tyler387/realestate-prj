ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);

-- Existing plaintext tokens cannot be converted to the new peppered SHA-256
-- in SQL (pepper lives in app config), so invalidate old rows and assign
-- non-null placeholder hashes to satisfy the new constraint safely.
UPDATE password_reset_tokens
SET used = TRUE,
    token_hash = COALESCE(token_hash, 'legacy-invalidated-' || id::text)
WHERE token_hash IS NULL;

ALTER TABLE password_reset_tokens
    ALTER COLUMN token_hash SET NOT NULL;

ALTER TABLE password_reset_tokens
    DROP COLUMN IF EXISTS token;
