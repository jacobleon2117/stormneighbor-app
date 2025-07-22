-- Database Schema for Weather Neighborhood App
-- Run this to create all your tables

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for lat/lng
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(10),
    neighborhood_id INTEGER REFERENCES neighborhoods(id),
    profile_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    skills TEXT[], -- Array of skills they can offer (generator, medical, etc.)
    preferences JSONB DEFAULT '{}', -- Notification preferences, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Neighborhoods table
CREATE TABLE neighborhoods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10),
    boundary GEOGRAPHY(POLYGON, 4326), -- PostGIS polygon for neighborhood boundary
    center_point GEOGRAPHY(POINT, 4326), -- Center of neighborhood
    radius_miles DECIMAL(5,2) DEFAULT 1.0, -- Default 1 mile radius
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather alerts table (from NOAA and user-generated)
CREATE TABLE weather_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100), -- NOAA alert ID if from external source
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- CRITICAL, HIGH, MODERATE, LOW
    alert_type VARCHAR(100) NOT NULL, -- tornado, thunderstorm, flood, etc.
    source VARCHAR(50) NOT NULL DEFAULT 'NOAA', -- NOAA, USER, COMMUNITY
    affected_areas GEOGRAPHY(MULTIPOLYGON, 4326), -- Geographic areas affected
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    neighborhood_id INTEGER REFERENCES neighborhoods(id),
    metadata JSONB DEFAULT '{}', -- Additional data from NOAA or user input
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (community updates, help requests, etc.)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
    title VARCHAR(255),
    content TEXT NOT NULL,
    post_type VARCHAR(50) NOT NULL, -- safety_alert, help_request, help_offer, general, weather_update
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, high, normal, low
    location GEOGRAPHY(POINT, 4326), -- Specific location if relevant
    images TEXT[], -- Array of image URLs
    tags TEXT[], -- Array of tags for categorization
    is_emergency BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-sensitive posts
    metadata JSONB DEFAULT '{}', -- Flexible data storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments on posts
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES comments(id), -- For threaded comments
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions to posts (likes, helpful, etc.)
CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- like, love, helpful, concerned, angry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only react once per post/comment
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    -- Ensure reaction is either to post or comment, not both
    CHECK ((post_id IS NOT NULL) <> (comment_id IS NOT NULL))
);

-- Emergency contacts and resources
CREATE TABLE emergency_resources (
    id SERIAL PRIMARY KEY,
    neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
    resource_type VARCHAR(50) NOT NULL, -- shelter, medical, food, generator, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    location GEOGRAPHY(POINT, 4326),
    is_available BOOLEAN DEFAULT TRUE,
    capacity INTEGER, -- How many people/items available
    hours_available VARCHAR(100), -- "24/7", "9am-5pm", etc.
    requirements TEXT, -- Any requirements or restrictions
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications for users
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- weather_alert, post_reply, emergency, etc.
    related_id INTEGER, -- ID of related post, alert, etc.
    related_type VARCHAR(50), -- post, alert, comment, etc.
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE, -- For tracking push notifications
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, high, normal, low
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST (boundary);
CREATE INDEX idx_neighborhoods_center ON neighborhoods USING GIST (center_point);
CREATE INDEX idx_weather_alerts_areas ON weather_alerts USING GIST (affected_areas);
CREATE INDEX idx_posts_location ON posts USING GIST (location);
CREATE INDEX idx_posts_neighborhood ON posts(neighborhood_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_type_priority ON posts(post_type, priority);
CREATE INDEX idx_emergency_resources_location ON emergency_resources USING GIST (location);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Add foreign key constraint after neighborhoods table exists
ALTER TABLE users ADD CONSTRAINT fk_users_neighborhood 
    FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weather_alerts_updated_at BEFORE UPDATE ON weather_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_resources_updated_at BEFORE UPDATE ON emergency_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();