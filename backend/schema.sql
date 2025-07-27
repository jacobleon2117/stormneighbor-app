-- Fixed schema.sql - Proper ALTER statements instead of DROP/CREATE

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Update users table with proper ALTER statements (no data loss)
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_county VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_radius_miles DECIMAL(4,1) DEFAULT 10.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_city_only BOOLEAN DEFAULT FALSE;

-- Update existing users to use their address_city as location_city
UPDATE users 
SET location_city = address_city 
WHERE address_city IS NOT NULL AND location_city IS NULL;

-- Update posts table with proper ALTER statements
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_state VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_county VARCHAR(100);

-- Create missing tables for future features

-- Comments table (for future commenting feature)
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

-- Reactions table (for future like/reaction feature)
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'like', 'love', 'helpful', 'concerned', 'angry'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reactions_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, reaction_type),
    UNIQUE(user_id, comment_id, reaction_type)
);

-- Weather alerts table (for future weather integration)
CREATE TABLE IF NOT EXISTS weather_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'
    alert_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) DEFAULT 'USER', -- 'NOAA', 'USER', 'SYSTEM'
    affected_areas GEOGRAPHY(POLYGON, 4326),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency resources table (for future emergency features)
CREATE TABLE IF NOT EXISTS emergency_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'SHELTER', 'HOSPITAL', 'FIRE_STATION', 'POLICE'
    address VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_county VARCHAR(100),
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

-- Notifications table (for future notification features)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50) NOT NULL, -- 'POST', 'COMMENT', 'REACTION', 'WEATHER', 'EMERGENCY'
    related_post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    related_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    related_alert_id INTEGER REFERENCES weather_alerts(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(location_city, address_state);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type_priority ON posts(post_type, priority);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_location ON weather_alerts USING GIST (affected_areas);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_city ON weather_alerts(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_location ON emergency_resources USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_city ON emergency_resources(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Function to get nearby posts based on user location and preferences
CREATE OR REPLACE FUNCTION get_nearby_posts(
    user_latitude DECIMAL,
    user_longitude DECIMAL,
    user_city VARCHAR DEFAULT NULL,
    user_state VARCHAR DEFAULT NULL,
    radius_miles DECIMAL DEFAULT 10.0,
    city_only BOOLEAN DEFAULT FALSE,
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
    distance_miles DECIMAL,
    author_first_name VARCHAR,
    author_last_name VARCHAR,
    author_profile_image VARCHAR
) AS $$
BEGIN
    IF city_only AND user_city IS NOT NULL THEN
        -- Return only posts from the same city
        RETURN QUERY
        SELECT 
            p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
            p.location_city, p.location_state, p.images, p.tags,
            p.is_emergency, p.is_resolved, p.created_at, p.updated_at,
            CASE 
                WHEN p.location IS NOT NULL THEN
                    ST_Distance(p.location::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69
                ELSE 0
            END as distance_miles,
            u.first_name, u.last_name, u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.location_city = user_city 
          AND p.location_state = user_state
          AND (p.expires_at IS NULL OR p.expires_at > NOW())
        ORDER BY 
            CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
            CASE p.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'normal' THEN 3 
                WHEN 'low' THEN 4 
            END,
            p.created_at DESC
        LIMIT post_limit OFFSET post_offset;
    ELSE
        -- Return posts within radius
        RETURN QUERY
        SELECT 
            p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
            p.location_city, p.location_state, p.images, p.tags,
            p.is_emergency, p.is_resolved, p.created_at, p.updated_at,
            ST_Distance(p.location::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69 as distance_miles,
            u.first_name, u.last_name, u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.location IS NOT NULL
          AND ST_DWithin(
            p.location::geometry,
            ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326),
            radius_miles / 69.0
          )
          AND (p.expires_at IS NULL OR p.expires_at > NOW())
        ORDER BY 
            CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
            CASE p.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'normal' THEN 3 
                WHEN 'low' THEN 4 
            END,
            distance_miles ASC,
            p.created_at DESC
        LIMIT post_limit OFFSET post_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get weather alerts for a location
CREATE OR REPLACE FUNCTION get_weather_alerts_for_location(
    user_latitude DECIMAL,
    user_longitude DECIMAL,
    radius_miles DECIMAL DEFAULT 25.0
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
    created_at TIMESTAMP WITH TIME ZONE,
    distance_miles DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id, wa.alert_id, wa.title, wa.description, wa.severity,
        wa.alert_type, wa.source, wa.start_time, wa.end_time,
        wa.is_active, wa.created_at,
        CASE 
            WHEN wa.affected_areas IS NOT NULL THEN
                ST_Distance(wa.affected_areas::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69
            ELSE 0
        END as distance_miles
    FROM weather_alerts wa
    WHERE wa.is_active = true
      AND (wa.end_time IS NULL OR wa.end_time > NOW())
      AND (
        wa.affected_areas IS NULL OR
        ST_DWithin(
          wa.affected_areas::geometry,
          ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326),
          radius_miles / 69.0
        )
      )
    ORDER BY 
        CASE wa.severity 
            WHEN 'CRITICAL' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'MODERATE' THEN 3 
            WHEN 'LOW' THEN 4 
        END,
        distance_miles ASC,
        wa.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weather_alerts_updated_at ON weather_alerts;
CREATE TRIGGER update_weather_alerts_updated_at BEFORE UPDATE ON weather_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_resources_updated_at ON emergency_resources;
CREATE TRIGGER update_emergency_resources_updated_at BEFORE UPDATE ON emergency_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();