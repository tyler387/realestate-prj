CREATE TABLE IF NOT EXISTS collection_job (
    job_id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    error_message TEXT,
    progress_message VARCHAR(255),
    total_count INTEGER,
    processed_count INTEGER,
    saved_count INTEGER,
    skipped_count INTEGER,
    duplicate_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_collection_job_started_at
    ON collection_job(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_job_status
    ON collection_job(status);
