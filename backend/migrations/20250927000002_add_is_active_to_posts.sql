-- Add is_active column to posts table
-- Migration: 20250927000002_add_is_active_to_posts.sql

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing posts to be active
UPDATE posts SET is_active = TRUE WHERE is_active IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active) WHERE is_active = true;