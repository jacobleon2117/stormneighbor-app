-- Migration: Add RLS Policies for Admin Tables
-- This migration adds proper RLS policies for admin tables using custom JWT auth
-- Replaces auth.uid() with current_setting('app.user_id')

-- 1. admin_roles policies
CREATE POLICY admin_roles_select ON admin_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY admin_roles_insert ON admin_roles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY admin_roles_update ON admin_roles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY admin_roles_delete ON admin_roles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- 2. user_admin_roles policies
CREATE POLICY user_admin_roles_select ON user_admin_roles
    FOR SELECT
    USING (
        user_id = current_setting('app.user_id', true)::integer
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY user_admin_roles_insert ON user_admin_roles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'assign_roles'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY user_admin_roles_update ON user_admin_roles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'assign_roles'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY user_admin_roles_delete ON user_admin_roles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'admin' ? 'assign_roles'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- 3. admin_actions policies
CREATE POLICY admin_actions_select ON admin_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND (ar.permissions->'security' ? 'audit' OR ar.permissions->'security' ? 'read')
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY admin_actions_insert ON admin_actions
    FOR INSERT
    WITH CHECK (
        admin_id = current_setting('app.user_id', true)::integer
    );

-- 4. system_settings policies
CREATE POLICY system_settings_select ON system_settings
    FOR SELECT
    USING (
        is_public = true
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'system' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY system_settings_insert ON system_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'system' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY system_settings_update ON system_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'system' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY system_settings_delete ON system_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'system' ? 'write'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- 5. admin_sessions policies
CREATE POLICY admin_sessions_select ON admin_sessions
    FOR SELECT
    USING (
        user_id = current_setting('app.user_id', true)::integer
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'security' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY admin_sessions_insert ON admin_sessions
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY admin_sessions_update ON admin_sessions
    FOR UPDATE
    USING (user_id = current_setting('app.user_id', true)::integer);

CREATE POLICY admin_sessions_delete ON admin_sessions
    FOR DELETE
    USING (
        user_id = current_setting('app.user_id', true)::integer
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'security' ? 'read'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- 6. moderation_queue policies (update existing)
DROP POLICY IF EXISTS moderation_queue_select_all ON moderation_queue;

CREATE POLICY moderation_queue_select ON moderation_queue
    FOR SELECT
    USING (
        reporter_id = current_setting('app.user_id', true)::integer
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND (ar.permissions->'content' ? 'moderate' OR ar.permissions->'content' ? 'read')
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY moderation_queue_insert ON moderation_queue
    FOR INSERT
    WITH CHECK (
        reporter_id = current_setting('app.user_id', true)::integer
        OR EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'content' ? 'moderate'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

CREATE POLICY moderation_queue_update ON moderation_queue
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            WHERE uar.user_id = current_setting('app.user_id', true)::integer
              AND uar.is_active = true
              AND ar.is_active = true
              AND ar.permissions->'content' ? 'moderate'
              AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
        )
    );

-- 7. daily_analytics policies (if table exists)
-- Note: This table may not exist yet, so we'll make it conditional
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_analytics') THEN
        EXECUTE 'CREATE POLICY daily_analytics_select ON daily_analytics
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM user_admin_roles uar
                    JOIN admin_roles ar ON uar.role_id = ar.id
                    WHERE uar.user_id = current_setting(''app.user_id'', true)::integer
                      AND uar.is_active = true
                      AND ar.is_active = true
                      AND ar.permissions->''analytics'' ? ''read''
                      AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
                )
            )';

        EXECUTE 'CREATE POLICY daily_analytics_insert ON daily_analytics
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_admin_roles uar
                    JOIN admin_roles ar ON uar.role_id = ar.id
                    WHERE uar.user_id = current_setting(''app.user_id'', true)::integer
                      AND uar.is_active = true
                      AND ar.is_active = true
                      AND ar.permissions->''system'' ? ''write''
                      AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
                )
            )';

        RAISE NOTICE 'daily_analytics policies created';
    ELSE
        RAISE NOTICE 'daily_analytics table not found, skipping policies';
    END IF;
END $$;

-- Migration 009 complete: All admin tables now have proper RLS policies
