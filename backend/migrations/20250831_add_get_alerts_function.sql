-- Migration: Add get_alerts_by_location function and missing moderation_queue table
-- Date: 2025-08-31

-- Add moderation_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS moderation_queue (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'user'
    content_id INTEGER NOT NULL,
    reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_reason VARCHAR(100) NOT NULL,
    report_description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderator_notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content ON moderation_queue(content_type, content_id);

-- Create the get_alerts_by_location function
CREATE OR REPLACE FUNCTION get_alerts_by_location(
    p_city VARCHAR(100),
    p_state VARCHAR(50)
)
RETURNS TABLE (
    id INTEGER,
    alert_id VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    severity VARCHAR(50),
    alert_type VARCHAR(100),
    source VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    metadata JSONB
) AS $$
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
        wa.start_time,
        wa.end_time,
        wa.is_active,
        wa.created_at,
        wa.location_city,
        wa.location_state,
        wa.metadata
    FROM weather_alerts wa
    WHERE wa.location_city ILIKE p_city
        AND wa.location_state ILIKE p_state
        AND wa.is_active = true
        AND (wa.end_time IS NULL OR wa.end_time > NOW())
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
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_alerts_by_location(VARCHAR, VARCHAR) IS 
'Returns active weather alerts for a specific city and state, ordered by severity and creation date';