CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE apartment (
    id BIGSERIAL PRIMARY KEY,
    complex_name VARCHAR(100) NOT NULL,
    road_address VARCHAR(200),
    sido VARCHAR(20),
    sigungu VARCHAR(30),
    eup_myeon_dong VARCHAR(30),
    legal_dong_code VARCHAR(10),
    location GEOMETRY(Point, 4326),
    completion_year INTEGER,
    total_household_count INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE real_trade (
    id BIGSERIAL PRIMARY KEY,
    apartment_id BIGINT NOT NULL REFERENCES apartment(id),
    trade_type VARCHAR(10),
    trade_date DATE NOT NULL,
    trade_year INTEGER,
    trade_month INTEGER,
    exclusive_area DECIMAL(8, 4),
    trade_amount BIGINT,
    floor INTEGER,
    price_per_pyeong BIGINT,
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_apartment_location_gist ON apartment USING GIST (location);
CREATE INDEX idx_apartment_location_geography_gist ON apartment USING GIST ((location::geography));
CREATE INDEX idx_apartment_region ON apartment (sido, sigungu, eup_myeon_dong);

CREATE INDEX idx_real_trade_apartment_trade_date ON real_trade (apartment_id, trade_date DESC);
CREATE INDEX idx_real_trade_type_year ON real_trade (trade_type, trade_year);

CREATE UNIQUE INDEX uq_real_trade_active_unique
    ON real_trade (apartment_id, trade_date, exclusive_area, floor, trade_type)
    WHERE is_cancelled = false;
