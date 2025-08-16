INSERT INTO
    admin_roles (
        name,
        display_name,
        description,
        permissions,
        is_active
    )
VALUES (
        'backup_admin',
        'Backup Administrator',
        'Full access to database backup and restore operations',
        '{
    "backups": ["create", "read", "download", "delete", "restore", "test"],
    "system": ["read"],
    "users": ["read"]
  }',
        true
    ) ON CONFLICT (name) DO
UPDATE
SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO
    admin_roles (
        name,
        display_name,
        description,
        permissions,
        is_active
    )
VALUES (
        'backup_operator',
        'Backup Operator',
        'Can create and download backups but cannot restore or delete',
        '{
    "backups": ["create", "read", "download", "test"],
    "system": ["read"]
  }',
        true
    ) ON CONFLICT (name) DO
UPDATE
SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    updated_at = NOW();

UPDATE admin_roles
SET
    permissions = permissions || '{"backups": ["create", "read", "download", "delete", "restore", "test"]}'
WHERE
    name = 'super_admin';

CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    remote_uploaded BOOLEAN DEFAULT FALSE,
    remote_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON backup_logs (backup_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_logs_success ON backup_logs (success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_logs_created_by ON backup_logs (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_logs_date ON backup_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS backup_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

INSERT INTO
    backup_settings (
        setting_key,
        setting_value,
        description
    )
VALUES (
        'retention_policy',
        '{"daily": 7, "weekly": 4, "monthly": 12}',
        'Backup retention policy in days/weeks/months'
    ),
    (
        'notification_settings',
        '{"email_on_failure": true, "email_on_success": false}',
        'Backup notification preferences'
    ),
    (
        'compression_settings',
        '{"enabled": true, "level": 9}',
        'Backup compression configuration'
    ),
    (
        'schedule_settings',
        '{"daily": "0 2 * * *", "weekly": "0 3 * * 0", "monthly": "0 4 1 * *"}',
        'Backup schedule cron expressions'
    ) ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION log_backup_operation(
    p_backup_type VARCHAR,
    p_filename VARCHAR,
    p_file_size BIGINT,
    p_duration_ms INTEGER,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_created_by INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO backup_logs (
        backup_type, filename, file_size, duration_ms, 
        success, error_message, created_by, metadata
    ) VALUES (
        p_backup_type, p_filename, p_file_size, p_duration_ms,
        p_success, p_error_message, p_created_by, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_backup_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backup_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_backup_statistics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_backups', COUNT(*),
        'successful_backups', COUNT(*) FILTER (WHERE success = true),
        'failed_backups', COUNT(*) FILTER (WHERE success = false),
        'total_size_bytes', COALESCE(SUM(file_size), 0),
        'avg_duration_ms', COALESCE(AVG(duration_ms), 0),
        'backup_types', json_object_agg(backup_type, type_count),
        'date_range', json_build_object(
            'start_date', MIN(created_at),
            'end_date', MAX(created_at)
        )
    )
    FROM (
        SELECT 
            backup_type,
            COUNT(*) as type_count,
            created_at,
            success,
            file_size,
            duration_ms
        FROM backup_logs 
        WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
        GROUP BY backup_type, created_at, success, file_size, duration_ms
    ) bl
    INTO stats;
    
    RETURN COALESCE(stats, '{"error": "No backup data found"}'::json);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_backup_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backup_settings_updated_at
    BEFORE UPDATE ON backup_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_settings_updated_at();

COMMENT ON
TABLE backup_logs IS 'Audit log for all backup operations';

COMMENT ON
TABLE backup_settings IS 'Configurable backup system settings';

COMMENT ON FUNCTION log_backup_operation IS 'Logs backup operations for audit trail';

COMMENT ON FUNCTION cleanup_backup_logs IS 'Removes old backup logs based on retention policy';

COMMENT ON FUNCTION get_backup_statistics IS 'Returns backup statistics for monitoring dashboard';