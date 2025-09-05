-- ABOUTME: Database schema for Bakul - AI data storage layer (failsafe version)
-- ABOUTME: Contains tables for users, API keys, and datasets with robust constraints and integrity checks

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL CHECK (length(username) > 0),
    password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table  
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key TEXT UNIQUE NOT NULL CHECK (length(api_key) > 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY CHECK (length(id) = 36), -- UUID for public access
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL CHECK (length(username) > 0), -- denormalized for public access
    name TEXT NOT NULL CHECK (length(name) > 0),
    data TEXT NOT NULL CHECK (length(data) <= 5 * 1024 * 1024), -- JSON data, max 5MB
    schema TEXT, -- JSON schema
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Rate limiting table (simple approach)
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY CHECK (length(key) > 0), -- API key or IP
    request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
    window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (use IF NOT EXISTS to avoid errors on repeated runs)
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_username ON datasets(username);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);