1. Overall Plan & Architecture
    - Provide a high-level description of what the backend is doing.
    - Explain its architecture (APIs, services, database, middleware, background jobs, etc.).
    - Describe data flow: how requests move through the system.
    - Document the purpose of each major file/module and how they interact.

2. Database & Schema Review
    - Review the SQL schema (I will paste the Supabase visualizer).
    - **Check for:**
        - Poor naming conventions.
        - Missing indexes or constraints.
        - Risky column types (e.g., passwords in plain text).
        - Weak or missing foreign key relationships.
        - Potential performance bottlenecks.
        - Suggest improvements for normalization, indexing, and scalability.

3. Current State Evaluation
    - Identify what’s working well (performance, clean code, reliability).
    - Identify what’s not working well (bugs, confusing logic, duplicated code).
    - Verify proper error handling, logging, monitoring, and validation exist.
    - Check for unused/dead code and unnecessary files.

4. Future Implementations & Roadmap
    - Suggest realistic features to add later (rate limiting, caching, search optimization, queues).
    - Consider scalability: what breaks if we get 100,000+ users.
    - Identify missing DevOps practices (CI/CD pipelines, staging environment, Docker).

5. Updates & Maintenance
    - Audit package.json: confirm dependencies are installed, up-to-date, and used.
    - Identify dependencies that can be removed.
    - Suggest refactoring opportunities for readability and maintainability.
    - Remove placeholder data, mock responses, or unused configs.

6. Security Review
    - Verify authentication/authorization flows are secure (JWT/session expiration, refresh tokens).
    - Confirm secrets are handled via .env files.
    - Ensure user input is validated/sanitized to prevent SQL injection, XSS, CSRF.
    - Review access control rules for sensitive endpoints.

7. Testing & Coverage
    - Check if unit, integration, and E2E tests exist.
    - Suggest critical areas needing coverage (auth, payments, core APIs).
    - Recommend testing tools if missing (Jest, Supertest, Cypress).

8. API Documentation & Developer Experience
    - Confirm API documentation exists (Swagger, Postman collection).
    - If missing, recommend auto-generation.
    - Suggest improvements for onboarding (clear readme, setup steps).

9. Summary & Recommendations
    - **Clearly list:**
        - What’s solid.
        - What needs immediate fixes.
        - What’s a nice-to-have improvement.
        - Confirm backend is production-ready.

10. ETC
    - Docker files are in the backend, what exactly are they doing and do we need them?
    - Since I decided not to use railways is it removed or are we using it? If we're not using it we should remove it unless we really need it.
    - Should we organize the schema files into one folder or keep them how they are?
    - If there's any TODO comments in any files we need to make sure they're completed and finished before moving to the frontend.
    - Find any comments in files/code that need to be addressed and then either fix that problem or make sure to see why it was commented out, etc.
    - Make sure the folder/file structure also makes sense.
    - Double check each file for unused imports, unused code and see why and see if it's needed or see if it needs to be added.
    - Let's make sure the scripts folders in backend/scripts and backend/src/scripts can be combined, if not leave it as is. Also make sure to see if any of the scripts are needed and if not remove them from the project.

11. Supabase visualizer (Copied & pasted from Supabase)
```
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_actions (
  id integer NOT NULL DEFAULT nextval('admin_actions_id_seq'::regclass),
  admin_id integer NOT NULL,
  action_type character varying NOT NULL,
  target_type character varying NOT NULL,
  target_id integer,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);
CREATE TABLE public.admin_roles (
  id integer NOT NULL DEFAULT nextval('admin_roles_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_sessions (
  id integer NOT NULL DEFAULT nextval('admin_sessions_id_seq'::regclass),
  user_id integer NOT NULL,
  session_token character varying NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  permissions jsonb DEFAULT '{}'::jsonb,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.comment_reports (
  id integer NOT NULL DEFAULT nextval('comment_reports_id_seq'::regclass),
  comment_id integer NOT NULL,
  reporter_id integer NOT NULL,
  reason character varying NOT NULL CHECK (reason::text = ANY (ARRAY['inappropriate'::character varying, 'spam'::character varying, 'harassment'::character varying, 'other'::character varying]::text[])),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying]::text[])),
  reviewed_by integer,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_reports_pkey PRIMARY KEY (id),
  CONSTRAINT comment_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
  CONSTRAINT comment_reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id),
  CONSTRAINT comment_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  post_id integer NOT NULL,
  user_id integer NOT NULL,
  content text NOT NULL,
  parent_comment_id integer,
  images ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_edited boolean DEFAULT false,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.daily_analytics (
  id integer NOT NULL DEFAULT nextval('daily_analytics_id_seq'::regclass),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  new_posts integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  new_comments integer DEFAULT 0,
  total_reactions integer DEFAULT 0,
  new_reactions integer DEFAULT 0,
  total_reports integer DEFAULT 0,
  new_reports integer DEFAULT 0,
  emergency_posts integer DEFAULT 0,
  posts_by_type jsonb DEFAULT '{}'::jsonb,
  top_cities jsonb DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.emergency_resources (
  id integer NOT NULL DEFAULT nextval('emergency_resources_id_seq'::regclass),
  resource_type character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  contact_name character varying,
  contact_phone character varying,
  contact_email character varying,
  address text,
  location USER-DEFINED,
  is_available boolean DEFAULT true,
  capacity integer,
  hours_available character varying,
  requirements text,
  created_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location_city character varying,
  location_state character varying,
  location_county character varying,
  CONSTRAINT emergency_resources_pkey PRIMARY KEY (id),
  CONSTRAINT emergency_resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.migrations (
  id integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  filename character varying NOT NULL UNIQUE,
  checksum character varying NOT NULL,
  executed_at timestamp with time zone DEFAULT now(),
  execution_time integer NOT NULL,
  CONSTRAINT migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.moderation_queue (
  id integer NOT NULL DEFAULT nextval('moderation_queue_id_seq'::regclass),
  content_type character varying NOT NULL,
  content_id integer NOT NULL,
  reporter_id integer,
  moderator_id integer,
  status character varying DEFAULT 'pending'::character varying,
  priority character varying DEFAULT 'normal'::character varying,
  reason character varying NOT NULL,
  description text,
  moderator_notes text,
  action_taken character varying,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_queue_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_queue_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  CONSTRAINT moderation_queue_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_campaigns (
  id integer NOT NULL DEFAULT nextval('notification_campaigns_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  campaign_type character varying NOT NULL,
  status character varying DEFAULT 'draft'::character varying,
  target_type character varying NOT NULL,
  target_city character varying,
  target_state character varying,
  target_user_ids ARRAY,
  title character varying NOT NULL,
  message text NOT NULL,
  action_url character varying,
  image_url character varying,
  send_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  successful_sends integer DEFAULT 0,
  failed_sends integer DEFAULT 0,
  created_by integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT notification_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.notification_preferences (
  id integer NOT NULL DEFAULT nextval('notification_preferences_id_seq'::regclass),
  user_id integer NOT NULL UNIQUE,
  push_enabled boolean DEFAULT true,
  emergency_alerts boolean DEFAULT true,
  new_messages boolean DEFAULT true,
  post_comments boolean DEFAULT true,
  post_reactions boolean DEFAULT false,
  neighborhood_posts boolean DEFAULT true,
  weather_alerts boolean DEFAULT true,
  community_updates boolean DEFAULT true,
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time without time zone DEFAULT '22:00:00'::time without time zone,
  quiet_hours_end time without time zone DEFAULT '08:00:00'::time without time zone,
  timezone character varying DEFAULT 'America/Chicago'::character varying,
  digest_frequency character varying DEFAULT 'daily'::character varying,
  max_notifications_per_hour integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_templates (
  id integer NOT NULL DEFAULT nextval('notification_templates_id_seq'::regclass),
  template_key character varying NOT NULL UNIQUE,
  title_template character varying NOT NULL,
  body_template text NOT NULL,
  action_url character varying,
  icon character varying,
  sound character varying DEFAULT 'default'::character varying,
  priority character varying DEFAULT 'normal'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  notification_type character varying NOT NULL,
  template_key character varying,
  related_post_id integer,
  related_comment_id integer,
  related_alert_id integer,
  related_user_id integer,
  push_sent boolean DEFAULT false,
  push_sent_at timestamp with time zone,
  push_delivery_status character varying,
  push_error_message text,
  fcm_message_id character varying,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  clicked boolean DEFAULT false,
  clicked_at timestamp with time zone,
  target_audience character varying DEFAULT 'individual'::character varying,
  target_city character varying,
  target_state character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_related_alert_id_fkey FOREIGN KEY (related_alert_id) REFERENCES public.weather_alerts(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_template_key_fkey FOREIGN KEY (template_key) REFERENCES public.notification_templates(template_key),
  CONSTRAINT notifications_related_post_id_fkey FOREIGN KEY (related_post_id) REFERENCES public.posts(id),
  CONSTRAINT notifications_related_comment_id_fkey FOREIGN KEY (related_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.post_reports (
  id integer NOT NULL DEFAULT nextval('post_reports_id_seq'::regclass),
  post_id integer NOT NULL,
  reported_by integer NOT NULL,
  report_reason character varying NOT NULL,
  report_description text,
  status character varying DEFAULT 'pending'::character varying,
  reviewed_by integer,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id)
);
CREATE TABLE public.posts (
  id integer NOT NULL DEFAULT nextval('posts_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying,
  content text NOT NULL,
  post_type character varying NOT NULL CHECK (post_type::text = ANY (ARRAY['help_request'::character varying, 'help_offer'::character varying, 'lost_found'::character varying, 'safety_alert'::character varying, 'general'::character varying]::text[])),
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  location USER-DEFINED,
  images ARRAY,
  tags ARRAY,
  is_emergency boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location_city character varying,
  location_state character varying,
  location_county character varying,
  latitude numeric CHECK (latitude >= '-90'::integer::numeric AND latitude <= 90::numeric),
  longitude numeric CHECK (longitude >= '-180'::integer::numeric AND longitude <= 180::numeric),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reactions (
  id integer NOT NULL DEFAULT nextval('reactions_id_seq'::regclass),
  user_id integer NOT NULL,
  post_id integer,
  comment_id integer,
  reaction_type character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reactions_pkey PRIMARY KEY (id),
  CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.saved_searches (
  id integer NOT NULL DEFAULT nextval('saved_searches_id_seq'::regclass),
  user_id integer NOT NULL,
  name character varying NOT NULL,
  description text,
  query_text text,
  filters jsonb DEFAULT '{}'::jsonb,
  notify_new_results boolean DEFAULT true,
  notification_frequency character varying DEFAULT 'immediate'::character varying,
  last_notification_sent timestamp with time zone,
  total_results integer DEFAULT 0,
  last_result_count integer DEFAULT 0,
  last_executed timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_searches_pkey PRIMARY KEY (id),
  CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.schema_migrations (
  id integer NOT NULL DEFAULT nextval('schema_migrations_id_seq'::regclass),
  version character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  checksum character varying NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  execution_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schema_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.search_queries (
  id integer NOT NULL DEFAULT nextval('search_queries_id_seq'::regclass),
  user_id integer,
  query_text text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  search_type character varying DEFAULT 'general'::character varying,
  source character varying DEFAULT 'manual'::character varying,
  search_city character varying,
  search_state character varying,
  execution_time_ms integer,
  clicked_result_id integer,
  clicked_result_type character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_queries_pkey PRIMARY KEY (id),
  CONSTRAINT search_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.search_suggestions (
  id integer NOT NULL DEFAULT nextval('search_suggestions_id_seq'::regclass),
  suggestion_text character varying NOT NULL,
  suggestion_type character varying NOT NULL,
  category character varying,
  search_count integer DEFAULT 1,
  result_count integer DEFAULT 0,
  click_through_rate numeric DEFAULT 0.0,
  city character varying,
  state character varying,
  is_trending boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  source character varying DEFAULT 'user_generated'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_suggestions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.system_settings (
  id integer NOT NULL DEFAULT nextval('system_settings_id_seq'::regclass),
  setting_key character varying NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  setting_type character varying DEFAULT 'general'::character varying,
  display_name character varying,
  description text,
  is_public boolean DEFAULT false,
  updated_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.trending_searches (
  id integer NOT NULL DEFAULT nextval('trending_searches_id_seq'::regclass),
  search_term character varying NOT NULL,
  search_count integer DEFAULT 1,
  unique_users integer DEFAULT 1,
  avg_results integer DEFAULT 0,
  hourly_count integer DEFAULT 0,
  daily_count integer DEFAULT 0,
  weekly_count integer DEFAULT 0,
  city character varying,
  state character varying,
  category character varying,
  sentiment character varying DEFAULT 'neutral'::character varying,
  is_trending boolean DEFAULT false,
  trend_score numeric DEFAULT 0.0,
  peak_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trending_searches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_admin_roles (
  id integer NOT NULL DEFAULT nextval('user_admin_roles_id_seq'::regclass),
  user_id integer NOT NULL,
  role_id integer NOT NULL,
  assigned_by integer,
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  notes text,
  CONSTRAINT user_admin_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_admin_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT user_admin_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_admin_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id)
);
CREATE TABLE public.user_devices (
  id integer NOT NULL DEFAULT nextval('user_devices_id_seq'::regclass),
  user_id integer NOT NULL,
  device_token character varying NOT NULL,
  device_type character varying NOT NULL,
  device_name character varying,
  app_version character varying,
  is_active boolean DEFAULT true,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_devices_pkey PRIMARY KEY (id),
  CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_follows (
  id integer NOT NULL DEFAULT nextval('user_follows_id_seq'::regclass),
  follower_id integer NOT NULL,
  following_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_sessions (
  id integer NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  user_id integer NOT NULL,
  refresh_token character varying NOT NULL UNIQUE,
  device_info jsonb DEFAULT '{}'::jsonb,
  device_fingerprint character varying,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  phone character varying,
  location USER-DEFINED,
  address_street character varying,
  address_city character varying,
  address_state character varying,
  address_zip character varying,
  profile_image_url character varying,
  is_verified boolean DEFAULT false,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  skills ARRAY,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location_city character varying,
  location_county character varying,
  location_radius_miles numeric DEFAULT 10.0,
  show_city_only boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  email_verification_code character varying,
  email_verification_expires timestamp with time zone,
  password_reset_code character varying,
  password_reset_expires timestamp with time zone,
  is_active boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  zip_code character varying,
  address text,
  bio text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.weather_alerts (
  id integer NOT NULL DEFAULT nextval('weather_alerts_id_seq'::regclass),
  alert_id character varying,
  title character varying NOT NULL,
  description text NOT NULL,
  severity character varying NOT NULL,
  alert_type character varying NOT NULL,
  source character varying NOT NULL DEFAULT 'NOAA'::character varying,
  affected_areas USER-DEFINED,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location_city character varying,
  location_state character varying,
  location_county character varying,
  CONSTRAINT weather_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT weather_alerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
```