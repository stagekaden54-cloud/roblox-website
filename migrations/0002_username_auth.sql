-- BLOCK16 username/password authentication for Cloudflare D1.
-- This is additive: existing Supabase accounts and tables are not modified.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS account_credentials (
  player_id TEXT PRIMARY KEY NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL CHECK (password_iterations >= 100000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account_sessions_player ON account_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_account_sessions_expiry ON account_sessions(expires_at);

CREATE TABLE IF NOT EXISTS account_recovery_codes (
  code_hash TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_account_recovery_player ON account_recovery_codes(player_id);

CREATE TABLE IF NOT EXISTS account_rate_limits (
  bucket_key TEXT PRIMARY KEY NOT NULL,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);
CREATE INDEX IF NOT EXISTS idx_account_rate_limits_window ON account_rate_limits(window_started_at);
