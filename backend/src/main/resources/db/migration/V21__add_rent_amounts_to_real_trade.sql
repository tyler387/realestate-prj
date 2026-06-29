ALTER TABLE real_trade
    ADD COLUMN IF NOT EXISTS deposit_amount BIGINT,
    ADD COLUMN IF NOT EXISTS monthly_rent_amount BIGINT;

DROP INDEX IF EXISTS uq_real_trade_active_unique;

CREATE UNIQUE INDEX uq_real_trade_active_unique
    ON real_trade (
        apartment_id,
        trade_date,
        exclusive_area,
        floor,
        trade_type,
        trade_amount,
        COALESCE(deposit_amount, -1),
        COALESCE(monthly_rent_amount, -1)
    )
    WHERE is_cancelled = false;
