-- Updated schema.sql - Location-based communities instead of fixed neighborhoods

-- Drop old neighborhood-based foreign keys first
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_neighborhood;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_neighborhood_id_fkey;
ALTER TABLE weather_alerts DROP CONSTRAINT IF EXISTS weather_alerts_neighborhood_id_fkey;
ALTER TABLE emergency_resources DROP CONSTRAINT IF EXISTS emergency_resources_neighborhood_id_fkey;

-- Users table - Enhanced location data
ALTER TABLE users 
  DROP COLUMN IF EXISTS neighborhood_id,
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_county VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_radius_miles DECIMAL(4,1) DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS show_city_only BOOLEAN DEFAULT FALSE;

-- Update users table structure
CREATE TABLE IF NOT EXISTS users_new (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    location GEOGRAPHY(POINT, 4326),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(10),
    location_city VARCHAR(100), -- Normalized city name
    location_county VARCHAR(100), -- County for broader area
    location_radius_miles DECIMAL(4,1) DEFAULT 10.0, -- User's preferred radius
    show_city_only BOOLEAN DEFAULT FALSE, -- True = city only, False = use radius
    profile_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    skills TEXT[],
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data if users table exists
INSERT INTO users_new SELECT 
    id, email, password_hash, first_name, last_name, phone, location,
    address_street, address_city, address_state, address_zip,
    address_city as location_city, -- Use address_city as location_city
    NULL as location_county,
    10.0 as location_radius_miles,
    FALSE as show_city_only,
    profile_image_url, is_verified, emergency_contact_name, emergency_contact_phone,
    skills, preferences, created_at, updated_at
FROM users 
ON CONFLICT (id) DO NOTHING;

-- Replace old users table
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_new RENAME TO users;

-- Remove neighborhoods table since we're not using fixed neighborhoods
DROP TABLE IF EXISTS neighborhoods CASCADE;

-- Posts table - Location-based instead of neighborhood-based
ALTER TABLE posts 
  DROP COLUMN IF EXISTS neighborhood_id,
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS location_county VARCHAR(100);

-- Update posts table structure  
CREATE TABLE IF NOT EXISTS posts_new (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    post_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    location GEOGRAPHY(POINT, 4326),
    location_city VARCHAR(100), -- City where post was made
    location_state VARCHAR(50), -- State
    location_county VARCHAR(100), -- County for broader queries
    images TEXT[],
    tags TEXT[],
    is_emergency BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy existing posts data
INSERT INTO posts_new SELECT 
    id, user_id, title, content, post_type, priority, location,
    NULL as location_city, NULL as location_state, NULL as location_county,
    images, tags, is_emergency, is_resolved, expires_at, metadata, created_at, updated_at
FROM posts 
ON CONFLICT (id) DO NOTHING;

-- Replace posts table
DROP TABLE IF EXISTS posts CASCADE;
ALTER TABLE posts_new RENAME TO posts;

-- Weather alerts table - Location-based
ALTER TABLE weather_alerts 
  DROP COLUMN IF EXISTS neighborhood_id,
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS location_county VARCHAR(100);

-- Emergency resources table - Location-based  
ALTER TABLE emergency_resources 
  DROP COLUMN IF EXISTS neighborhood_id,
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS location_county VARCHAR(100);

-- Create indexes for geographic queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type_priority ON posts(post_type, priority);
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

DROP TRIGGER IF EXISTS update_weather_alerts_updated_at ON weather_alerts;
CREATE TRIGGER update_weather_alerts_updated_at BEFORE UPDATE ON weather_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_resources_updated_at ON emergency_resources;
CREATE TRIGGER update_emergency_resources_updated_at BEFORE UPDATE ON emergency_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();