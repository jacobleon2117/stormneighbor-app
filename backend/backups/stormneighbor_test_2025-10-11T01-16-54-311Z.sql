-- Database Backup
-- Created: 2025-10-11T01:16:54.358Z
-- Type: test
-- Database: postgres

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- Table: admin_actions

CREATE TABLE IF NOT EXISTS "admin_actions" ("id" INTEGER NOT NULL DEFAULT nextval('admin_actions_id_seq'::regclass), "admin_id" INTEGER NOT NULL, "action_type" VARCHAR(100) NOT NULL, "target_type" VARCHAR(50) NOT NULL, "target_id" INTEGER, "details" JSONB DEFAULT '{}'::jsonb, "ip_address" INET, "user_agent" TEXT, "success" BOOLEAN DEFAULT true, "error_message" TEXT, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: admin_roles

CREATE TABLE IF NOT EXISTS "admin_roles" ("id" INTEGER NOT NULL DEFAULT nextval('admin_roles_id_seq'::regclass), "name" VARCHAR(50) NOT NULL, "display_name" VARCHAR(100) NOT NULL, "description" TEXT, "permissions" JSONB DEFAULT '{}'::jsonb, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "admin_roles" ("id", "name", "display_name", "description", "permissions", "is_active", "created_at", "updated_at") VALUES
  (1, 'super_admin', 'Super Administrator', 'Full system access with all permissions', '{"admin":["read","write","assign_roles"],"users":["read","write","delete","ban","admin"],"system":["read","write","maintenance","settings"],"content":["read","write","delete","moderate","feature"],"security":["read","audit"],"analytics":["read","export"]}', TRUE, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (2, 'moderator', 'Content Moderator', 'Content moderation and user management', '{"users":["read","suspend","warn"],"system":["read"],"content":["read","moderate","delete","feature"],"security":["read"],"analytics":["read"]}', TRUE, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (3, 'support', 'Support Staff', 'User support and basic analytics', '{"users":["read","contact"],"system":["read"],"content":["read"],"analytics":["read"]}', TRUE, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (4, 'analyst', 'Data Analyst', 'Analytics and reporting access', '{"users":["read"],"system":["read"],"content":["read"],"analytics":["read","export"]}', TRUE, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z');



-- Table: admin_sessions

CREATE TABLE IF NOT EXISTS "admin_sessions" ("id" INTEGER NOT NULL DEFAULT nextval('admin_sessions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "session_token" VARCHAR(512) NOT NULL, "ip_address" INET, "user_agent" TEXT, "permissions" JSONB DEFAULT '{}'::jsonb, "last_activity" TIMESTAMP WITH TIME ZONE DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: comment_reports

CREATE TABLE IF NOT EXISTS "comment_reports" ("id" INTEGER NOT NULL DEFAULT nextval('comment_reports_id_seq'::regclass), "comment_id" INTEGER NOT NULL, "reporter_id" INTEGER NOT NULL, "reason" VARCHAR(50) NOT NULL, "status" VARCHAR(20) DEFAULT 'pending'::character varying, "reviewed_by" INTEGER, "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: comments

CREATE TABLE IF NOT EXISTS "comments" ("id" INTEGER NOT NULL DEFAULT nextval('comments_id_seq'::regclass), "post_id" INTEGER NOT NULL, "user_id" INTEGER NOT NULL, "content" TEXT NOT NULL, "parent_comment_id" INTEGER, "images" ARRAY, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "is_edited" BOOLEAN DEFAULT false);


INSERT INTO "comments" ("id", "post_id", "user_id", "content", "parent_comment_id", "images", "created_at", "updated_at", "is_edited") VALUES
  (1, 61, 47, 'Great post', NULL, NULL, '2025-09-28T00:24:34.503Z', '2025-09-28T00:24:34.503Z', FALSE),
  (2, 61, 47, 'This has a quote "', NULL, NULL, '2025-09-28T00:32:36.439Z', '2025-09-28T00:32:36.439Z', FALSE);



-- Table: conversations

CREATE TABLE IF NOT EXISTS "conversations" ("id" INTEGER NOT NULL DEFAULT nextval('conversations_id_seq'::regclass), "participant_1_id" INTEGER NOT NULL, "participant_2_id" INTEGER NOT NULL, "last_message_id" INTEGER, "last_message_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "participant_1_unread_count" INTEGER DEFAULT 0, "participant_2_unread_count" INTEGER DEFAULT 0, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: emergency_resources

CREATE TABLE IF NOT EXISTS "emergency_resources" ("id" INTEGER NOT NULL DEFAULT nextval('emergency_resources_id_seq'::regclass), "resource_type" VARCHAR(50) NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "contact_name" VARCHAR(100), "contact_phone" VARCHAR(20), "contact_email" VARCHAR(255), "address" TEXT, "location" USER-DEFINED, "is_available" BOOLEAN DEFAULT true, "capacity" INTEGER, "hours_available" VARCHAR(100), "requirements" TEXT, "created_by" INTEGER, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100));




-- Table: messages

CREATE TABLE IF NOT EXISTS "messages" ("id" INTEGER NOT NULL DEFAULT nextval('messages_id_seq'::regclass), "conversation_id" INTEGER NOT NULL, "sender_id" INTEGER NOT NULL, "recipient_id" INTEGER NOT NULL, "content" TEXT NOT NULL, "message_type" VARCHAR(20) DEFAULT 'text'::character varying, "images" ARRAY, "is_read" BOOLEAN DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, "is_edited" BOOLEAN DEFAULT false, "edited_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: migrations

CREATE TABLE IF NOT EXISTS "migrations" ("id" INTEGER NOT NULL DEFAULT nextval('migrations_id_seq'::regclass), "filename" VARCHAR(255) NOT NULL, "checksum" VARCHAR(64) NOT NULL, "executed_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "execution_time" INTEGER NOT NULL);


INSERT INTO "migrations" ("id", "filename", "checksum", "executed_at", "execution_time") VALUES
  (1, 'add_bio_to_users.sql', '0499d13816d0a513ac8df43738c2f48b4003c0e4868185ee85e09e930a698203', '2025-08-03T04:51:26.576Z', 77);



-- Table: moderation_queue

CREATE TABLE IF NOT EXISTS "moderation_queue" ("id" INTEGER NOT NULL DEFAULT nextval('moderation_queue_id_seq'::regclass), "content_type" VARCHAR(20) NOT NULL, "content_id" INTEGER NOT NULL, "reporter_id" INTEGER, "moderator_id" INTEGER, "status" VARCHAR(20) DEFAULT 'pending'::character varying, "priority" VARCHAR(20) DEFAULT 'normal'::character varying, "reason" VARCHAR(100) NOT NULL, "description" TEXT, "moderator_notes" TEXT, "action_taken" VARCHAR(50), "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: notification_campaigns

CREATE TABLE IF NOT EXISTS "notification_campaigns" ("id" INTEGER NOT NULL DEFAULT nextval('notification_campaigns_id_seq'::regclass), "name" VARCHAR(255) NOT NULL, "description" TEXT, "campaign_type" VARCHAR(50) NOT NULL, "status" VARCHAR(20) DEFAULT 'draft'::character varying, "target_type" VARCHAR(50) NOT NULL, "target_city" VARCHAR(100), "target_state" VARCHAR(50), "target_user_ids" ARRAY, "title" VARCHAR(255) NOT NULL, "message" TEXT NOT NULL, "action_url" VARCHAR(255), "image_url" VARCHAR(255), "send_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "sent_at" TIMESTAMP WITH TIME ZONE, "total_recipients" INTEGER DEFAULT 0, "successful_sends" INTEGER DEFAULT 0, "failed_sends" INTEGER DEFAULT 0, "created_by" INTEGER, "metadata" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: notification_preferences

CREATE TABLE IF NOT EXISTS "notification_preferences" ("id" INTEGER NOT NULL DEFAULT nextval('notification_preferences_id_seq'::regclass), "user_id" INTEGER NOT NULL, "push_enabled" BOOLEAN DEFAULT true, "emergency_alerts" BOOLEAN DEFAULT true, "new_messages" BOOLEAN DEFAULT true, "post_comments" BOOLEAN DEFAULT true, "post_reactions" BOOLEAN DEFAULT false, "neighborhood_posts" BOOLEAN DEFAULT true, "weather_alerts" BOOLEAN DEFAULT true, "community_updates" BOOLEAN DEFAULT true, "quiet_hours_enabled" BOOLEAN DEFAULT false, "quiet_hours_start" TIME WITHOUT TIME ZONE DEFAULT '22:00:00'::time without time zone, "quiet_hours_end" TIME WITHOUT TIME ZONE DEFAULT '08:00:00'::time without time zone, "timezone" VARCHAR(50) DEFAULT 'America/Chicago'::character varying, "digest_frequency" VARCHAR(20) DEFAULT 'daily'::character varying, "max_notifications_per_hour" INTEGER DEFAULT 10, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: notification_templates

CREATE TABLE IF NOT EXISTS "notification_templates" ("id" INTEGER NOT NULL DEFAULT nextval('notification_templates_id_seq'::regclass), "template_key" VARCHAR(100) NOT NULL, "title_template" VARCHAR(255) NOT NULL, "body_template" TEXT NOT NULL, "action_url" VARCHAR(255), "icon" VARCHAR(255), "sound" VARCHAR(50) DEFAULT 'default'::character varying, "priority" VARCHAR(20) DEFAULT 'normal'::character varying, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "notification_templates" ("id", "template_key", "title_template", "body_template", "action_url", "icon", "sound", "priority", "is_active", "created_at", "updated_at") VALUES
  (1, 'new_message', 'New message from {sender_name}', '{sender_name}: {message_preview}', '/messages/{conversation_id}', NULL, 'default', 'high', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (2, 'post_comment', 'New comment on your post', '{commenter_name} commented: {comment_preview}', '/posts/{post_id}', NULL, 'default', 'normal', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (3, 'post_reaction', '{reactor_name} reacted to your post', '{reaction_type} on "{post_title}"', '/posts/{post_id}', NULL, 'default', 'low', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (4, 'emergency_alert', 'Emergency Alert: {alert_type}', '{alert_description}', '/alerts/{alert_id}', NULL, 'default', 'high', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (5, 'weather_alert', 'Weather Alert for {city}', '{severity}: {alert_title}', '/weather/alerts', NULL, 'default', 'high', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (6, 'neighborhood_post', 'New post in {city}', '{author_name}: {post_preview}', '/posts/{post_id}', NULL, 'default', 'normal', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (7, 'welcome', 'Welcome to StormNeighbor!', 'Get started by completing your profile and connecting with neighbors', '/profile', NULL, 'default', 'normal', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (8, 'verification_reminder', 'Please verify your email', 'Verify your email to access all StormNeighbor features', '/verify-email', NULL, 'default', 'normal', TRUE, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (17, 'new_post', 'New Post in Your Area', 'There''s a new {{post_type}} post near you: {{title}}', NULL, NULL, 'default', 'normal', TRUE, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (20, 'comment_reply', 'Someone Replied', '{{author}} replied to your comment', NULL, NULL, 'default', 'normal', TRUE, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (22, 'comment_reported', 'Content Reported', 'A comment has been reported and needs review', NULL, NULL, 'default', 'normal', TRUE, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (23, 'post_reported', 'Post Reported', 'A post has been reported and needs review', NULL, NULL, 'default', 'normal', TRUE, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (24, 'new_follower', 'New Follower', '{{follower_name}} started following you', NULL, NULL, 'default', 'normal', TRUE, '2025-08-17T02:27:29.692Z', '2025-08-17T02:27:29.692Z');



-- Table: notifications

CREATE TABLE IF NOT EXISTS "notifications" ("id" INTEGER NOT NULL DEFAULT nextval('notifications_id_seq'::regclass), "user_id" INTEGER NOT NULL, "title" VARCHAR(255) NOT NULL, "message" TEXT NOT NULL, "notification_type" VARCHAR(50) NOT NULL, "template_key" VARCHAR(100), "related_post_id" INTEGER, "related_comment_id" INTEGER, "related_alert_id" INTEGER, "related_user_id" INTEGER, "push_sent" BOOLEAN DEFAULT false, "push_sent_at" TIMESTAMP WITH TIME ZONE, "push_delivery_status" VARCHAR(20), "push_error_message" TEXT, "fcm_message_id" VARCHAR(255), "is_read" BOOLEAN DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, "clicked" BOOLEAN DEFAULT false, "clicked_at" TIMESTAMP WITH TIME ZONE, "target_audience" VARCHAR(50) DEFAULT 'individual'::character varying, "target_city" VARCHAR(100), "target_state" VARCHAR(50), "metadata" JSONB DEFAULT '{}'::jsonb, "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: post_reports

CREATE TABLE IF NOT EXISTS "post_reports" ("id" INTEGER NOT NULL DEFAULT nextval('post_reports_id_seq'::regclass), "post_id" INTEGER NOT NULL, "reported_by" INTEGER NOT NULL, "report_reason" VARCHAR(100) NOT NULL, "report_description" TEXT, "status" VARCHAR(20) DEFAULT 'pending'::character varying, "reviewed_by" INTEGER, "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: posts

CREATE TABLE IF NOT EXISTS "posts" ("id" INTEGER NOT NULL DEFAULT nextval('posts_id_seq'::regclass), "user_id" INTEGER NOT NULL, "title" VARCHAR(255), "content" TEXT NOT NULL, "post_type" VARCHAR(50) NOT NULL, "priority" VARCHAR(20) DEFAULT 'normal'::character varying, "location" USER-DEFINED, "images" ARRAY, "tags" ARRAY, "is_emergency" BOOLEAN DEFAULT false, "is_resolved" BOOLEAN DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE, "metadata" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100), "latitude" NUMERIC, "longitude" NUMERIC, "is_active" BOOLEAN DEFAULT true);


INSERT INTO "posts" ("id", "user_id", "title", "content", "post_type", "priority", "location", "images", "tags", "is_emergency", "is_resolved", "expires_at", "metadata", "created_at", "updated_at", "location_city", "location_state", "location_county", "latitude", "longitude", "is_active") VALUES
  (61, 49, 'Test Post from User 1', 'This is a test post to see if posts work properly', 'general', 'normal', NULL, NULL, '["test","community"]', FALSE, FALSE, NULL, '{}', '2025-09-28T00:23:13.018Z', '2025-09-28T00:23:13.018Z', 'Nashville', 'TN', NULL, NULL, NULL, TRUE);



-- Table: reactions

CREATE TABLE IF NOT EXISTS "reactions" ("id" INTEGER NOT NULL DEFAULT nextval('reactions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "post_id" INTEGER, "comment_id" INTEGER, "reaction_type" VARCHAR(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "reactions" ("id", "user_id", "post_id", "comment_id", "reaction_type", "created_at") VALUES
  (17, 47, 61, NULL, 'like', '2025-09-28T00:25:08.927Z'),
  (18, 48, NULL, 1, 'like', '2025-10-06T00:21:12.950Z');



-- Table: saved_posts

CREATE TABLE IF NOT EXISTS "saved_posts" ("id" INTEGER NOT NULL DEFAULT nextval('saved_posts_id_seq'::regclass), "user_id" INTEGER NOT NULL, "post_id" INTEGER NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);




-- Table: saved_searches

CREATE TABLE IF NOT EXISTS "saved_searches" ("id" INTEGER NOT NULL DEFAULT nextval('saved_searches_id_seq'::regclass), "user_id" INTEGER NOT NULL, "name" VARCHAR(255) NOT NULL, "description" TEXT, "query_text" TEXT, "filters" JSONB DEFAULT '{}'::jsonb, "notify_new_results" BOOLEAN DEFAULT true, "notification_frequency" VARCHAR(20) DEFAULT 'immediate'::character varying, "last_notification_sent" TIMESTAMP WITH TIME ZONE, "total_results" INTEGER DEFAULT 0, "last_result_count" INTEGER DEFAULT 0, "last_executed" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: schema_migrations

CREATE TABLE IF NOT EXISTS "schema_migrations" ("id" INTEGER NOT NULL DEFAULT nextval('schema_migrations_id_seq'::regclass), "version" VARCHAR(20) NOT NULL, "name" VARCHAR(255) NOT NULL, "checksum" VARCHAR(64) NOT NULL, "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "execution_time_ms" INTEGER, "success" BOOLEAN DEFAULT true, "error_message" TEXT, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "schema_migrations" ("id", "version", "name", "checksum", "applied_at", "execution_time_ms", "success", "error_message", "created_at") VALUES
  (1, '20250817100000', 'create_test_table', '4d004bfadd38cab3467ec298ec8fcc04d959ebdf9fcea5eec692bc0aa33cf838', '2025-08-17T02:15:56.849Z', 89, TRUE, NULL, '2025-08-17T02:15:56.849Z'),
  (23, '20250927000001', 'add_last_used_to_user_sessions', '51ff6a7e8c11f256c845a3fdf4f4a9df4a604d859ee7a8503b6bc7d6ce777c78', '2025-09-27T23:44:43.752Z', 114, TRUE, NULL, '2025-09-27T23:44:43.752Z'),
  (24, '20250927000002', 'add_is_active_to_posts', '5ae05a41c9adc1a3d1b266417b7b2479e01af3a056267fce6f0f6259ead38392', '2025-09-27T23:53:19.529Z', 91, TRUE, NULL, '2025-09-27T23:53:19.529Z'),
  (8, '20250817022654', 'add_user_following_system', '9947f21c8de96215465a51630acc0c4d424998f20ddf6d1df63b0a966606735e', '2025-08-17T02:27:29.692Z', 98, TRUE, NULL, '2025-08-17T02:27:29.692Z'),
  (9, '20250817120000', 'initial_schema', 'c844e962ba151971e1b511cf222ed8b3568d151585f3848cf1e9c8695ecd6823', '2025-08-17T02:27:30.025Z', 156, FALSE, 'column "is_active" does not exist', '2025-08-17T02:27:30.025Z'),
  (19, '20250825000001', 'add_messaging_system', 'ea7ee92f49c878683336a54c2410705e2b4406daa287fb32c4549b265fa95935', '2025-09-08T11:03:40.238Z', 145, FALSE, 'constraint "fk_conversations_last_message" for relation "conversations" already exists', '2025-09-08T11:03:40.238Z'),
  (20, '20250825000002', 'add_location_preferences', '2673dc35455ae90344c1a15841c99b98f52ef7451b73fb3103c38955616ded26', '2025-09-26T12:56:58.698Z', 115, TRUE, NULL, '2025-09-26T12:56:58.698Z'),
  (21, '20250908000001', 'add_user_blocks_table', '8dc3ca18c58fe6467479c6010dbb4d5b8a712cbc659fd90e79a3c09b6b17aa14', '2025-09-26T12:56:58.890Z', 81, TRUE, NULL, '2025-09-26T12:56:58.890Z'),
  (22, '20250908000002', 'add_saved_posts_table', '3d86410a679801fab28a4a541cce7bdcb0ae2e3b3a4d7d031c3587e6ad5019ae', '2025-09-26T12:56:59.045Z', 75, TRUE, NULL, '2025-09-26T12:56:59.045Z');



-- Table: search_queries

CREATE TABLE IF NOT EXISTS "search_queries" ("id" INTEGER NOT NULL DEFAULT nextval('search_queries_id_seq'::regclass), "user_id" INTEGER, "query_text" TEXT NOT NULL, "filters" JSONB DEFAULT '{}'::jsonb, "results_count" INTEGER DEFAULT 0, "search_type" VARCHAR(50) DEFAULT 'general'::character varying, "source" VARCHAR(50) DEFAULT 'manual'::character varying, "search_city" VARCHAR(100), "search_state" VARCHAR(50), "execution_time_ms" INTEGER, "clicked_result_id" INTEGER, "clicked_result_type" VARCHAR(50), "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: search_suggestions

CREATE TABLE IF NOT EXISTS "search_suggestions" ("id" INTEGER NOT NULL DEFAULT nextval('search_suggestions_id_seq'::regclass), "suggestion_text" VARCHAR(255) NOT NULL, "suggestion_type" VARCHAR(50) NOT NULL, "category" VARCHAR(50), "search_count" INTEGER DEFAULT 1, "result_count" INTEGER DEFAULT 0, "click_through_rate" NUMERIC DEFAULT 0.0, "city" VARCHAR(100), "state" VARCHAR(50), "is_trending" BOOLEAN DEFAULT false, "is_approved" BOOLEAN DEFAULT true, "source" VARCHAR(50) DEFAULT 'user_generated'::character varying, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "search_suggestions" ("id", "suggestion_text", "suggestion_type", "category", "search_count", "result_count", "click_through_rate", "city", "state", "is_trending", "is_approved", "source", "created_at", "updated_at") VALUES
  (1, 'power outage', 'emergency', 'utility', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (2, 'road closure', 'infrastructure', 'traffic', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (3, 'severe weather', 'weather', 'alert', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (4, 'flooding', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (5, 'community event', 'general', 'social', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (6, 'lost pet', 'general', 'pets', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (7, 'neighborhood watch', 'safety', 'security', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (8, 'storm damage', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (9, 'tornado warning', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (10, 'evacuation', 'emergency', 'safety', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (11, 'volunteer needed', 'general', 'community', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (12, 'traffic accident', 'infrastructure', 'traffic', 1, 0, '0.00', NULL, NULL, FALSE, TRUE, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z');



-- Table: system_settings

CREATE TABLE IF NOT EXISTS "system_settings" ("id" INTEGER NOT NULL DEFAULT nextval('system_settings_id_seq'::regclass), "setting_key" VARCHAR(100) NOT NULL, "setting_value" JSONB NOT NULL, "setting_type" VARCHAR(50) DEFAULT 'general'::character varying, "display_name" VARCHAR(200), "description" TEXT, "is_public" BOOLEAN DEFAULT false, "updated_by" INTEGER, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "system_settings" ("id", "setting_key", "setting_value", "setting_type", "display_name", "description", "is_public", "updated_by", "created_at", "updated_at") VALUES
  (1, 'maintenance_mode', FALSE, 'system', 'Maintenance Mode', 'Enable maintenance mode to prevent user access', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (2, 'allow_registrations', TRUE, 'users', 'Allow New Registrations', 'Allow new users to register accounts', TRUE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (3, 'max_posts_per_day', 10, 'content', 'Maximum Posts Per Day', 'Maximum posts a user can create per day', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (4, 'auto_moderation', FALSE, 'moderation', 'Auto Moderation', 'Enable automatic content moderation', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (5, 'emergency_alert_threshold', 5, 'alerts', 'Emergency Alert Threshold', 'Number of emergency posts to trigger area alert', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (6, 'user_verification_required', TRUE, 'users', 'Email Verification Required', 'Require email verification for new accounts', TRUE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (7, 'content_reporting_enabled', TRUE, 'moderation', 'Content Reporting', 'Allow users to report inappropriate content', TRUE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (8, 'analytics_retention_days', 365, 'analytics', 'Analytics Retention', 'Number of days to keep detailed analytics data', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (9, 'session_timeout_hours', 24, 'security', 'Session Timeout', 'Hours before user sessions expire', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (10, 'api_rate_limit_per_hour', 1000, 'security', 'API Rate Limit', 'Maximum API requests per user per hour', FALSE, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z');



-- Table: user_admin_roles

CREATE TABLE IF NOT EXISTS "user_admin_roles" ("id" INTEGER NOT NULL DEFAULT nextval('user_admin_roles_id_seq'::regclass), "user_id" INTEGER NOT NULL, "role_id" INTEGER NOT NULL, "assigned_by" INTEGER, "assigned_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "notes" TEXT);




-- Table: user_blocks

CREATE TABLE IF NOT EXISTS "user_blocks" ("id" INTEGER NOT NULL DEFAULT nextval('user_blocks_id_seq'::regclass), "blocker_id" INTEGER NOT NULL, "blocked_id" INTEGER NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);




-- Table: user_devices

CREATE TABLE IF NOT EXISTS "user_devices" ("id" INTEGER NOT NULL DEFAULT nextval('user_devices_id_seq'::regclass), "user_id" INTEGER NOT NULL, "device_token" VARCHAR(255) NOT NULL, "device_type" VARCHAR(20) NOT NULL, "device_name" VARCHAR(100), "app_version" VARCHAR(20), "is_active" BOOLEAN DEFAULT true, "last_seen" TIMESTAMP WITH TIME ZONE DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: user_follows

CREATE TABLE IF NOT EXISTS "user_follows" ("id" INTEGER NOT NULL DEFAULT nextval('user_follows_id_seq'::regclass), "follower_id" INTEGER NOT NULL, "following_id" INTEGER NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());




-- Table: user_sessions

CREATE TABLE IF NOT EXISTS "user_sessions" ("id" INTEGER NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "refresh_token" VARCHAR(512) NOT NULL, "device_info" JSONB DEFAULT '{}'::jsonb, "device_fingerprint" VARCHAR(255), "ip_address" INET, "user_agent" TEXT, "is_active" BOOLEAN DEFAULT true, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_used_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_used" TIMESTAMP WITH TIME ZONE DEFAULT now());


INSERT INTO "user_sessions" ("id", "user_id", "refresh_token", "device_info", "device_fingerprint", "ip_address", "user_agent", "is_active", "expires_at", "created_at", "updated_at", "last_used_at", "last_used") VALUES
  (90, 47, 'b973901d6d36a5620f269cd9c6dbc9a5680d7356273f4e370310b8b9cf48dbc8', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:20:47.914Z', '2025-09-26T21:20:47.914Z', '2025-09-26T21:20:47.914Z', '2025-09-26T21:20:47.914Z', '2025-09-27T23:44:43.752Z'),
  (93, 47, '79396a83abda4ec969449f55ddf26a28300c383c51c055b569eac3da4a6ec297', '{"user-agent":"Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '644946c78aa7e602a24a20db9cbf2dfa198bc12ebd7652cf8bf64f332aac05b4', '192.168.1.219', NULL, TRUE, '2025-10-26T21:31:27.038Z', '2025-09-26T21:31:27.038Z', '2025-09-26T21:31:27.038Z', '2025-09-26T21:31:27.038Z', '2025-09-27T23:44:43.752Z'),
  (95, 47, '7ef451e09389b91681770f1eda2b931bc60a93514d8a8b604ae790b3e14045a9', '{"user-agent":"Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '644946c78aa7e602a24a20db9cbf2dfa198bc12ebd7652cf8bf64f332aac05b4', '192.168.1.205', NULL, TRUE, '2025-10-27T23:42:27.762Z', '2025-09-27T23:42:27.762Z', '2025-09-27T23:42:27.762Z', '2025-09-27T23:42:27.762Z', '2025-09-27T23:44:43.752Z'),
  (97, 47, 'e6ddec2f846160fac0c05e8d90ab24d5898534d52bb5bdda177fe5a04fcb411e', '{"user-agent":"Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '644946c78aa7e602a24a20db9cbf2dfa198bc12ebd7652cf8bf64f332aac05b4', '192.168.1.205', NULL, TRUE, '2025-10-27T23:57:48.730Z', '2025-09-27T23:57:48.730Z', '2025-09-28T00:02:16.966Z', '2025-09-27T23:57:48.730Z', '2025-09-28T00:02:16.966Z'),
  (99, 47, 'dfc12619b09d4003fa56b8f23cb8e817681228bcf879c547779052282101ee0a', '{"user-agent":"curl/8.7.1"}', 'e2c2bf1ba645e57ab55b8f301845a18a6862d2f4d34e372998c047ae4515bdd3', '127.0.0.1', NULL, TRUE, '2025-10-28T00:11:02.131Z', '2025-09-28T00:11:02.131Z', '2025-09-28T00:12:23.312Z', '2025-09-28T00:11:02.131Z', '2025-09-28T00:12:23.312Z'),
  (101, 47, '130acfa5844e64b623d4a446bfa99354d23acc5e5efd5f4c9a879dcb30d9a9f8', '{"user-agent":"curl/8.7.1"}', 'e2c2bf1ba645e57ab55b8f301845a18a6862d2f4d34e372998c047ae4515bdd3', '127.0.0.1', NULL, TRUE, '2025-10-28T00:23:34.254Z', '2025-09-28T00:23:34.254Z', '2025-09-28T00:23:34.254Z', '2025-09-28T00:23:34.254Z', '2025-09-28T00:23:34.254Z'),
  (88, 47, '3b1429f05e144e2721f2a41a4263b9aef7b35dc4aad6d3f5cf2c50b957e96edc', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:17:38.275Z', '2025-09-26T21:17:38.275Z', '2025-09-26T21:17:38.275Z', '2025-09-26T21:17:38.275Z', '2025-09-27T23:44:43.752Z'),
  (89, 47, '0123b2be0222caea175e2843156c21181f8e5d00a563c8b49d6c6b21f722ce3a', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:17:38.731Z', '2025-09-26T21:17:38.731Z', '2025-09-26T21:17:38.731Z', '2025-09-26T21:17:38.731Z', '2025-09-27T23:44:43.752Z'),
  (91, 48, 'c49f6027434c9ba7f845f539633e6925ca89d32ef8df2b19ad7f4346b3b0b7cc', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:21:26.529Z', '2025-09-26T21:21:26.529Z', '2025-09-26T21:21:26.529Z', '2025-09-26T21:21:26.529Z', '2025-09-27T23:44:43.752Z'),
  (92, 48, 'e6cfce6250f82f5b45f568fb35ebe5ecadce4d7e5a43b3b9d43180728e68a367', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:21:26.963Z', '2025-09-26T21:21:26.963Z', '2025-09-26T21:21:26.963Z', '2025-09-26T21:21:26.963Z', '2025-09-27T23:44:43.752Z'),
  (94, 47, '13ee3eb713ad39babe4af8db2ac021bcd240cc4515bffa43d7480881219a6db8', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-10-26T21:33:03.194Z', '2025-09-26T21:33:03.194Z', '2025-09-26T21:33:03.194Z', '2025-09-26T21:33:03.194Z', '2025-09-27T23:44:43.752Z'),
  (96, 47, 'ce7fefacfff2bd82639e417c2e2887c34f7decbc7b32d7c082a1cb93d89e5bad', '{"user-agent":"Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '644946c78aa7e602a24a20db9cbf2dfa198bc12ebd7652cf8bf64f332aac05b4', '192.168.1.205', NULL, TRUE, '2025-10-27T23:48:51.209Z', '2025-09-27T23:48:51.209Z', '2025-09-27T23:48:51.469Z', '2025-09-27T23:48:51.209Z', '2025-09-27T23:48:51.469Z'),
  (98, 47, 'aca5bb7db59942134589dc374b7c31cdb8309249fccfc31356c4ee8832e68140', '{"user-agent":"Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '644946c78aa7e602a24a20db9cbf2dfa198bc12ebd7652cf8bf64f332aac05b4', '192.168.1.205', NULL, TRUE, '2025-10-28T00:02:22.538Z', '2025-09-28T00:02:22.538Z', '2025-09-28T00:02:24.610Z', '2025-09-28T00:02:22.538Z', '2025-09-28T00:02:24.610Z'),
  (100, 49, '53b7fb07a7d9a9b07aee5abd93106cefecd1b9613b30a821ce32a0bc61785b2c', '{"user-agent":"curl/8.7.1"}', 'e2c2bf1ba645e57ab55b8f301845a18a6862d2f4d34e372998c047ae4515bdd3', '127.0.0.1', NULL, TRUE, '2025-10-28T00:19:55.340Z', '2025-09-28T00:19:55.340Z', '2025-09-28T00:21:30.314Z', '2025-09-28T00:19:55.340Z', '2025-09-28T00:21:30.314Z'),
  (102, 48, 'fdf593e80daf416ba5e099a2a74d81ae3f7cf10ca17422813b508f00a16b4fad', '{"user-agent":"Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0","accept-encoding":"gzip, deflate","accept-language":"en-US,en;q=0.9"}', '11709c9a81dd8535581fc7c91c42e5f33bda6aa27b8fd89bbdcd40bf3691abbc', '192.168.1.223', NULL, TRUE, '2025-11-05T00:21:00.714Z', '2025-10-06T00:21:00.714Z', '2025-10-06T00:21:00.714Z', '2025-10-06T00:21:00.714Z', '2025-10-06T00:21:00.714Z');



-- Table: users

CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass), "email" VARCHAR(255) NOT NULL, "password_hash" VARCHAR(255) NOT NULL, "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100) NOT NULL, "phone" VARCHAR(20), "location" USER-DEFINED, "address_street" VARCHAR(255), "address_city" VARCHAR(100), "address_state" VARCHAR(50), "address_zip" VARCHAR(10), "profile_image_url" VARCHAR(500), "is_verified" BOOLEAN DEFAULT false, "emergency_contact_name" VARCHAR(100), "emergency_contact_phone" VARCHAR(20), "skills" ARRAY, "preferences" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_county" VARCHAR(100), "location_radius_miles" NUMERIC DEFAULT 10.0, "show_city_only" BOOLEAN DEFAULT false, "email_verified" BOOLEAN DEFAULT false, "email_verification_code" VARCHAR(6), "email_verification_expires" TIMESTAMP WITH TIME ZONE, "password_reset_code" VARCHAR(6), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "notification_preferences" JSONB DEFAULT '{}'::jsonb, "zip_code" VARCHAR(10), "address" TEXT, "bio" TEXT, "latitude" NUMERIC, "longitude" NUMERIC, "home_city" VARCHAR(100), "home_state" VARCHAR(50), "home_zip_code" VARCHAR(10), "home_address" TEXT, "home_latitude" NUMERIC, "home_longitude" NUMERIC, "location_preferences" JSONB DEFAULT '{}'::jsonb, "location_permissions" JSONB DEFAULT '{}'::jsonb);


INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name", "phone", "location", "address_street", "address_city", "address_state", "address_zip", "profile_image_url", "is_verified", "emergency_contact_name", "emergency_contact_phone", "skills", "preferences", "created_at", "updated_at", "location_city", "location_county", "location_radius_miles", "show_city_only", "email_verified", "email_verification_code", "email_verification_expires", "password_reset_code", "password_reset_expires", "is_active", "notification_preferences", "zip_code", "address", "bio", "latitude", "longitude", "home_city", "home_state", "home_zip_code", "home_address", "home_latitude", "home_longitude", "location_preferences", "location_permissions") VALUES
  (48, 'jacobleon222@gmail.com', '$2a$12$ImiP71XNu4HL6FglbF0zWuhpPC9.SNS1AP9/k8PmXW51xVBBr4MFa', 'Jacob', 'Leon', '9188911455', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, NULL, NULL, '{}', '2025-09-26T21:21:25.611Z', '2025-09-26T21:21:25.611Z', NULL, NULL, '10.0', FALSE, FALSE, '887565', '2025-09-27T21:21:25.538Z', NULL, NULL, TRUE, '{}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '{}'),
  (47, 'jacobleon2117@gmail.com', '$2a$10$FMSUsTIZnzEzH99ef8bfhuZulj/QL/duvgAQyY0K4oxilVmddeCpq', 'Jacob', 'Leon', '9188911455', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, NULL, NULL, '{}', '2025-09-26T21:17:37.491Z', '2025-09-28T00:10:41.427Z', NULL, NULL, '10.0', FALSE, FALSE, '766709', '2025-09-27T21:17:37.418Z', NULL, NULL, TRUE, '{}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '{}'),
  (49, 'testuser1@example.com', '$2a$12$AIeYptw0mxvn5sTybZjJgedap5c8KW1/jZQ1x99PqU9aXXjp7rMxS', 'Test', 'User', NULL, '0101000020E61000006EA301BC05B255C09487855AD3144240', NULL, NULL, 'TN', NULL, NULL, FALSE, NULL, NULL, NULL, '{}', '2025-09-28T00:19:54.505Z', '2025-09-28T00:19:54.505Z', 'Nashville', NULL, '10.0', FALSE, FALSE, '241462', '2025-09-29T00:19:54.366Z', NULL, NULL, TRUE, '{}', '37203', '123 Main St', NULL, '36.16270000', '-86.78160000', NULL, NULL, NULL, NULL, NULL, NULL, '{}', '{}');



-- Table: weather_alerts

CREATE TABLE IF NOT EXISTS "weather_alerts" ("id" INTEGER NOT NULL DEFAULT nextval('weather_alerts_id_seq'::regclass), "alert_id" VARCHAR(100), "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "severity" VARCHAR(50) NOT NULL, "alert_type" VARCHAR(100) NOT NULL, "source" VARCHAR(50) NOT NULL DEFAULT 'NOAA'::character varying, "affected_areas" USER-DEFINED, "start_time" TIMESTAMP WITH TIME ZONE, "end_time" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "created_by" INTEGER, "metadata" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100));


