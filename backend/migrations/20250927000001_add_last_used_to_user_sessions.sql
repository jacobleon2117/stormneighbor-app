-- Add last_used column to user_sessions table
-- Migration: 20250927000001_add_last_used_to_user_sessions.sql

ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have a last_used value
UPDATE user_sessions SET last_used = created_at WHERE last_used IS NULL;

-- Create index for performance on session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_used ON user_sessions(last_used);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active ON user_sessions(user_id) WHERE is_active = true;