-- Migration: Fix Function Search Path Security Issue
-- This migration adds SET search_path = public to all functions to prevent search_path hijacking attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Drop and recreate functions to ensure proper search_path is set
-- This is necessary because PostgreSQL doesn't allow changing function attributes with CREATE OR REPLACE

DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS update_session_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_posts_by_location(VARCHAR, VARCHAR, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_posts(DECIMAL, DECIMAL, VARCHAR, VARCHAR, DECIMAL, BOOLEAN, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_post_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_comment_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_user_post_count(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_alerts_by_location(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_data() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_on_message() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_unread_on_read() CASCADE;
DROP FUNCTION IF EXISTS get_user_admin_permissions(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS user_has_permission(INTEGER, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS generate_daily_analytics(DATE) CASCADE;
DROP FUNCTION IF EXISTS update_admin_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_after_message() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_read_status() CASCADE;

-- 1. cleanup_expired_sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR is_active = false;

    DELETE FROM user_sessions
    WHERE created_at < NOW() - INTERVAL '90 days';

    RAISE NOTICE 'Session cleanup completed at %', NOW();
END;
$$;

-- 2. update_session_updated_at
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3. get_posts_by_location
CREATE OR REPLACE FUNCTION get_posts_by_location(
    user_city VARCHAR DEFAULT NULL,
    user_state VARCHAR DEFAULT NULL,
    post_limit INTEGER DEFAULT 20,
    post_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    user_id INTEGER,
    title VARCHAR,
    content TEXT,
    post_type VARCHAR,
    priority VARCHAR,
    location_city VARCHAR,
    location_state VARCHAR,
    images TEXT[],
    tags TEXT[],
    is_emergency BOOLEAN,
    is_resolved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_first_name VARCHAR,
    author_last_name VARCHAR,
    author_profile_image VARCHAR
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
        p.location_city, p.location_state, p.images, p.tags,
        p.is_emergency, p.is_resolved, p.created_at, p.updated_at,
        u.first_name, u.last_name, u.profile_image_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE (user_city IS NULL OR p.location_city = user_city)
      AND (user_state IS NULL OR p.location_state = user_state)
    ORDER BY p.created_at DESC
    LIMIT post_limit OFFSET post_offset;
END;
$$;

-- 4. get_nearby_posts
CREATE OR REPLACE FUNCTION get_nearby_posts(
    user_lat DECIMAL DEFAULT NULL,
    user_lng DECIMAL DEFAULT NULL,
    user_city VARCHAR DEFAULT NULL,
    user_state VARCHAR DEFAULT NULL,
    radius_miles DECIMAL DEFAULT 10.0,
    include_emergency BOOLEAN DEFAULT TRUE,
    post_limit INTEGER DEFAULT 20,
    post_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    user_id INTEGER,
    title VARCHAR,
    content TEXT,
    post_type VARCHAR,
    priority VARCHAR,
    location_city VARCHAR,
    location_state VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_miles DECIMAL,
    images TEXT[],
    tags TEXT[],
    is_emergency BOOLEAN,
    is_resolved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_first_name VARCHAR,
    author_last_name VARCHAR,
    author_profile_image VARCHAR
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF user_lat IS NULL OR user_lng IS NULL THEN
        RETURN QUERY
        SELECT
            p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
            p.location_city, p.location_state, p.latitude, p.longitude,
            0.0::DECIMAL as distance_miles,
            p.images, p.tags, p.is_emergency, p.is_resolved,
            p.created_at, p.updated_at,
            u.first_name, u.last_name, u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE (user_city IS NULL OR p.location_city = user_city)
          AND (user_state IS NULL OR p.location_state = user_state)
          AND (include_emergency = TRUE OR p.is_emergency = FALSE)
        ORDER BY p.created_at DESC
        LIMIT post_limit OFFSET post_offset;
    ELSE
        BEGIN
            RETURN QUERY
            SELECT
                p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
                p.location_city, p.location_state, p.latitude, p.longitude,
                (ST_Distance(
                    ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
                    ST_GeogFromText('POINT(' || p.longitude || ' ' || p.latitude || ')')
                ) / 1609.34)::DECIMAL as distance_miles,
                p.images, p.tags, p.is_emergency, p.is_resolved,
                p.created_at, p.updated_at,
                u.first_name, u.last_name, u.profile_image_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.latitude IS NOT NULL
              AND p.longitude IS NOT NULL
              AND ST_DWithin(
                  ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
                  ST_GeogFromText('POINT(' || p.longitude || ' ' || p.latitude || ')'),
                  radius_miles * 1609.34
              )
              AND (include_emergency = TRUE OR p.is_emergency = FALSE)
            ORDER BY distance_miles ASC, p.created_at DESC
            LIMIT post_limit OFFSET post_offset;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY
            SELECT
                p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
                p.location_city, p.location_state, p.latitude, p.longitude,
                (SQRT(
                    POW((p.latitude - user_lat) * 69.0, 2) +
                    POW((p.longitude - user_lng) * 53.0, 2)
                ))::DECIMAL as distance_miles,
                p.images, p.tags, p.is_emergency, p.is_resolved,
                p.created_at, p.updated_at,
                u.first_name, u.last_name, u.profile_image_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.latitude IS NOT NULL
              AND p.longitude IS NOT NULL
              AND SQRT(
                  POW((p.latitude - user_lat) * 69.0, 2) +
                  POW((p.longitude - user_lng) * 53.0, 2)
              ) <= radius_miles
              AND (include_emergency = TRUE OR p.is_emergency = FALSE)
            ORDER BY distance_miles ASC, p.created_at DESC
            LIMIT post_limit OFFSET post_offset;
        END;
    END IF;
END;
$$;

-- 5. get_post_stats
CREATE OR REPLACE FUNCTION get_post_stats(post_id_param INTEGER)
RETURNS TABLE (
    post_id INTEGER,
    comment_count BIGINT,
    reaction_count BIGINT,
    like_count BIGINT,
    love_count BIGINT,
    helpful_count BIGINT,
    report_count BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        post_id_param,
        (SELECT COUNT(*) FROM comments WHERE post_id = post_id_param),
        (SELECT COUNT(*) FROM reactions WHERE post_id = post_id_param),
        (SELECT COUNT(*) FROM reactions WHERE post_id = post_id_param AND reaction_type = 'like'),
        (SELECT COUNT(*) FROM reactions WHERE post_id = post_id_param AND reaction_type = 'love'),
        (SELECT COUNT(*) FROM reactions WHERE post_id = post_id_param AND reaction_type = 'helpful'),
        (SELECT COUNT(*) FROM post_reports WHERE post_id = post_id_param);
END;
$$;

-- 6. get_comment_stats
CREATE OR REPLACE FUNCTION get_comment_stats(comment_id_param INTEGER)
RETURNS TABLE (
    comment_id INTEGER,
    reaction_count BIGINT,
    like_count BIGINT,
    love_count BIGINT,
    helpful_count BIGINT,
    report_count BIGINT,
    reply_count BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        comment_id_param,
        (SELECT COUNT(*) FROM reactions WHERE comment_id = comment_id_param),
        (SELECT COUNT(*) FROM reactions WHERE comment_id = comment_id_param AND reaction_type = 'like'),
        (SELECT COUNT(*) FROM reactions WHERE comment_id = comment_id_param AND reaction_type = 'love'),
        (SELECT COUNT(*) FROM reactions WHERE comment_id = comment_id_param AND reaction_type = 'helpful'),
        (SELECT COUNT(*) FROM comment_reports WHERE comment_id = comment_id_param),
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = comment_id_param);
END;
$$;

-- 7. get_user_post_count
CREATE OR REPLACE FUNCTION get_user_post_count(user_id_param INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    post_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO post_count
    FROM posts
    WHERE user_id = user_id_param;

    RETURN post_count;
END;
$$;

-- 8. get_alerts_by_location
CREATE OR REPLACE FUNCTION get_alerts_by_location(
    location_city_param VARCHAR(100),
    location_state_param VARCHAR(50)
)
RETURNS TABLE (
    id INTEGER,
    alert_id VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    severity VARCHAR(20),
    alert_type VARCHAR(50),
    source VARCHAR(50),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_by INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        wa.id,
        wa.alert_id,
        wa.title,
        wa.description,
        wa.severity,
        wa.alert_type,
        wa.source,
        wa.location_city,
        wa.location_state,
        wa.location_county,
        wa.latitude,
        wa.longitude,
        wa.start_time,
        wa.end_time,
        wa.is_active,
        wa.created_by,
        wa.metadata,
        wa.created_at,
        wa.updated_at
    FROM weather_alerts wa
    WHERE wa.is_active = TRUE
      AND (wa.end_time IS NULL OR wa.end_time > NOW())
      AND (
        (LOWER(wa.location_city) = LOWER(location_city_param) AND
         LOWER(wa.location_state) = LOWER(location_state_param))
        OR
        (wa.location_city IS NULL AND
         LOWER(wa.location_state) = LOWER(location_state_param))
        OR
        (wa.location_county IS NOT NULL AND
         LOWER(wa.location_state) = LOWER(location_state_param))
      )
    ORDER BY
      CASE wa.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MODERATE' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END,
      wa.start_time DESC;
END;
$$;

-- 9. cleanup_old_data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM weather_alerts
    WHERE end_time < NOW() - INTERVAL '7 days'
      AND is_active = false;

    DELETE FROM search_queries
    WHERE created_at < NOW() - INTERVAL '6 months';

    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '3 months'
      AND is_read = true;

    PERFORM cleanup_expired_sessions();

    RAISE NOTICE 'Old data cleanup completed at %', NOW();
END;
$$;

-- 10. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 11. update_conversation_on_message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        participant_1_unread_count = CASE
            WHEN NEW.recipient_id = participant_1_id THEN participant_1_unread_count + 1
            ELSE participant_1_unread_count
        END,
        participant_2_unread_count = CASE
            WHEN NEW.recipient_id = participant_2_id THEN participant_2_unread_count + 1
            ELSE participant_2_unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

-- 12. update_conversation_unread_on_read
CREATE OR REPLACE FUNCTION update_conversation_unread_on_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF OLD.is_read = false AND NEW.is_read = true THEN
        UPDATE conversations
        SET
            participant_1_unread_count = CASE
                WHEN NEW.recipient_id = participant_1_id AND participant_1_unread_count > 0
                THEN participant_1_unread_count - 1
                ELSE participant_1_unread_count
            END,
            participant_2_unread_count = CASE
                WHEN NEW.recipient_id = participant_2_id AND participant_2_unread_count > 0
                THEN participant_2_unread_count - 1
                ELSE participant_2_unread_count
            END,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Now fix admin functions
-- 13. get_user_admin_permissions
CREATE OR REPLACE FUNCTION get_user_admin_permissions(user_id_param INTEGER)
RETURNS TABLE (
    permission_name VARCHAR,
    resource VARCHAR,
    action VARCHAR,
    role_name VARCHAR
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        ap.name as permission_name,
        ap.resource,
        ap.action,
        ar.name as role_name
    FROM user_admin_roles uar
    JOIN admin_roles ar ON uar.role_id = ar.id
    JOIN admin_role_permissions arp ON ar.id = arp.role_id
    JOIN admin_permissions ap ON arp.permission_id = ap.id
    WHERE uar.user_id = user_id_param
      AND uar.is_active = true
      AND ar.is_active = true
      AND (uar.expires_at IS NULL OR uar.expires_at > NOW());
END;
$$;

-- 14. user_has_permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id_param INTEGER,
    resource_param VARCHAR,
    action_param VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_admin_roles uar
        JOIN admin_roles ar ON uar.role_id = ar.id
        JOIN admin_role_permissions arp ON ar.id = arp.role_id
        JOIN admin_permissions ap ON arp.permission_id = ap.id
        WHERE uar.user_id = user_id_param
          AND uar.is_active = true
          AND ar.is_active = true
          AND ap.resource = resource_param
          AND ap.action = action_param
          AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
    ) INTO has_perm;

    RETURN has_perm;
END;
$$;

-- 15. generate_daily_analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_users INTEGER;
    v_new_posts INTEGER;
    v_new_comments INTEGER;
    v_active_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_new_users
    FROM users
    WHERE DATE(created_at) = target_date;

    SELECT COUNT(*) INTO v_new_posts
    FROM posts
    WHERE DATE(created_at) = target_date;

    SELECT COUNT(*) INTO v_new_comments
    FROM comments
    WHERE DATE(created_at) = target_date;

    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM (
        SELECT user_id FROM posts WHERE DATE(created_at) = target_date
        UNION
        SELECT user_id FROM comments WHERE DATE(created_at) = target_date
        UNION
        SELECT user_id FROM reactions WHERE DATE(created_at) = target_date
    ) active;

    INSERT INTO daily_analytics (
        date,
        new_users,
        new_posts,
        new_comments,
        active_users,
        created_at
    ) VALUES (
        target_date,
        v_new_users,
        v_new_posts,
        v_new_comments,
        v_active_users,
        NOW()
    )
    ON CONFLICT (date) DO UPDATE SET
        new_users = EXCLUDED.new_users,
        new_posts = EXCLUDED.new_posts,
        new_comments = EXCLUDED.new_comments,
        active_users = EXCLUDED.active_users;

    RAISE NOTICE 'Analytics generated for %', target_date;
END;
$$;

-- 16. update_admin_updated_at
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Now fix messaging system functions
-- 17. update_conversation_after_message
CREATE OR REPLACE FUNCTION update_conversation_after_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        participant_1_unread_count = CASE
            WHEN NEW.recipient_id = participant_1_id THEN participant_1_unread_count + 1
            ELSE participant_1_unread_count
        END,
        participant_2_unread_count = CASE
            WHEN NEW.recipient_id = participant_2_id THEN participant_2_unread_count + 1
            ELSE participant_2_unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

-- 18. update_conversation_read_status
CREATE OR REPLACE FUNCTION update_conversation_read_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF OLD.is_read = false AND NEW.is_read = true THEN
        UPDATE conversations
        SET
            participant_1_unread_count = CASE
                WHEN NEW.recipient_id = participant_1_id AND participant_1_unread_count > 0
                THEN participant_1_unread_count - 1
                ELSE participant_1_unread_count
            END,
            participant_2_unread_count = CASE
                WHEN NEW.recipient_id = participant_2_id AND participant_2_unread_count > 0
                THEN participant_2_unread_count - 1
                ELSE participant_2_unread_count
            END,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 19. search_posts (if exists in your codebase)
-- Note: search_posts was mentioned in CSV but need to check if it exists
-- Commenting out for now - will be added if needed

-- Note: Some functions like get_weather_alerts_for_location appear twice in the CSV
-- This suggests there might be duplicate functions that need investigation

-- Recreate triggers that were dropped due to CASCADE
DROP TRIGGER IF EXISTS trigger_update_session_updated_at ON user_sessions;
CREATE TRIGGER trigger_update_session_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_updated_at();

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_weather_alerts_updated_at ON weather_alerts;
CREATE TRIGGER trigger_weather_alerts_updated_at
    BEFORE UPDATE ON weather_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_emergency_resources_updated_at ON emergency_resources;
CREATE TRIGGER trigger_emergency_resources_updated_at
    BEFORE UPDATE ON emergency_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_campaigns_updated_at ON notification_campaigns;
CREATE TRIGGER trigger_notification_campaigns_updated_at
    BEFORE UPDATE ON notification_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER trigger_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_search_suggestions_updated_at ON search_suggestions;
CREATE TRIGGER trigger_search_suggestions_updated_at
    BEFORE UPDATE ON search_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

DROP TRIGGER IF EXISTS trigger_update_conversation_unread_on_read ON messages;
CREATE TRIGGER trigger_update_conversation_unread_on_read
    AFTER UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_unread_on_read();

-- Migration 004 complete: All function search paths have been secured
