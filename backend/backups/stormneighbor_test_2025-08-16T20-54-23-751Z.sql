-- StormNeighbor Database Backup
-- Created: 2025-08-16T20:54:23.796Z
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


-- Data for table: admin_actions
INSERT INTO "admin_actions" ("id", "admin_id", "action_type", "target_type", "target_id", "details", "ip_address", "user_agent", "success", "error_message", "created_at") VALUES
  (1, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-12T20:37:58.714Z'),
  (2, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T04:59:55.674Z'),
  (3, 28, 'admin_role_assigned', 'user', 28, '{"notes":"Self assignment test","role_id":2}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:00:54.173Z'),
  (4, 28, 'admin_role_assigned', 'user', 28, '{"notes":"Self assignment test - should fail","role_id":3}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:04:34.957Z'),
  (5, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:08:02.381Z'),
  (6, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:08:17.853Z'),
  (7, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:17:23.222Z'),
  (8, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:19:20.688Z'),
  (9, 28, 'unauthorized_admin_access', 'security', NULL, '{"method":"DELETE","endpoint":"/users/28"}', '::1', 'curl/8.7.1', false, NULL, '2025-08-13T05:23:49.790Z'),
  (10, 28, 'unauthorized_admin_access', 'security', NULL, '{"method":"GET","endpoint":"/users/28/roles"}', '::1', 'curl/8.7.1', false, NULL, '2025-08-13T05:24:29.442Z'),
  (11, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:26:23.203Z'),
  (12, 28, 'dashboard_view', 'analytics', NULL, '{}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:28:53.566Z'),
  (13, 28, 'admin_role_assigned', 'user', 28, '{"notes":"Grant super_admin role","role_id":1}', '::1', 'curl/8.7.1', true, NULL, '2025-08-13T05:33:22.766Z');


-- Table: admin_roles
CREATE TABLE IF NOT EXISTS "admin_roles" ("id" INTEGER NOT NULL DEFAULT nextval('admin_roles_id_seq'::regclass), "name" VARCHAR(50) NOT NULL, "display_name" VARCHAR(100) NOT NULL, "description" TEXT, "permissions" JSONB DEFAULT '{}'::jsonb, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Data for table: admin_roles
INSERT INTO "admin_roles" ("id", "name", "display_name", "description", "permissions", "is_active", "created_at", "updated_at") VALUES
  (1, 'super_admin', 'Super Administrator', 'Full system access with all permissions', '{"admin":["read","write","assign_roles"],"users":["read","write","delete","ban","admin"],"system":["read","write","maintenance","settings"],"content":["read","write","delete","moderate","feature"],"security":["read","audit"],"analytics":["read","export"]}', true, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (2, 'moderator', 'Content Moderator', 'Content moderation and user management', '{"users":["read","suspend","warn"],"system":["read"],"content":["read","moderate","delete","feature"],"security":["read"],"analytics":["read"]}', true, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (3, 'support', 'Support Staff', 'User support and basic analytics', '{"users":["read","contact"],"system":["read"],"content":["read"],"analytics":["read"]}', true, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (4, 'analyst', 'Data Analyst', 'Analytics and reporting access', '{"users":["read"],"system":["read"],"content":["read"],"analytics":["read","export"]}', true, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z');


-- Table: admin_sessions
CREATE TABLE IF NOT EXISTS "admin_sessions" ("id" INTEGER NOT NULL DEFAULT nextval('admin_sessions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "session_token" VARCHAR(512) NOT NULL, "ip_address" INET, "user_agent" TEXT, "permissions" JSONB DEFAULT '{}'::jsonb, "last_activity" TIMESTAMP WITH TIME ZONE DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: comment_reports
CREATE TABLE IF NOT EXISTS "comment_reports" ("id" INTEGER NOT NULL DEFAULT nextval('comment_reports_id_seq'::regclass), "comment_id" INTEGER NOT NULL, "reporter_id" INTEGER NOT NULL, "reason" VARCHAR(50) NOT NULL, "status" VARCHAR(20) DEFAULT 'pending'::character varying, "reviewed_by" INTEGER, "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: comments
CREATE TABLE IF NOT EXISTS "comments" ("id" INTEGER NOT NULL DEFAULT nextval('comments_id_seq'::regclass), "post_id" INTEGER NOT NULL, "user_id" INTEGER NOT NULL, "content" TEXT NOT NULL, "parent_comment_id" INTEGER, "images" ARRAY, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "is_edited" BOOLEAN DEFAULT false);


-- Table: daily_analytics
CREATE TABLE IF NOT EXISTS "daily_analytics" ("id" INTEGER NOT NULL DEFAULT nextval('daily_analytics_id_seq'::regclass), "date" DATE NOT NULL, "total_users" INTEGER DEFAULT 0, "new_users" INTEGER DEFAULT 0, "active_users" INTEGER DEFAULT 0, "total_posts" INTEGER DEFAULT 0, "new_posts" INTEGER DEFAULT 0, "total_comments" INTEGER DEFAULT 0, "new_comments" INTEGER DEFAULT 0, "total_reactions" INTEGER DEFAULT 0, "new_reactions" INTEGER DEFAULT 0, "total_reports" INTEGER DEFAULT 0, "new_reports" INTEGER DEFAULT 0, "emergency_posts" INTEGER DEFAULT 0, "posts_by_type" JSONB DEFAULT '{}'::jsonb, "top_cities" JSONB DEFAULT '{}'::jsonb, "generated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: emergency_resources
CREATE TABLE IF NOT EXISTS "emergency_resources" ("id" INTEGER NOT NULL DEFAULT nextval('emergency_resources_id_seq'::regclass), "resource_type" VARCHAR(50) NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "contact_name" VARCHAR(100), "contact_phone" VARCHAR(20), "contact_email" VARCHAR(255), "address" TEXT, "location" USER-DEFINED, "is_available" BOOLEAN DEFAULT true, "capacity" INTEGER, "hours_available" VARCHAR(100), "requirements" TEXT, "created_by" INTEGER, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100));


-- Table: migrations
CREATE TABLE IF NOT EXISTS "migrations" ("id" INTEGER NOT NULL DEFAULT nextval('migrations_id_seq'::regclass), "filename" VARCHAR(255) NOT NULL, "checksum" VARCHAR(64) NOT NULL, "executed_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "execution_time" INTEGER NOT NULL);


-- Data for table: migrations
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


-- Data for table: notification_templates
INSERT INTO "notification_templates" ("id", "template_key", "title_template", "body_template", "action_url", "icon", "sound", "priority", "is_active", "created_at", "updated_at") VALUES
  (1, 'new_message', 'New message from {sender_name}', '{sender_name}: {message_preview}', '/messages/{conversation_id}', NULL, 'default', 'high', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (2, 'post_comment', 'New comment on your post', '{commenter_name} commented: {comment_preview}', '/posts/{post_id}', NULL, 'default', 'normal', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (3, 'post_reaction', '{reactor_name} reacted to your post', '{reaction_type} on "{post_title}"', '/posts/{post_id}', NULL, 'default', 'low', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (4, 'emergency_alert', 'Emergency Alert: {alert_type}', '{alert_description}', '/alerts/{alert_id}', NULL, 'default', 'high', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (5, 'weather_alert', 'Weather Alert for {city}', '{severity}: {alert_title}', '/weather/alerts', NULL, 'default', 'high', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (6, 'neighborhood_post', 'New post in {city}', '{author_name}: {post_preview}', '/posts/{post_id}', NULL, 'default', 'normal', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (7, 'welcome', 'Welcome to StormNeighbor!', 'Get started by completing your profile and connecting with neighbors', '/profile', NULL, 'default', 'normal', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (8, 'verification_reminder', 'Please verify your email', 'Verify your email to access all StormNeighbor features', '/verify-email', NULL, 'default', 'normal', true, '2025-08-03T07:51:48.391Z', '2025-08-03T07:51:48.391Z'),
  (17, 'new_post', 'New Post in Your Area', 'There''s a new {{post_type}} post near you: {{title}}', NULL, NULL, 'default', 'normal', true, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (20, 'comment_reply', 'Someone Replied', '{{author}} replied to your comment', NULL, NULL, 'default', 'normal', true, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (22, 'comment_reported', 'Content Reported', 'A comment has been reported and needs review', NULL, NULL, 'default', 'normal', true, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (23, 'post_reported', 'Post Reported', 'A post has been reported and needs review', NULL, NULL, 'default', 'normal', true, '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z');


-- Table: notifications
CREATE TABLE IF NOT EXISTS "notifications" ("id" INTEGER NOT NULL DEFAULT nextval('notifications_id_seq'::regclass), "user_id" INTEGER NOT NULL, "title" VARCHAR(255) NOT NULL, "message" TEXT NOT NULL, "notification_type" VARCHAR(50) NOT NULL, "template_key" VARCHAR(100), "related_post_id" INTEGER, "related_comment_id" INTEGER, "related_alert_id" INTEGER, "related_user_id" INTEGER, "push_sent" BOOLEAN DEFAULT false, "push_sent_at" TIMESTAMP WITH TIME ZONE, "push_delivery_status" VARCHAR(20), "push_error_message" TEXT, "fcm_message_id" VARCHAR(255), "is_read" BOOLEAN DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, "clicked" BOOLEAN DEFAULT false, "clicked_at" TIMESTAMP WITH TIME ZONE, "target_audience" VARCHAR(50) DEFAULT 'individual'::character varying, "target_city" VARCHAR(100), "target_state" VARCHAR(50), "metadata" JSONB DEFAULT '{}'::jsonb, "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: post_reports
CREATE TABLE IF NOT EXISTS "post_reports" ("id" INTEGER NOT NULL DEFAULT nextval('post_reports_id_seq'::regclass), "post_id" INTEGER NOT NULL, "reported_by" INTEGER NOT NULL, "report_reason" VARCHAR(100) NOT NULL, "report_description" TEXT, "status" VARCHAR(20) DEFAULT 'pending'::character varying, "reviewed_by" INTEGER, "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: posts
CREATE TABLE IF NOT EXISTS "posts" ("id" INTEGER NOT NULL DEFAULT nextval('posts_id_seq'::regclass), "user_id" INTEGER NOT NULL, "title" VARCHAR(255), "content" TEXT NOT NULL, "post_type" VARCHAR(50) NOT NULL, "priority" VARCHAR(20) DEFAULT 'normal'::character varying, "location" USER-DEFINED, "images" ARRAY, "tags" ARRAY, "is_emergency" BOOLEAN DEFAULT false, "is_resolved" BOOLEAN DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE, "metadata" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100), "latitude" NUMERIC, "longitude" NUMERIC);


-- Table: reactions
CREATE TABLE IF NOT EXISTS "reactions" ("id" INTEGER NOT NULL DEFAULT nextval('reactions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "post_id" INTEGER, "comment_id" INTEGER, "reaction_type" VARCHAR(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: saved_searches
CREATE TABLE IF NOT EXISTS "saved_searches" ("id" INTEGER NOT NULL DEFAULT nextval('saved_searches_id_seq'::regclass), "user_id" INTEGER NOT NULL, "name" VARCHAR(255) NOT NULL, "description" TEXT, "query_text" TEXT, "filters" JSONB DEFAULT '{}'::jsonb, "notify_new_results" BOOLEAN DEFAULT true, "notification_frequency" VARCHAR(20) DEFAULT 'immediate'::character varying, "last_notification_sent" TIMESTAMP WITH TIME ZONE, "total_results" INTEGER DEFAULT 0, "last_result_count" INTEGER DEFAULT 0, "last_executed" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: search_queries
CREATE TABLE IF NOT EXISTS "search_queries" ("id" INTEGER NOT NULL DEFAULT nextval('search_queries_id_seq'::regclass), "user_id" INTEGER, "query_text" TEXT NOT NULL, "filters" JSONB DEFAULT '{}'::jsonb, "results_count" INTEGER DEFAULT 0, "search_type" VARCHAR(50) DEFAULT 'general'::character varying, "source" VARCHAR(50) DEFAULT 'manual'::character varying, "search_city" VARCHAR(100), "search_state" VARCHAR(50), "execution_time_ms" INTEGER, "clicked_result_id" INTEGER, "clicked_result_type" VARCHAR(50), "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Data for table: search_queries
INSERT INTO "search_queries" ("id", "user_id", "query_text", "filters", "results_count", "search_type", "source", "search_city", "search_state", "execution_time_ms", "clicked_result_id", "clicked_result_type", "created_at") VALUES
  (1, NULL, 'test', '{"city":"Austin","limit":1,"query":"test","state":"Texas"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:36:21.036Z'),
  (2, NULL, 'test', '{"city":"Austin","limit":1,"query":"test","state":"Texas"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:39:59.635Z'),
  (3, NULL, 'test', '{"city":"Austin","limit":1,"query":"test","state":"Texas"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:50:45.916Z'),
  (4, NULL, 'test', '{"city":"Austin","limit":1,"query":"test","state":"Texas"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:52:03.815Z'),
  (17, NULL, 'test', '{"city":"Austin","limit":5,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"date","dateFrom":null,"postTypes":["general"],"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:59:01.647Z'),
  (16, NULL, '', '{"city":"Austin","limit":20,"state":"Texas","dateTo":null,"offset":0,"sortBy":"date","dateFrom":null,"postTypes":["help_request"],"priorities":null,"emergencyOnly":false,"resolvedFilter":"unresolved"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:58:56.611Z'),
  (15, NULL, '', '{"city":"Austin","limit":20,"state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:58:38.046Z'),
  (14, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:58:32.266Z'),
  (13, NULL, 'emergency', '{"city":"Austin","limit":20,"query":"emergency","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:58:27.768Z'),
  (10, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:56:57.855Z'),
  (8, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:56:26.738Z'),
  (7, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:56:13.940Z'),
  (21, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:59:17.796Z'),
  (20, NULL, 'help', '{"city":"Austin","limit":20,"query":"help","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:59:09.207Z'),
  (19, NULL, 'test', '{"city":"Austin","limit":20,"query":"test","state":"Texas","dateTo":null,"offset":0,"sortBy":"relevance","dateFrom":null,"postTypes":null,"priorities":null,"emergencyOnly":false,"resolvedFilter":"all"}', 0, 'general', 'manual', 'Austin', 'Texas', NULL, NULL, NULL, '2025-08-08T18:59:09.024Z');


-- Table: search_suggestions
CREATE TABLE IF NOT EXISTS "search_suggestions" ("id" INTEGER NOT NULL DEFAULT nextval('search_suggestions_id_seq'::regclass), "suggestion_text" VARCHAR(255) NOT NULL, "suggestion_type" VARCHAR(50) NOT NULL, "category" VARCHAR(50), "search_count" INTEGER DEFAULT 1, "result_count" INTEGER DEFAULT 0, "click_through_rate" NUMERIC DEFAULT 0.0, "city" VARCHAR(100), "state" VARCHAR(50), "is_trending" BOOLEAN DEFAULT false, "is_approved" BOOLEAN DEFAULT true, "source" VARCHAR(50) DEFAULT 'user_generated'::character varying, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Data for table: search_suggestions
INSERT INTO "search_suggestions" ("id", "suggestion_text", "suggestion_type", "category", "search_count", "result_count", "click_through_rate", "city", "state", "is_trending", "is_approved", "source", "created_at", "updated_at") VALUES
  (1, 'power outage', 'emergency', 'utility', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (2, 'road closure', 'infrastructure', 'traffic', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (3, 'severe weather', 'weather', 'alert', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (4, 'flooding', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (5, 'community event', 'general', 'social', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (6, 'lost pet', 'general', 'pets', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (7, 'neighborhood watch', 'safety', 'security', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (8, 'storm damage', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (9, 'tornado warning', 'emergency', 'weather', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (10, 'evacuation', 'emergency', 'safety', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (11, 'volunteer needed', 'general', 'community', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z'),
  (12, 'traffic accident', 'infrastructure', 'traffic', 1, 0, '0.00', NULL, NULL, false, true, 'system', '2025-08-11T03:52:44.054Z', '2025-08-11T03:52:44.054Z');


-- Table: system_settings
CREATE TABLE IF NOT EXISTS "system_settings" ("id" INTEGER NOT NULL DEFAULT nextval('system_settings_id_seq'::regclass), "setting_key" VARCHAR(100) NOT NULL, "setting_value" JSONB NOT NULL, "setting_type" VARCHAR(50) DEFAULT 'general'::character varying, "display_name" VARCHAR(200), "description" TEXT, "is_public" BOOLEAN DEFAULT false, "updated_by" INTEGER, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Data for table: system_settings
INSERT INTO "system_settings" ("id", "setting_key", "setting_value", "setting_type", "display_name", "description", "is_public", "updated_by", "created_at", "updated_at") VALUES
  (1, 'maintenance_mode', false, 'system', 'Maintenance Mode', 'Enable maintenance mode to prevent user access', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (2, 'allow_registrations', true, 'users', 'Allow New Registrations', 'Allow new users to register accounts', true, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (3, 'max_posts_per_day', 10, 'content', 'Maximum Posts Per Day', 'Maximum posts a user can create per day', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (4, 'auto_moderation', false, 'moderation', 'Auto Moderation', 'Enable automatic content moderation', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (5, 'emergency_alert_threshold', 5, 'alerts', 'Emergency Alert Threshold', 'Number of emergency posts to trigger area alert', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (6, 'user_verification_required', true, 'users', 'Email Verification Required', 'Require email verification for new accounts', true, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (7, 'content_reporting_enabled', true, 'moderation', 'Content Reporting', 'Allow users to report inappropriate content', true, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (8, 'analytics_retention_days', 365, 'analytics', 'Analytics Retention', 'Number of days to keep detailed analytics data', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (9, 'session_timeout_hours', 24, 'security', 'Session Timeout', 'Hours before user sessions expire', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z'),
  (10, 'api_rate_limit_per_hour', 1000, 'security', 'API Rate Limit', 'Maximum API requests per user per hour', false, NULL, '2025-08-12T19:42:51.325Z', '2025-08-12T19:42:51.325Z');


-- Table: trending_searches
CREATE TABLE IF NOT EXISTS "trending_searches" ("id" INTEGER NOT NULL DEFAULT nextval('trending_searches_id_seq'::regclass), "search_term" VARCHAR(255) NOT NULL, "search_count" INTEGER DEFAULT 1, "unique_users" INTEGER DEFAULT 1, "avg_results" INTEGER DEFAULT 0, "hourly_count" INTEGER DEFAULT 0, "daily_count" INTEGER DEFAULT 0, "weekly_count" INTEGER DEFAULT 0, "city" VARCHAR(100), "state" VARCHAR(50), "category" VARCHAR(50), "sentiment" VARCHAR(20) DEFAULT 'neutral'::character varying, "is_trending" BOOLEAN DEFAULT false, "trend_score" NUMERIC DEFAULT 0.0, "peak_time" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: user_admin_roles
CREATE TABLE IF NOT EXISTS "user_admin_roles" ("id" INTEGER NOT NULL DEFAULT nextval('user_admin_roles_id_seq'::regclass), "user_id" INTEGER NOT NULL, "role_id" INTEGER NOT NULL, "assigned_by" INTEGER, "assigned_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "notes" TEXT);


-- Data for table: user_admin_roles
INSERT INTO "user_admin_roles" ("id", "user_id", "role_id", "assigned_by", "assigned_at", "expires_at", "is_active", "notes") VALUES
  (12, 28, 1, 28, '2025-08-13T05:33:22.726Z', NULL, true, 'Grant super_admin role');


-- Table: user_devices
CREATE TABLE IF NOT EXISTS "user_devices" ("id" INTEGER NOT NULL DEFAULT nextval('user_devices_id_seq'::regclass), "user_id" INTEGER NOT NULL, "device_token" VARCHAR(255) NOT NULL, "device_type" VARCHAR(20) NOT NULL, "device_name" VARCHAR(100), "app_version" VARCHAR(20), "is_active" BOOLEAN DEFAULT true, "last_seen" TIMESTAMP WITH TIME ZONE DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Table: user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" ("id" INTEGER NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass), "user_id" INTEGER NOT NULL, "refresh_token" VARCHAR(512) NOT NULL, "device_info" JSONB DEFAULT '{}'::jsonb, "device_fingerprint" VARCHAR(255), "ip_address" INET, "user_agent" TEXT, "is_active" BOOLEAN DEFAULT true, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_used_at" TIMESTAMP WITH TIME ZONE DEFAULT now());


-- Data for table: user_sessions
INSERT INTO "user_sessions" ("id", "user_id", "refresh_token", "device_info", "device_fingerprint", "ip_address", "user_agent", "is_active", "expires_at", "created_at", "updated_at", "last_used_at") VALUES
  (9, 28, 'c98fc1ad27bcfbc74f2a00bda08697d477f3c6446836550506a80cc0d30e98cec2d11834ba29f0a8', '{"mobile":false,"language":null,"platform":null,"timestamp":"2025-08-13T05:13:13.824Z","userAgent":"curl/8.7.1"}', '8f42af6f304383bbe22bc11b9f1c9ce7', '::1', 'curl/8.7.1', true, '2025-08-20T05:13:13.911Z', '2025-08-13T05:13:13.881Z', '2025-08-13T05:13:13.881Z', '2025-08-13T05:13:13.881Z'),
  (10, 28, '8ac0b1c6caed3bfcffdc46b81f7d35e9e9ce927f23bbcb92bba479c3e316941f8b5fa757cdb620de', '{"mobile":false,"language":null,"platform":null,"timestamp":"2025-08-13T05:16:18.965Z","userAgent":"curl/8.7.1"}', '8f42af6f304383bbe22bc11b9f1c9ce7', '::1', 'curl/8.7.1', true, '2025-08-20T05:16:19.045Z', '2025-08-13T05:16:19.025Z', '2025-08-13T05:16:19.025Z', '2025-08-13T05:16:19.025Z'),
  (11, 28, 'fe5386dd046c47eb031bdbe2dc5c49be909caeefc0cab84d2fc0e9d1ac7ef358397f131ade7a2ddf', '{"mobile":false,"language":null,"platform":null,"timestamp":"2025-08-13T05:18:20.712Z","userAgent":"curl/8.7.1"}', '8f42af6f304383bbe22bc11b9f1c9ce7', '::1', 'curl/8.7.1', true, '2025-08-20T05:18:20.792Z', '2025-08-13T05:18:20.773Z', '2025-08-13T05:18:20.773Z', '2025-08-13T05:18:20.773Z'),
  (12, 28, '42822b7291270f2e83ac36af1ea84c5d01bead8dc25937876aede43bbed6c43c4de0585ef31a3c22', '{"mobile":false,"language":null,"platform":null,"timestamp":"2025-08-13T05:27:41.835Z","userAgent":"curl/8.7.1"}', '8f42af6f304383bbe22bc11b9f1c9ce7', '::1', 'curl/8.7.1', true, '2025-08-20T05:27:41.920Z', '2025-08-13T05:27:41.864Z', '2025-08-13T05:27:41.864Z', '2025-08-13T05:27:41.864Z'),
  (13, 28, 'f87de3e70c861f0ae587cf6e54ac1159d61cee4a1c71829c3d82ebd49dc5b187e10443fbd122a876', '{"mobile":false,"language":null,"platform":null,"timestamp":"2025-08-13T05:31:47.339Z","userAgent":"curl/8.7.1"}', '8f42af6f304383bbe22bc11b9f1c9ce7', '::1', 'curl/8.7.1', true, '2025-08-20T05:31:47.416Z', '2025-08-13T05:31:47.369Z', '2025-08-13T05:31:47.369Z', '2025-08-13T05:31:47.369Z');


-- Table: users
CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass), "email" VARCHAR(255) NOT NULL, "password_hash" VARCHAR(255) NOT NULL, "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100) NOT NULL, "phone" VARCHAR(20), "location" USER-DEFINED, "address_street" VARCHAR(255), "address_city" VARCHAR(100), "address_state" VARCHAR(50), "address_zip" VARCHAR(10), "profile_image_url" VARCHAR(500), "is_verified" BOOLEAN DEFAULT false, "emergency_contact_name" VARCHAR(100), "emergency_contact_phone" VARCHAR(20), "skills" ARRAY, "preferences" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_county" VARCHAR(100), "location_radius_miles" NUMERIC DEFAULT 10.0, "show_city_only" BOOLEAN DEFAULT false, "email_verified" BOOLEAN DEFAULT false, "email_verification_code" VARCHAR(6), "email_verification_expires" TIMESTAMP WITH TIME ZONE, "password_reset_code" VARCHAR(6), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "notification_preferences" JSONB DEFAULT '{}'::jsonb, "zip_code" VARCHAR(10), "address" TEXT, "bio" TEXT);


-- Data for table: users
INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name", "phone", "location", "address_street", "address_city", "address_state", "address_zip", "profile_image_url", "is_verified", "emergency_contact_name", "emergency_contact_phone", "skills", "preferences", "created_at", "updated_at", "location_city", "location_county", "location_radius_miles", "show_city_only", "email_verified", "email_verification_code", "email_verification_expires", "password_reset_code", "password_reset_expires", "is_active", "notification_preferences", "zip_code", "address", "bio") VALUES
  (28, 'jacobleon2117@gmail.com', '$2b$12$eBPD/tbuGLcD.LuGtybZl.dEpNMvt9A6EAGqLhDsK34IQkUlndWl6', 'Jacob', 'Leon', NULL, NULL, NULL, NULL, 'Oklahoma', NULL, NULL, false, NULL, NULL, NULL, '{}', '2025-08-12T20:11:09.185Z', '2025-08-12T20:11:09.185Z', 'Owasso', NULL, '10.0', false, true, NULL, NULL, NULL, NULL, true, '{}', NULL, NULL, NULL);


-- Table: weather_alerts
CREATE TABLE IF NOT EXISTS "weather_alerts" ("id" INTEGER NOT NULL DEFAULT nextval('weather_alerts_id_seq'::regclass), "alert_id" VARCHAR(100), "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "severity" VARCHAR(50) NOT NULL, "alert_type" VARCHAR(100) NOT NULL, "source" VARCHAR(50) NOT NULL DEFAULT 'NOAA'::character varying, "affected_areas" USER-DEFINED, "start_time" TIMESTAMP WITH TIME ZONE, "end_time" TIMESTAMP WITH TIME ZONE, "is_active" BOOLEAN DEFAULT true, "created_by" INTEGER, "metadata" JSONB DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "location_city" VARCHAR(100), "location_state" VARCHAR(50), "location_county" VARCHAR(100));

