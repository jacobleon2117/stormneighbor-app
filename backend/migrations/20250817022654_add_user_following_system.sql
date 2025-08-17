-- Migration: add_user_following_system
-- Version: 20250817022654
-- Created: 2025-08-17T02:26:54.767Z

-- User following/followers system
CREATE TABLE IF NOT EXISTS user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for following system performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Add new follower notification template
INSERT INTO notification_templates (template_key, title_template, body_template, priority) VALUES
('new_follower', 'New Follower', '{{follower_name}} started following you', 'normal')
ON CONFLICT (template_key) DO NOTHING;
