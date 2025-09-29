-- Migration: Add Missing Critical Indexes
-- Purpose: Add composite indexes for common query patterns to improve performance
-- Estimated impact: 50-1000x faster location queries, better pagination performance
-- Risk level: LOW (indexes only improve performance, don't change functionality)

-- =====================================================
-- MISSING INDEXES CREATION SCRIPT
-- =====================================================

BEGIN;

-- Record start time
DO $$
BEGIN
    RAISE NOTICE 'Starting creation of missing critical indexes at %', now();
END $$;

-- =====================================================
-- POSTS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating posts table performance indexes...';

-- Location-based queries with active filter (most common app query pattern)
-- Covers: SELECT * FROM posts WHERE city = ? AND state = ? AND is_active = true ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_location_active_time
ON posts(city, state, is_active, created_at DESC)
WHERE is_active = true;

-- Location and type filtering for search functionality
-- Covers: SELECT * FROM posts WHERE city = ? AND state = ? AND post_type = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_posts_location_type_active
ON posts(city, state, post_type, is_active)
WHERE is_active = true;

-- Emergency posts priority index for alert system
-- Covers: SELECT * FROM posts WHERE is_emergency = true AND city = ? AND state = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_emergency_location_time
ON posts(is_emergency, city, state, created_at DESC)
WHERE is_emergency = true;

-- User posts with status for profile pages
-- Covers: SELECT * FROM posts WHERE user_id = ? AND is_active = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_user_active_time
ON posts(user_id, is_active, created_at DESC);

-- Post priority and resolution status for filtering
-- Covers: SELECT * FROM posts WHERE priority = ? AND is_resolved = ? AND city = ?
CREATE INDEX IF NOT EXISTS idx_posts_priority_resolved_location
ON posts(priority, is_resolved, city, state)
WHERE is_active = true;

RAISE NOTICE 'Posts table indexes created';

-- =====================================================
-- USERS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating users table performance indexes...';

-- Active users by location for neighborhood discovery
-- Covers: SELECT * FROM users WHERE is_active = true AND location_city = ? AND address_state = ?
CREATE INDEX IF NOT EXISTS idx_users_active_location_lookup
ON users(is_active, location_city, address_state)
WHERE is_active = true;

-- Email verification status for authentication flows
-- Covers: SELECT * FROM users WHERE email_verified = ? AND is_active = ?
CREATE INDEX IF NOT EXISTS idx_users_verified_active
ON users(email_verified, is_active)
WHERE is_active = true;

-- Home location for weather alerts and local content
-- Covers: SELECT * FROM users WHERE home_city = ? AND home_state = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_users_home_location_active
ON users(home_city, home_state, is_active)
WHERE is_active = true;

RAISE NOTICE 'Users table indexes created';

-- =====================================================
-- MESSAGES TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating messages table performance indexes...';

-- Conversation messages ordered by time (most common messaging query)
-- Covers: SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time_desc
ON messages(conversation_id, created_at DESC);

-- Unread messages by recipient for notifications
-- Covers: SELECT * FROM messages WHERE recipient_id = ? AND is_read = false ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread_time
ON messages(recipient_id, is_read, created_at DESC)
WHERE is_read = false;

-- Sender messages for sent items view
-- Covers: SELECT * FROM messages WHERE sender_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_sender_time
ON messages(sender_id, created_at DESC);

RAISE NOTICE 'Messages table indexes created';

-- =====================================================
-- CONVERSATIONS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating conversations table performance indexes...';

-- User conversations ordered by last message (inbox view)
-- Covers: SELECT * FROM conversations WHERE (participant_1_id = ? OR participant_2_id = ?) ORDER BY last_message_at DESC
CREATE INDEX IF NOT EXISTS idx_conversations_participants_last_message
ON conversations(participant_1_id, participant_2_id, last_message_at DESC);

-- Unread conversations for notification badges
-- Covers: SELECT * FROM conversations WHERE (participant_1_id = ? OR participant_2_id = ?) AND has_unread = true
CREATE INDEX IF NOT EXISTS idx_conversations_participants_unread
ON conversations(participant_1_id, participant_2_id, has_unread)
WHERE has_unread = true;

RAISE NOTICE 'Conversations table indexes created';

-- =====================================================
-- REACTIONS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating reactions table performance indexes...';

-- Post reactions for like counts and user reaction status
-- Covers: SELECT * FROM reactions WHERE post_id = ? AND user_id = ?
CREATE INDEX IF NOT EXISTS idx_reactions_post_user_lookup
ON reactions(post_id, user_id);

-- Post reaction counts by type
-- Covers: SELECT reaction_type, COUNT(*) FROM reactions WHERE post_id = ? GROUP BY reaction_type
CREATE INDEX IF NOT EXISTS idx_reactions_post_type_count
ON reactions(post_id, reaction_type);

-- User reaction history
-- Covers: SELECT * FROM reactions WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_reactions_user_time
ON reactions(user_id, created_at DESC);

RAISE NOTICE 'Reactions table indexes created';

-- =====================================================
-- COMMENTS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating comments table performance indexes...';

-- Post comments ordered by time (comment threads)
-- Covers: SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_comments_post_time_asc
ON comments(post_id, created_at ASC);

-- Nested comment replies
-- Covers: SELECT * FROM comments WHERE parent_comment_id = ? ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_comments_parent_time_asc
ON comments(parent_comment_id, created_at ASC)
WHERE parent_comment_id IS NOT NULL;

-- User comments for profile pages
-- Covers: SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_comments_user_time_desc
ON comments(user_id, created_at DESC);

RAISE NOTICE 'Comments table indexes created';

-- =====================================================
-- NOTIFICATIONS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating notifications table performance indexes...';

-- User notifications ordered by time
-- Covers: SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_notifications_user_time_desc
ON notifications(user_id, created_at DESC);

-- Unread notifications for badges
-- Covers: SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_count
ON notifications(user_id, is_read)
WHERE is_read = false;

-- Push notification queue for background processing
-- Covers: SELECT * FROM notifications WHERE push_sent = false AND created_at > ?
CREATE INDEX IF NOT EXISTS idx_notifications_push_queue
ON notifications(push_sent, created_at)
WHERE push_sent = false;

RAISE NOTICE 'Notifications table indexes created';

-- =====================================================
-- WEATHER_ALERTS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating weather_alerts table performance indexes...';

-- Active alerts by location and severity
-- Covers: SELECT * FROM weather_alerts WHERE city = ? AND state = ? AND is_active = true ORDER BY severity DESC
CREATE INDEX IF NOT EXISTS idx_weather_alerts_location_active_severity
ON weather_alerts(city, state, is_active, severity DESC)
WHERE is_active = true;

-- Alert expiration cleanup
-- Covers: SELECT * FROM weather_alerts WHERE expires_at < now() AND is_active = true
CREATE INDEX IF NOT EXISTS idx_weather_alerts_expires_active
ON weather_alerts(expires_at, is_active)
WHERE is_active = true;

RAISE NOTICE 'Weather alerts table indexes created';

-- =====================================================
-- SAVED_POSTS TABLE CRITICAL INDEXES
-- =====================================================
RAISE NOTICE 'Creating saved_posts table performance indexes...';

-- User saved posts ordered by save time
-- Covers: SELECT * FROM saved_posts WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_time_desc
ON saved_posts(user_id, created_at DESC);

-- Check if post is saved by user (for UI state)
-- Covers: SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post_lookup
ON saved_posts(user_id, post_id);

RAISE NOTICE 'Saved posts table indexes created';

-- =====================================================
-- INDEX ANALYSIS & VALIDATION
-- =====================================================
DO $$
DECLARE
    new_index_count INTEGER;
    total_index_size BIGINT;
BEGIN
    -- Count new indexes created
    SELECT COUNT(*) INTO new_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexname NOT LIKE '%pkey%';

    RAISE NOTICE 'Total custom indexes after creation: %', new_index_count;

    -- Calculate total index size
    SELECT SUM(pg_relation_size(indexrelid))::BIGINT INTO total_index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public';

    RAISE NOTICE 'Total index size: % MB', (total_index_size / 1024 / 1024);

    -- Show index usage recommendations
    RAISE NOTICE 'Monitor these new indexes for usage with: SELECT * FROM pg_stat_user_indexes WHERE indexrelname LIKE ''idx_%'';';
END $$;

-- Record completion time
DO $$
BEGIN
    RAISE NOTICE 'Completed creation of missing critical indexes at %', now();
    RAISE NOTICE 'RECOMMENDED: Monitor query performance improvements and index usage over the next few days';
END $$;

COMMIT;

-- =====================================================
-- PERFORMANCE TESTING QUERIES
-- =====================================================
/*
-- Run these queries before and after index creation to measure improvement:

-- 1. Location-based post search (should be much faster)
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE city = 'Nashville' AND state = 'TN' AND is_active = true
ORDER BY created_at DESC LIMIT 20;

-- 2. User conversation list (should be much faster)
EXPLAIN ANALYZE
SELECT c.*, m.content as last_message
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE (c.participant_1_id = '123' OR c.participant_2_id = '123')
ORDER BY c.last_message_at DESC LIMIT 10;

-- 3. Post with reactions count (should be much faster)
EXPLAIN ANALYZE
SELECT p.*, COUNT(r.id) as reaction_count
FROM posts p
LEFT JOIN reactions r ON p.id = r.post_id
WHERE p.city = 'Austin' AND p.state = 'TX' AND p.is_active = true
GROUP BY p.id ORDER BY p.created_at DESC LIMIT 20;

-- 4. Unread notifications count (should be much faster)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM notifications
WHERE user_id = '123' AND is_read = false;
*/

-- =====================================================
-- INDEX MAINTENANCE NOTES
-- =====================================================
/*
-- Monitor index usage with this query:
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Remove unused indexes after monitoring period:
-- DROP INDEX IF EXISTS index_name; -- Only if idx_scan remains 0 after monitoring
*/