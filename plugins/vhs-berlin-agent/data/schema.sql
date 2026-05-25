-- VHS Berlin Agent SQLite Schema
-- Phase 1: Foundation
-- Created: 2026-04-18

-- Courses table: stores extracted course data
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT NOT NULL,
    source_course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    district TEXT,
    location TEXT,
    category TEXT,
    level TEXT,  -- for language courses: A1, A2, B1, B2, C1, C2
    start_date TEXT,  -- ISO 8601 date
    end_date TEXT,
    schedule_text TEXT,
    price_text TEXT,
    booking_status TEXT,  -- "Anmeldung möglich", "Warteliste", "Ausgebucht", etc.
    special_rules TEXT,  -- e.g., "Beratung erforderlich"
    extracted_at TEXT NOT NULL,  -- ISO 8601 timestamp
    raw_hash TEXT NOT NULL,  -- SHA-256 of extracted data for change detection
    UNIQUE(source_course_id, extracted_at)
);

CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses(source_course_id);
CREATE INDEX IF NOT EXISTS idx_courses_district ON courses(district);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_start_date ON courses(start_date);
CREATE INDEX IF NOT EXISTS idx_courses_extracted_at ON courses(extracted_at);

-- Watched searches: user-saved queries for monitoring
CREATE TABLE IF NOT EXISTS watched_searches (
    watch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,  -- user-friendly name, e.g., "A2 German evening Neukölln"
    query_type TEXT NOT NULL,  -- "natural_language", "course_id", "district_location", "keyword"
    query_payload TEXT NOT NULL,  -- JSON with query parameters
    created_at TEXT NOT NULL,  -- ISO 8601 timestamp
    last_checked_at TEXT,  -- ISO 8601 timestamp
    enabled INTEGER DEFAULT 1  -- 0 = paused, 1 = active
);

CREATE INDEX IF NOT EXISTS idx_watched_searches_enabled ON watched_searches(enabled);
CREATE INDEX IF NOT EXISTS idx_watched_searches_last_checked ON watched_searches(last_checked_at);

-- Snapshots: historical search results for comparison
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    watch_id INTEGER NOT NULL,
    extracted_at TEXT NOT NULL,  -- ISO 8601 timestamp
    result_hash TEXT NOT NULL,  -- SHA-256 of sorted course IDs
    result_count INTEGER NOT NULL,
    result_course_ids TEXT NOT NULL,  -- JSON array of course IDs
    FOREIGN KEY (watch_id) REFERENCES watched_searches(watch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_snapshots_watch_id ON snapshots(watch_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_extracted_at ON snapshots(extracted_at);

-- Course events: change log for monitoring
CREATE TABLE IF NOT EXISTS course_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,  -- source_course_id from courses table
    event_type TEXT NOT NULL,  -- "new_course", "status_change", "price_change", "date_change", "disappeared"
    old_value TEXT,  -- JSON with previous values (if applicable)
    new_value TEXT,  -- JSON with new values
    detected_at TEXT NOT NULL,  -- ISO 8601 timestamp
    watch_id INTEGER  -- which watch triggered this event (if any)
);

CREATE INDEX IF NOT EXISTS idx_course_events_course_id ON course_events(course_id);
CREATE INDEX IF NOT EXISTS idx_course_events_detected_at ON course_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_course_events_watch_id ON course_events(watch_id);

-- Verification log: track selector health
CREATE TABLE IF NOT EXISTS verification_log (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_type TEXT NOT NULL,  -- "search_form", "results_list", "course_detail"
    verified_at TEXT NOT NULL,  -- ISO 8601 timestamp
    success INTEGER NOT NULL,  -- 0 = failed, 1 = success
    failed_selectors TEXT,  -- JSON array of selectors that failed
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_verification_log_page_type ON verification_log(page_type);
CREATE INDEX IF NOT EXISTS idx_verification_log_verified_at ON verification_log(verified_at);
