-- Add testing user flag for beta testers
ALTER TABLE users ADD COLUMN is_testing_user BOOLEAN NOT NULL DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_testing_user ON users(is_testing_user);

-- Add API rate limit settings for testing users
ALTER TABLE users ADD COLUMN api_rate_limit INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN daily_api_calls INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_api_reset DATE;

-- Create index for API rate limiting
CREATE INDEX IF NOT EXISTS idx_users_api_rate_limit ON users(api_rate_limit);
CREATE INDEX IF NOT EXISTS idx_users_last_api_reset ON users(last_api_reset);