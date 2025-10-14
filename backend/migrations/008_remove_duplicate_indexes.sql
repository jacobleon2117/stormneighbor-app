-- Migration: Remove Duplicate Indexes
-- This migration removes duplicate indexes to save storage and improve write performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

-- 1. comments table - idx_comments_post is duplicate of idx_comments_post_time_asc
-- Keep the more descriptive name
DROP INDEX IF EXISTS idx_comments_post;

-- 2. messages table - idx_messages_conversation is duplicate of idx_messages_conversation_time_desc
-- Keep the more descriptive name
DROP INDEX IF EXISTS idx_messages_conversation;

-- 3. notification_campaigns table - idx_campaigns_status is duplicate of idx_notification_campaigns_status_send_at
-- Keep the more descriptive name
DROP INDEX IF EXISTS idx_campaigns_status;

-- Migration 008 complete: 3 duplicate indexes removed, saving storage space
