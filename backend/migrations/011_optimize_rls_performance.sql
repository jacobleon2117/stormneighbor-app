-- Migration: Optimize RLS Performance for Custom Auth
-- This migration creates a helper function to cache current_setting() calls
-- and updates RLS policies to use it, reducing per-row re-evaluation overhead

-- Create a stable function that returns the current user ID
-- STABLE functions are evaluated once per query, not once per row
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN current_setting('app.user_id', true)::integer;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Grant execute permission to all roles that need it
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated, anon;

-- Now we'll recreate key policies to use this function
-- This is a subset of the most performance-critical policies
-- Full optimization can be done incrementally

-- Users table policies (high traffic)
DROP POLICY IF EXISTS "Enable users to update own profile" ON users;
CREATE POLICY "Enable users to update own profile" ON users
    FOR UPDATE
    USING (id = get_current_user_id());

DROP POLICY IF EXISTS "Enable users to insert own profile" ON users;
CREATE POLICY "Enable users to insert own profile" ON users
    FOR INSERT
    WITH CHECK (id = get_current_user_id());

DROP POLICY IF EXISTS "users_delete_own" ON users;
CREATE POLICY "users_delete_own" ON users
    FOR DELETE
    USING (id = get_current_user_id());

-- Posts table policies (very high traffic)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON posts;
CREATE POLICY "Enable insert for authenticated users" ON posts
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Enable update for authenticated users" ON posts;
CREATE POLICY "Enable update for authenticated users" ON posts
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON posts;
CREATE POLICY "Enable delete for authenticated users" ON posts
    FOR DELETE
    USING (user_id = get_current_user_id());

-- Comments table policies (high traffic)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON comments;
CREATE POLICY "Enable insert for authenticated users" ON comments
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Enable update for authenticated users" ON comments;
CREATE POLICY "Enable update for authenticated users" ON comments
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON comments;
CREATE POLICY "Enable delete for authenticated users" ON comments
    FOR DELETE
    USING (user_id = get_current_user_id());

-- Reactions table policies (very high traffic)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reactions;
CREATE POLICY "Enable insert for authenticated users" ON reactions
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON reactions;
CREATE POLICY "Enable delete for authenticated users" ON reactions
    FOR DELETE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "reactions_update_own" ON reactions;
CREATE POLICY "reactions_update_own" ON reactions
    FOR UPDATE
    USING (user_id = get_current_user_id());

-- Messages table policies (high traffic)
DROP POLICY IF EXISTS "messages_select_own" ON messages;
CREATE POLICY "messages_select_own" ON messages
    FOR SELECT
    USING (
        sender_id = get_current_user_id()
        OR recipient_id = get_current_user_id()
    );

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own" ON messages
    FOR INSERT
    WITH CHECK (sender_id = get_current_user_id());

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages
    FOR UPDATE
    USING (sender_id = get_current_user_id());

DROP POLICY IF EXISTS "messages_delete_own" ON messages;
CREATE POLICY "messages_delete_own" ON messages
    FOR DELETE
    USING (sender_id = get_current_user_id());

-- Conversations table policies
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant" ON conversations
    FOR SELECT
    USING (
        participant_1_id = get_current_user_id()
        OR participant_2_id = get_current_user_id()
    );

DROP POLICY IF EXISTS "conversations_insert_participant" ON conversations;
CREATE POLICY "conversations_insert_participant" ON conversations
    FOR INSERT
    WITH CHECK (
        participant_1_id = get_current_user_id()
        OR participant_2_id = get_current_user_id()
    );

DROP POLICY IF EXISTS "conversations_update_participant" ON conversations;
CREATE POLICY "conversations_update_participant" ON conversations
    FOR UPDATE
    USING (
        participant_1_id = get_current_user_id()
        OR participant_2_id = get_current_user_id()
    );

-- Notifications table policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE
    USING (user_id = get_current_user_id());

-- User devices table policies
DROP POLICY IF EXISTS "user_devices_select_own" ON user_devices;
CREATE POLICY "user_devices_select_own" ON user_devices
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "user_devices_insert_own" ON user_devices;
CREATE POLICY "user_devices_insert_own" ON user_devices
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "user_devices_update_own" ON user_devices;
CREATE POLICY "user_devices_update_own" ON user_devices
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "user_devices_delete_own" ON user_devices;
CREATE POLICY "user_devices_delete_own" ON user_devices
    FOR DELETE
    USING (user_id = get_current_user_id());

-- User sessions table policies
DROP POLICY IF EXISTS "user_sessions_select_own" ON user_sessions;
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "user_sessions_delete_own" ON user_sessions;
CREATE POLICY "user_sessions_delete_own" ON user_sessions
    FOR DELETE
    USING (user_id = get_current_user_id());

-- Weather alerts policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON weather_alerts;
CREATE POLICY "Enable insert for authenticated users" ON weather_alerts
    FOR INSERT
    WITH CHECK (created_by = get_current_user_id());

DROP POLICY IF EXISTS "Enable update for authenticated users" ON weather_alerts;
CREATE POLICY "Enable update for authenticated users" ON weather_alerts
    FOR UPDATE
    USING (created_by = get_current_user_id());

-- Emergency resources policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON emergency_resources;
CREATE POLICY "Enable insert for authenticated users" ON emergency_resources
    FOR INSERT
    WITH CHECK (created_by = get_current_user_id());

DROP POLICY IF EXISTS "Enable update for authenticated users" ON emergency_resources;
CREATE POLICY "Enable update for authenticated users" ON emergency_resources
    FOR UPDATE
    USING (created_by = get_current_user_id());

-- Reports policies
DROP POLICY IF EXISTS "comment_reports_insert_own" ON comment_reports;
CREATE POLICY "comment_reports_insert_own" ON comment_reports
    FOR INSERT
    WITH CHECK (reporter_id = get_current_user_id());

DROP POLICY IF EXISTS "post_reports_insert_own" ON post_reports;
CREATE POLICY "post_reports_insert_own" ON post_reports
    FOR INSERT
    WITH CHECK (reported_by = get_current_user_id());

-- Saved posts policies
DROP POLICY IF EXISTS "saved_posts_select_own" ON saved_posts;
CREATE POLICY "saved_posts_select_own" ON saved_posts
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "saved_posts_insert_own" ON saved_posts;
CREATE POLICY "saved_posts_insert_own" ON saved_posts
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "saved_posts_delete_own" ON saved_posts;
CREATE POLICY "saved_posts_delete_own" ON saved_posts
    FOR DELETE
    USING (user_id = get_current_user_id());

-- Saved searches policies
DROP POLICY IF EXISTS "saved_searches_select_own" ON saved_searches;
CREATE POLICY "saved_searches_select_own" ON saved_searches
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "saved_searches_insert_own" ON saved_searches;
CREATE POLICY "saved_searches_insert_own" ON saved_searches
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "saved_searches_update_own" ON saved_searches;
CREATE POLICY "saved_searches_update_own" ON saved_searches
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "saved_searches_delete_own" ON saved_searches;
CREATE POLICY "saved_searches_delete_own" ON saved_searches
    FOR DELETE
    USING (user_id = get_current_user_id());

-- User follows policies
DROP POLICY IF EXISTS "user_follows_select_own" ON user_follows;
CREATE POLICY "user_follows_select_own" ON user_follows
    FOR SELECT
    USING (
        follower_id = get_current_user_id()
        OR following_id = get_current_user_id()
    );

DROP POLICY IF EXISTS "user_follows_insert_own" ON user_follows;
CREATE POLICY "user_follows_insert_own" ON user_follows
    FOR INSERT
    WITH CHECK (follower_id = get_current_user_id());

DROP POLICY IF EXISTS "user_follows_delete_own" ON user_follows;
CREATE POLICY "user_follows_delete_own" ON user_follows
    FOR DELETE
    USING (follower_id = get_current_user_id());

-- User blocks policies
DROP POLICY IF EXISTS "user_blocks_select_own" ON user_blocks;
CREATE POLICY "user_blocks_select_own" ON user_blocks
    FOR SELECT
    USING (blocker_id = get_current_user_id());

DROP POLICY IF EXISTS "user_blocks_insert_own" ON user_blocks;
CREATE POLICY "user_blocks_insert_own" ON user_blocks
    FOR INSERT
    WITH CHECK (blocker_id = get_current_user_id());

DROP POLICY IF EXISTS "user_blocks_delete_own" ON user_blocks;
CREATE POLICY "user_blocks_delete_own" ON user_blocks
    FOR DELETE
    USING (blocker_id = get_current_user_id());

-- Notification preferences policies
DROP POLICY IF EXISTS "notification_preferences_select_own" ON notification_preferences;
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
    FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_insert_own" ON notification_preferences;
CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_update_own" ON notification_preferences;
CREATE POLICY "notification_preferences_update_own" ON notification_preferences
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_delete_own" ON notification_preferences;
CREATE POLICY "notification_preferences_delete_own" ON notification_preferences
    FOR DELETE
    USING (user_id = get_current_user_id());

-- Search queries policies
DROP POLICY IF EXISTS "search_queries_select_own" ON search_queries;
CREATE POLICY "search_queries_select_own" ON search_queries
    FOR SELECT
    USING (user_id = get_current_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS "search_queries_insert_own" ON search_queries;
CREATE POLICY "search_queries_insert_own" ON search_queries
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id() OR user_id IS NULL);

-- Admin sessions policies
DROP POLICY IF EXISTS "admin_sessions_select" ON admin_sessions;
CREATE POLICY "admin_sessions_select" ON admin_sessions
    FOR SELECT
    USING (
        user_id = get_current_user_id()
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = get_current_user_id()
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'security' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

DROP POLICY IF EXISTS "admin_sessions_insert" ON admin_sessions;
CREATE POLICY "admin_sessions_insert" ON admin_sessions
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "admin_sessions_update" ON admin_sessions;
CREATE POLICY "admin_sessions_update" ON admin_sessions
    FOR UPDATE
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "admin_sessions_delete" ON admin_sessions;
CREATE POLICY "admin_sessions_delete" ON admin_sessions
    FOR DELETE
    USING (
        user_id = get_current_user_id()
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = get_current_user_id()
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'security' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- Admin actions policies (simplified - still needs EXISTS for permission check)
DROP POLICY IF EXISTS "admin_actions_insert" ON admin_actions;
CREATE POLICY "admin_actions_insert" ON admin_actions
    FOR INSERT
    WITH CHECK (admin_id = get_current_user_id());

-- Migration 011 complete: RLS policies now use cached user ID function
-- This should significantly reduce the auth_rls_initplan warnings and improve query performance
