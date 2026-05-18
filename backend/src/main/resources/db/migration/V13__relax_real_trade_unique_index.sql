-- The previous unique key was too coarse:
-- (apartment_id, trade_date, exclusive_area, floor, trade_type)
-- In large complexes, multiple valid deals can share those fields on the same day.
-- Include trade_amount in the uniqueness key to reduce false deduplication.

DROP INDEX IF EXISTS uq_real_trade_active_unique;

CREATE UNIQUE INDEX uq_real_trade_active_unique
    ON real_trade (apartment_id, trade_date, exclusive_area, floor, trade_type, trade_amount)
    WHERE is_cancelled = false;
