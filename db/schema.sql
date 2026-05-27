-- Database schema for FirmaCheck
-- Defines the cache table for economic subjects (companies)

CREATE TABLE IF NOT EXISTS companies (
    ico TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
