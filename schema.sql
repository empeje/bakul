-- ABOUTME: Database schema for Bakul - AI data storage layer
-- ABOUTME: Contains tables for users, API keys, and datasets with simple structure

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table  
CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Datasets table
CREATE TABLE datasets (
    id TEXT PRIMARY KEY, -- UUID for public access
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL, -- denormalized for public access
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON data, max 5MB
    schema TEXT, -- JSON schema
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Rate limiting table (simple approach)
CREATE TABLE rate_limits (
    key TEXT PRIMARY KEY, -- API key or IP
    request_count INTEGER DEFAULT 0,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_username ON datasets(username);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);