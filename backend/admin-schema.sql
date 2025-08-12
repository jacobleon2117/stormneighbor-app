-- File: backend/admin-schema.sql

-- Admin roles definition
CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User admin role assignments
CREATE TABLE IF NOT EXISTS user_admin_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    UNIQUE(user_id, role_id)
);

-- Admin action audit log
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'general',
    display_name VARCHAR(200),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin sessions (enhanced security for admin access)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(512) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    permissions JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL,
    content_id INTEGER NOT NULL,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    moderator_notes TEXT,
    action_taken VARCHAR(50),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily analytics snapshots for faster dashboard loading
CREATE TABLE IF NOT EXISTS daily_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    new_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    new_comments INTEGER DEFAULT 0,
    total_reactions INTEGER DEFAULT 0,
    new_reactions INTEGER DEFAULT 0,
    total_reports INTEGER DEFAULT 0,
    new_reports INTEGER DEFAULT 0,
    emergency_posts INTEGER DEFAULT 0,
    posts_by_type JSONB DEFAULT '{}',
    top_cities JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin roles and permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_user ON user_admin_roles(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_role ON user_admin_roles(role_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_expires ON user_admin_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Admin actions indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_date ON admin_actions(created_at DESC);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public) WHERE is_public = TRUE;

-- Admin sessions indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content ON moderation_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_moderator ON moderation_queue(moderator_id, status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- Insert default admin roles
INSERT INTO admin_roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', '{
    "users": ["read", "write", "delete", "ban", "admin"],
    "content": ["read", "write", "delete", "moderate", "feature"],
    "analytics": ["read", "export"],
    "system": ["read", "write", "maintenance", "settings"],
    "admin": ["read", "write", "assign_roles"],
    "security": ["read", "audit"]
}'),
('moderator', 'Content Moderator', 'Content moderation and user management', '{
    "users": ["read", "suspend", "warn"],
    "content": ["read", "moderate", "delete", "feature"],
    "analytics": ["read"],
    "system": ["read"],
    "security": ["read"]
}'),
('support', 'Support Staff', 'User support and basic analytics', '{
    "users": ["read", "contact"],
    "content": ["read"],
    "analytics": ["read"],
    "system": ["read"]
}'),
('analyst', 'Data Analyst', 'Analytics and reporting access', '{
    "users": ["read"],
    "content": ["read"],
    "analytics": ["read", "export"],
    "system": ["read"]
}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, display_name, description, is_public) VALUES
('maintenance_mode', 'false', 'system', 'Maintenance Mode', 'Enable maintenance mode to prevent user access', FALSE),
('allow_registrations', 'true', 'users', 'Allow New Registrations', 'Allow new users to register accounts', TRUE),
('max_posts_per_day', '10', 'content', 'Maximum Posts Per Day', 'Maximum posts a user can create per day', FALSE),
('auto_moderation', 'false', 'moderation', 'Auto Moderation', 'Enable automatic content moderation', FALSE),
('emergency_alert_threshold', '5', 'alerts', 'Emergency Alert Threshold', 'Number of emergency posts to trigger area alert', FALSE),
('user_verification_required', 'true', 'users', 'Email Verification Required', 'Require email verification for new accounts', TRUE),
('content_reporting_enabled', 'true', 'moderation', 'Content Reporting', 'Allow users to report inappropriate content', TRUE),
('analytics_retention_days', '365', 'analytics', 'Analytics Retention', 'Number of days to keep detailed analytics data', FALSE),
('session_timeout_hours', '24', 'security', 'Session Timeout', 'Hours before user sessions expire', FALSE),
('api_rate_limit_per_hour', '1000', 'security', 'API Rate Limit', 'Maximum API requests per user per hour', FALSE)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Function to get user admin permissions
CREATE OR REPLACE FUNCTION get_user_admin_permissions(user_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB := '{}';
    role_record RECORD;
BEGIN
    FOR role_record IN
        SELECT ar.permissions
        FROM user_admin_roles uar
        JOIN admin_roles ar ON uar.role_id = ar.id
        WHERE uar.user_id = user_id_param 
        AND uar.is_active = true
        AND ar.is_active = true
        AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
    LOOP
        user_permissions := user_permissions || role_record.permissions;
    END LOOP;
    
    RETURN user_permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param INTEGER, resource_param VARCHAR, action_param VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    permissions JSONB;
    resource_permissions JSONB;
BEGIN
    permissions := get_user_admin_permissions(user_id_param);
    
    IF permissions IS NULL OR permissions = '{}' THEN
        RETURN FALSE;
    END IF;
    
    resource_permissions := permissions->resource_param;
    
    IF resource_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN resource_permissions ? action_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
DECLARE
    analytics_data RECORD;
BEGIN
    SELECT 
        -- User stats
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) <= target_date) as total_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = target_date) as new_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions 
         WHERE DATE(last_used_at) = target_date AND is_active = true) as active_users,
        
        -- Post stats
        (SELECT COUNT(*) FROM posts WHERE DATE(created_at) <= target_date) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = target_date) as new_posts,
        (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = target_date AND is_emergency = true) as emergency_posts,
        
        -- Comment stats
        (SELECT COUNT(*) FROM comments WHERE DATE(created_at) <= target_date) as total_comments,
        (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = target_date) as new_comments,
        
        -- Reaction stats
        (SELECT COUNT(*) FROM reactions WHERE DATE(created_at) <= target_date) as total_reactions,
        (SELECT COUNT(*) FROM reactions WHERE DATE(created_at) = target_date) as new_reactions,
        
        -- Report stats
        (SELECT COUNT(*) FROM post_reports WHERE DATE(created_at) <= target_date) +
        (SELECT COUNT(*) FROM comment_reports WHERE DATE(created_at) <= target_date) as total_reports,
        (SELECT COUNT(*) FROM post_reports WHERE DATE(created_at) = target_date) +
        (SELECT COUNT(*) FROM comment_reports WHERE DATE(created_at) = target_date) as new_reports,
        
        -- Posts by type
        (SELECT jsonb_object_agg(post_type, post_count) 
         FROM (SELECT post_type, COUNT(*) as post_count 
               FROM posts WHERE DATE(created_at) = target_date 
               GROUP BY post_type) pt) as posts_by_type,
        
        -- Top cities
        (SELECT jsonb_object_agg(location_city, user_count) 
         FROM (SELECT location_city, COUNT(*) as user_count 
               FROM users WHERE location_city IS NOT NULL 
               GROUP BY location_city ORDER BY user_count DESC LIMIT 10) tc) as top_cities
    INTO analytics_data;
    
    -- Insert or update the analytics record
    INSERT INTO daily_analytics (
        date, total_users, new_users, active_users,
        total_posts, new_posts, emergency_posts,
        total_comments, new_comments,
        total_reactions, new_reactions,
        total_reports, new_reports,
        posts_by_type, top_cities
    ) VALUES (
        target_date, analytics_data.total_users, analytics_data.new_users, analytics_data.active_users,
        analytics_data.total_posts, analytics_data.new_posts, analytics_data.emergency_posts,
        analytics_data.total_comments, analytics_data.new_comments,
        analytics_data.total_reactions, analytics_data.new_reactions,
        analytics_data.total_reports, analytics_data.new_reports,
        COALESCE(analytics_data.posts_by_type, '{}'), COALESCE(analytics_data.top_cities, '{}')
    ) ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        new_users = EXCLUDED.new_users,
        active_users = EXCLUDED.active_users,
        total_posts = EXCLUDED.total_posts,
        new_posts = EXCLUDED.new_posts,
        emergency_posts = EXCLUDED.emergency_posts,
        total_comments = EXCLUDED.total_comments,
        new_comments = EXCLUDED.new_comments,
        total_reactions = EXCLUDED.total_reactions,
        new_reactions = EXCLUDED.new_reactions,
        total_reports = EXCLUDED.total_reports,
        new_reports = EXCLUDED.new_reports,
        posts_by_type = EXCLUDED.posts_by_type,
        top_cities = EXCLUDED.top_cities,
        generated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER trigger_moderation_queue_updated_at
    BEFORE UPDATE ON moderation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin schema setup completed successfully!';
    RAISE NOTICE 'Created admin roles: super_admin, moderator, support, analyst';
    RAISE NOTICE 'Use the following query to assign admin role to a user:';
    RAISE NOTICE 'INSERT INTO user_admin_roles (user_id, role_id) VALUES (YOUR_USER_ID, (SELECT id FROM admin_roles WHERE name = ''super_admin''));';
END
$$;