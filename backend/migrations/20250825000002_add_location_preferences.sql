-- Migration: Add location preferences and home address fields

-- Add new location fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_state VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8);

-- Add location preferences fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_permissions JSONB DEFAULT '{}';

-- Create indexes for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_users_home_location ON users(home_latitude, home_longitude) WHERE home_latitude IS NOT NULL AND home_longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_home_city_state ON users(home_city, home_state) WHERE home_city IS NOT NULL AND home_state IS NOT NULL;

-- Update existing users to have default location preferences
UPDATE users SET location_preferences = '{
  "useCurrentLocationForWeather": true,
  "useCurrentLocationForAlerts": true,
  "allowBackgroundLocation": false,
  "shareLocationInPosts": true
}'::jsonb WHERE location_preferences = '{}'::jsonb OR location_preferences IS NULL;

UPDATE users SET location_permissions = '{
  "foreground": "undetermined",
  "background": "undetermined",
  "lastUpdated": null
}'::jsonb WHERE location_permissions = '{}'::jsonb OR location_permissions IS NULL;