-- Database schema for FirmaCheck

CREATE TABLE IF NOT EXISTS companies (
    ico        TEXT NOT NULL PRIMARY KEY,
    name       TEXT NOT NULL,
    address    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limits (
    key        TEXT    NOT NULL PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 1,
    reset_at   INTEGER NOT NULL
);
