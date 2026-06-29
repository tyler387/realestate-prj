CREATE TABLE IF NOT EXISTS collection_issue (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(64),
    source_type VARCHAR(50) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    sigungu VARCHAR(50),
    eup_myeon_dong VARCHAR(50),
    apt_name VARCHAR(255),
    lawd_cd VARCHAR(20),
    deal_ymd VARCHAR(6),
    raw_payload TEXT,
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_issue_created_at
    ON collection_issue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_issue_job_id
    ON collection_issue(job_id);

CREATE INDEX IF NOT EXISTS idx_collection_issue_type
    ON collection_issue(source_type, issue_type);
