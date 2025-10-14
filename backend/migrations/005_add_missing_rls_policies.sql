-- Migration: Add Missing RLS Policies
-- This migration adds RLS policies to tables that have RLS enabled but no policies

-- 1. saved_posts table policies
CREATE POLICY saved_posts_select_own ON saved_posts
    FOR SELECT
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY saved_posts_insert_own ON saved_posts
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY saved_posts_delete_own ON saved_posts
    FOR DELETE
    USING (user_id = current_setting('app.user_id', true)::integer);

-- 2. saved_searches table policies
CREATE POLICY saved_searches_select_own ON saved_searches
    FOR SELECT
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY saved_searches_insert_own ON saved_searches
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY saved_searches_update_own ON saved_searches
    FOR UPDATE
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY saved_searches_delete_own ON saved_searches
    FOR DELETE
    USING (user_id = current_setting('app.user_id', true)::integer);

-- 3. user_follows table policies
CREATE POLICY user_follows_select_own ON user_follows
    FOR SELECT
    USING (follower_id = current_setting('app.user_id', true)::integer
           OR following_id = current_setting('app.user_id', true)::integer);

CREATE POLICY user_follows_insert_own ON user_follows
    FOR INSERT
    WITH CHECK (follower_id = current_setting('app.user_id', true)::integer);

CREATE POLICY user_follows_delete_own ON user_follows
    FOR DELETE
    USING (follower_id = current_setting('app.user_id', true)::integer);

-- 4. notification_preferences table policies
CREATE POLICY notification_preferences_select_own ON notification_preferences
    FOR SELECT
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY notification_preferences_insert_own ON notification_preferences
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY notification_preferences_update_own ON notification_preferences
    FOR UPDATE
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY notification_preferences_delete_own ON notification_preferences
    FOR DELETE
    USING (user_id = current_setting('app.user_id', true)::integer);

-- 5. search_queries table policies (user can see own queries only)
CREATE POLICY search_queries_select_own ON search_queries
    FOR SELECT
    USING (user_id = current_setting('app.user_id', true)::integer OR user_id IS NULL);

CREATE POLICY search_queries_insert_own ON search_queries
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id', true)::integer OR user_id IS NULL);

-- 6. user_blocks table policies (already checked in previous work, adding complete policies)
-- Note: These might already exist, using DROP IF EXISTS first
DROP POLICY IF EXISTS user_blocks_select_own ON user_blocks;
CREATE POLICY user_blocks_select_own ON user_blocks
    FOR SELECT
    USING (blocker_id = current_setting('app.user_id', true)::integer);

DROP POLICY IF EXISTS user_blocks_insert_own ON user_blocks;
CREATE POLICY user_blocks_insert_own ON user_blocks
    FOR INSERT
    WITH CHECK (blocker_id = current_setting('app.user_id', true)::integer);

DROP POLICY IF EXISTS user_blocks_delete_own ON user_blocks;
CREATE POLICY user_blocks_delete_own ON user_blocks
    FOR DELETE
    USING (blocker_id = current_setting('app.user_id', true)::integer);

-- Migration 005 complete: All user-facing tables now have RLS policies
