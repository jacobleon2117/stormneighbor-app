-- Migration: Add Foreign Key Indexes
-- This migration adds missing indexes on foreign key columns to improve JOIN performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- 1. comment_reports foreign keys
CREATE INDEX IF NOT EXISTS idx_comment_reports_reporter_id
    ON comment_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_comment_reports_reviewed_by
    ON comment_reports(reviewed_by);

-- 2. conversations foreign keys
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id
    ON conversations(last_message_id);

-- 3. emergency_resources foreign keys
-- Note: This was in our previous migration but may not have been applied
CREATE INDEX IF NOT EXISTS idx_emergency_resources_created_by
    ON emergency_resources(created_by);

-- 4. moderation_queue foreign keys
CREATE INDEX IF NOT EXISTS idx_moderation_queue_reporter_id
    ON moderation_queue(reporter_id);

-- 5. notification_campaigns foreign keys
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_by
    ON notification_campaigns(created_by);

-- 6. notifications foreign keys
-- Note: related_alert_id was in our previous migration but may not have been applied
CREATE INDEX IF NOT EXISTS idx_notifications_related_alert_id
    ON notifications(related_alert_id);

CREATE INDEX IF NOT EXISTS idx_notifications_related_comment_id
    ON notifications(related_comment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_related_post_id
    ON notifications(related_post_id);

CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id
    ON notifications(related_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_template_key
    ON notifications(template_key);

-- 7. post_reports foreign keys
CREATE INDEX IF NOT EXISTS idx_post_reports_reported_by
    ON post_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_post_reports_reviewed_by
    ON post_reports(reviewed_by);

-- 8. system_settings foreign keys
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by
    ON system_settings(updated_by);

-- 9. user_admin_roles foreign keys
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_assigned_by
    ON user_admin_roles(assigned_by);

-- 10. weather_alerts foreign keys
-- Note: This was in our previous migration but may not have been applied
CREATE INDEX IF NOT EXISTS idx_weather_alerts_created_by
    ON weather_alerts(created_by);

-- Migration 006 complete: All foreign keys now have covering indexes
