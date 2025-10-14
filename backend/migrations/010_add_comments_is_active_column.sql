-- Migration: Add is_active column to comments table for consistency
-- This adds soft delete support to comments, matching the pattern used in posts and users tables

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for is_active queries
CREATE INDEX IF NOT EXISTS idx_comments_is_active
ON comments(is_active)
WHERE is_active = TRUE;

-- Migration 010 complete: comments table now has is_active column for soft deletes
