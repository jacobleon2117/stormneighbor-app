DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis;
        RAISE NOTICE 'PostGIS extension available';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'PostGIS extension not available (this is OK for basic functionality)';
    END;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image_url TEXT,
    bio TEXT,
    
    location_city VARCHAR(100),
    address_state VARCHAR(50),
    zip_code VARCHAR(10),
    address TEXT,
    location_radius_miles DECIMAL(4,1) DEFAULT 10.0,
    show_city_only BOOLEAN DEFAULT TRUE,
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    email_verification_code VARCHAR(6),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    
    password_reset_code VARCHAR(6),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    notification_preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    post_type VARCHAR(50) NOT NULL DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal',
    
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    images TEXT[],
    tags TEXT[],
    
    is_emergency BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    images TEXT[],
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT reactions_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    
    UNIQUE(user_id, post_id, reaction_type),
    UNIQUE(user_id, comment_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS weather_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) DEFAULT 'USER',
    
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    phone VARCHAR(20),
    website VARCHAR(255),
    hours_of_operation VARCHAR(255),
    
    capacity INTEGER,
    current_availability INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(device_token)
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'immediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, notification_type)
);

CREATE TABLE IF NOT EXISTS notification_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_criteria JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    send_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50) NOT NULL,
    
    related_post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    related_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    related_alert_id INTEGER REFERENCES weather_alerts(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES notification_campaigns(id) ON DELETE SET NULL,
    
    push_sent BOOLEAN DEFAULT FALSE,
    push_delivered BOOLEAN DEFAULT FALSE,
    push_opened BOOLEAN DEFAULT FALSE,
    push_error TEXT,
    
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    
    search_type VARCHAR(50) DEFAULT 'general',
    source VARCHAR(50) DEFAULT 'manual',
    
    search_city VARCHAR(100),
    search_state VARCHAR(50),
    
    execution_time_ms INTEGER,
    
    clicked_result_id INTEGER,
    clicked_result_type VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    query_text TEXT,
    filters JSONB DEFAULT '{}',
    
    notify_new_results BOOLEAN DEFAULT TRUE,
    notification_frequency VARCHAR(20) DEFAULT 'immediate',
    last_notification_sent TIMESTAMP WITH TIME ZONE,
    
    total_results INTEGER DEFAULT 0,
    last_result_count INTEGER DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS search_suggestions (
    id SERIAL PRIMARY KEY,
    suggestion_text VARCHAR(255) NOT NULL,
    suggestion_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    
    search_count INTEGER DEFAULT 1,
    result_count INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0.0,
    
    city VARCHAR(100),
    state VARCHAR(50),
    
    is_trending BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    source VARCHAR(50) DEFAULT 'user_generated',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(suggestion_text, suggestion_type, city, state)
);

CREATE TABLE IF NOT EXISTS trending_searches (
    id SERIAL PRIMARY KEY,
    search_term VARCHAR(255) NOT NULL,
    
    search_count INTEGER DEFAULT 1,
    unique_users INTEGER DEFAULT 1,
    avg_results INTEGER DEFAULT 0,
    
    hourly_count INTEGER DEFAULT 0,
    daily_count INTEGER DEFAULT 0,
    weekly_count INTEGER DEFAULT 0,
    
    city VARCHAR(100),
    state VARCHAR(50),
    
    category VARCHAR(50),
    sentiment VARCHAR(20) DEFAULT 'neutral',
    
    is_trending BOOLEAN DEFAULT FALSE,
    trend_score DECIMAL(10,2) DEFAULT 0.0,
    peak_time TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(search_term, city, state)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_city, address_state);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type_priority ON posts(post_type, priority);
CREATE INDEX IF NOT EXISTS idx_posts_emergency ON posts(is_emergency) WHERE is_emergency = true;

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_location ON weather_alerts(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON weather_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON weather_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_active ON user_devices(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_push_pending ON notifications(push_sent, created_at) WHERE push_sent = false;
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON notification_campaigns(status, send_at);

CREATE INDEX IF NOT EXISTS idx_search_queries_user ON search_queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_location ON search_queries(search_city, search_state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_active ON saved_searches(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_notification ON saved_searches(notify_new_results, last_notification_sent) WHERE notify_new_results = true;

CREATE INDEX IF NOT EXISTS idx_search_suggestions_type ON search_suggestions(suggestion_type, search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_location ON search_suggestions(city, state, search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_trending ON search_suggestions(is_trending, click_through_rate DESC) WHERE is_trending = true;

CREATE INDEX IF NOT EXISTS idx_trending_searches_location ON trending_searches(city, state, trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_searches_category ON trending_searches(category, trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_searches_time ON trending_searches(is_trending, created_at DESC) WHERE is_trending = true;

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
) AS $$
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
      AND u.is_active = true
      AND (p.expires_at IS NULL OR p.expires_at > NOW())
    ORDER BY 
        CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
        CASE p.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            WHEN 'low' THEN 4 
            ELSE 5
        END,
        p.created_at DESC
    LIMIT post_limit OFFSET post_offset;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION search_posts(
    search_query TEXT DEFAULT NULL,
    user_city VARCHAR DEFAULT NULL,
    user_state VARCHAR DEFAULT NULL,
    post_types VARCHAR[] DEFAULT NULL,
    priorities VARCHAR[] DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    emergency_only BOOLEAN DEFAULT FALSE,
    resolved_filter VARCHAR DEFAULT 'all',
    sort_by VARCHAR DEFAULT 'date',
    search_limit INTEGER DEFAULT 20,
    search_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    content TEXT,
    post_type VARCHAR,
    priority VARCHAR,
    location_city VARCHAR,
    location_state VARCHAR,
    is_emergency BOOLEAN,
    is_resolved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    author_id INTEGER,
    author_name VARCHAR,
    author_image VARCHAR,
    match_score REAL,
    comment_count BIGINT,
    reaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.post_type,
        p.priority,
        p.location_city,
        p.location_state,
        p.is_emergency,
        p.is_resolved,
        p.created_at,
        u.id as author_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.profile_image_url as author_image,
        1.0 as match_score,
        COALESCE(cc.comment_count, 0) as comment_count,
        COALESCE(rc.reaction_count, 0) as reaction_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count 
        FROM comments 
        GROUP BY post_id
    ) cc ON p.id = cc.post_id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as reaction_count 
        FROM reactions 
        WHERE post_id IS NOT NULL 
        GROUP BY post_id
    ) rc ON p.id = rc.post_id
    WHERE 
        u.is_active = true
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        
        AND (search_query IS NULL OR 
             p.title ILIKE '%' || search_query || '%' OR
             p.content ILIKE '%' || search_query || '%')
        
        AND (user_city IS NULL OR p.location_city = user_city)
        AND (user_state IS NULL OR p.location_state = user_state)
        
        AND (post_types IS NULL OR p.post_type = ANY(post_types))
        
        AND (priorities IS NULL OR p.priority = ANY(priorities))
        
        AND (date_from IS NULL OR p.created_at >= date_from)
        AND (date_to IS NULL OR p.created_at <= date_to)
        
        AND (emergency_only = FALSE OR p.is_emergency = TRUE)
        
        AND (resolved_filter = 'all' OR 
             (resolved_filter = 'resolved' AND p.is_resolved = TRUE) OR
             (resolved_filter = 'unresolved' AND p.is_resolved = FALSE))
    
    ORDER BY 
        CASE WHEN sort_by = 'popularity' THEN (COALESCE(cc.comment_count, 0) + COALESCE(rc.reaction_count, 0)) END DESC,
        CASE WHEN p.is_emergency THEN 1 ELSE 2 END,
        CASE p.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            WHEN 'low' THEN 4 
            ELSE 5 
        END,
        p.created_at DESC
    
    LIMIT search_limit OFFSET search_offset;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_alerts_by_location(
    user_city VARCHAR DEFAULT NULL,
    user_state VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id INTEGER,
    alert_id VARCHAR,
    title VARCHAR,
    description TEXT,
    severity VARCHAR,
    alert_type VARCHAR,
    source VARCHAR,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id, wa.alert_id, wa.title, wa.description, wa.severity,
        wa.alert_type, wa.source, wa.start_time, wa.end_time,
        wa.is_active, wa.created_at
    FROM weather_alerts wa
    WHERE wa.is_active = true
      AND (wa.end_time IS NULL OR wa.end_time > NOW())
      AND (user_city IS NULL OR wa.location_city = user_city)
      AND (user_state IS NULL OR wa.location_state = user_state)
    ORDER BY 
        CASE wa.severity 
            WHEN 'CRITICAL' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'MODERATE' THEN 3 
            WHEN 'LOW' THEN 4 
            ELSE 5
        END,
        wa.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weather_alerts_updated_at ON weather_alerts;
CREATE TRIGGER update_weather_alerts_updated_at 
    BEFORE UPDATE ON weather_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_resources_updated_at ON emergency_resources;
CREATE TRIGGER update_emergency_resources_updated_at 
    BEFORE UPDATE ON emergency_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_devices_updated_at ON user_devices;
CREATE TRIGGER update_user_devices_updated_at 
    BEFORE UPDATE ON user_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_campaigns_updated_at ON notification_campaigns;
CREATE TRIGGER update_notification_campaigns_updated_at 
    BEFORE UPDATE ON notification_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();