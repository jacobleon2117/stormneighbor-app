-- Migration: Optimize RLS Policies for Performance
-- Purpose: Fix RLS policies that re-evaluate auth functions for every row
-- Estimated impact: 10-100x faster query performance for authenticated users
-- Risk level: MEDIUM (affects authentication - test thoroughly)

-- =====================================================
-- RLS POLICY OPTIMIZATION SCRIPT
-- =====================================================

BEGIN;

-- Record start time
DO $$
BEGIN
    RAISE NOTICE 'Starting RLS policy optimization at %', now();
END $$;

-- =====================================================
-- USERS TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing users table RLS policies...';

-- Backup note: Document existing policies before dropping
-- Current policies (as found in performance analysis):
-- - "Users can read own data"
-- - "Enable read access for authenticated users"
-- - "Enable users to update own profile"
-- - "Enable users to insert own profile"

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable users to update own profile" ON users;
DROP POLICY IF EXISTS "Enable users to insert own profile" ON users;

-- Create optimized policies with subqueries
CREATE POLICY "users_select_optimized" ON users FOR SELECT
USING (
    -- Use subquery to evaluate auth.uid() once per query instead of per row
    (SELECT auth.uid()) = id
);

CREATE POLICY "users_update_optimized" ON users FOR UPDATE
USING (
    (SELECT auth.uid()) = id
)
WITH CHECK (
    (SELECT auth.uid()) = id
);

CREATE POLICY "users_insert_optimized" ON users FOR INSERT
WITH CHECK (
    (SELECT auth.uid()) = id
);

RAISE NOTICE 'Users table RLS policies optimized';

-- =====================================================
-- POSTS TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing posts table RLS policies...';

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON posts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON posts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Posts are readable by all authenticated users" ON posts;

-- Create optimized policies
-- Note: Posts should be readable by all users in same location
CREATE POLICY "posts_select_optimized" ON posts FOR SELECT
USING (
    -- Posts are visible to authenticated users
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "posts_insert_optimized" ON posts FOR INSERT
WITH CHECK (
    -- Users can only create posts with their own user_id
    (SELECT auth.uid()) = user_id
);

CREATE POLICY "posts_update_optimized" ON posts FOR UPDATE
USING (
    -- Users can only update their own posts
    (SELECT auth.uid()) = user_id
)
WITH CHECK (
    (SELECT auth.uid()) = user_id
);

CREATE POLICY "posts_delete_optimized" ON posts FOR DELETE
USING (
    -- Users can only delete their own posts
    (SELECT auth.uid()) = user_id
);

RAISE NOTICE 'Posts table RLS policies optimized';

-- =====================================================
-- COMMENTS TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing comments table RLS policies...';

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON comments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON comments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON comments;

-- Create optimized policies
CREATE POLICY "comments_select_optimized" ON comments FOR SELECT
USING (
    -- Comments are visible to authenticated users
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "comments_insert_optimized" ON comments FOR INSERT
WITH CHECK (
    -- Users can only create comments with their own user_id
    (SELECT auth.uid()) = user_id
);

CREATE POLICY "comments_update_optimized" ON comments FOR UPDATE
USING (
    -- Users can only update their own comments
    (SELECT auth.uid()) = user_id
)
WITH CHECK (
    (SELECT auth.uid()) = user_id
);

CREATE POLICY "comments_delete_optimized" ON comments FOR DELETE
USING (
    -- Users can only delete their own comments
    (SELECT auth.uid()) = user_id
);

RAISE NOTICE 'Comments table RLS policies optimized';

-- =====================================================
-- REACTIONS TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing reactions table RLS policies...';

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON reactions;

-- Create optimized policies
CREATE POLICY "reactions_select_optimized" ON reactions FOR SELECT
USING (
    -- Reactions are visible to authenticated users
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "reactions_insert_optimized" ON reactions FOR INSERT
WITH CHECK (
    -- Users can only create reactions with their own user_id
    (SELECT auth.uid()) = user_id
);

CREATE POLICY "reactions_delete_optimized" ON reactions FOR DELETE
USING (
    -- Users can only delete their own reactions
    (SELECT auth.uid()) = user_id
);

RAISE NOTICE 'Reactions table RLS policies optimized';

-- =====================================================
-- WEATHER_ALERTS TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing weather_alerts table RLS policies...';

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON weather_alerts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON weather_alerts;

-- Create optimized policies
CREATE POLICY "weather_alerts_select_optimized" ON weather_alerts FOR SELECT
USING (
    -- Weather alerts are visible to all authenticated users
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "weather_alerts_insert_optimized" ON weather_alerts FOR INSERT
WITH CHECK (
    -- Only authenticated users can create weather alerts
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "weather_alerts_update_optimized" ON weather_alerts FOR UPDATE
USING (
    -- Only authenticated users can update weather alerts
    (SELECT auth.role()) = 'authenticated'
)
WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
);

RAISE NOTICE 'Weather alerts table RLS policies optimized';

-- =====================================================
-- EMERGENCY_RESOURCES TABLE RLS OPTIMIZATION
-- =====================================================
RAISE NOTICE 'Optimizing emergency_resources table RLS policies...';

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON emergency_resources;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON emergency_resources;

-- Create optimized policies
CREATE POLICY "emergency_resources_select_optimized" ON emergency_resources FOR SELECT
USING (
    -- Emergency resources are visible to all authenticated users
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "emergency_resources_insert_optimized" ON emergency_resources FOR INSERT
WITH CHECK (
    -- Only authenticated users can create emergency resources
    (SELECT auth.role()) = 'authenticated'
);

CREATE POLICY "emergency_resources_update_optimized" ON emergency_resources FOR UPDATE
USING (
    -- Only authenticated users can update emergency resources
    (SELECT auth.role()) = 'authenticated'
)
WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
);

RAISE NOTICE 'Emergency resources table RLS policies optimized';

-- =====================================================
-- VALIDATION: Verify policies are active
-- =====================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%optimized%';

    RAISE NOTICE 'Total optimized policies created: %', policy_count;

    -- Verify RLS is still enabled on all tables
    FOR policy_count IN
        SELECT COUNT(*) FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relrowsecurity = true
        AND c.relname IN ('users', 'posts', 'comments', 'reactions', 'weather_alerts', 'emergency_resources')
    LOOP
        RAISE NOTICE 'Tables with RLS enabled: %', policy_count;
    END LOOP;
END $$;

-- Record completion time
DO $$
BEGIN
    RAISE NOTICE 'Completed RLS policy optimization at %', now();
    RAISE NOTICE 'IMPORTANT: Test authentication functionality thoroughly before deploying to production';
END $$;

COMMIT;

-- =====================================================
-- TESTING QUERIES - Run after migration to verify
-- =====================================================
/*
-- Test these queries to ensure RLS policies work correctly:

-- 1. Test user can see own profile
SELECT id, email, first_name FROM users WHERE id = auth.uid();

-- 2. Test user can see posts
SELECT id, title, user_id FROM posts ORDER BY created_at DESC LIMIT 5;

-- 3. Test user can create post (replace with actual user values)
INSERT INTO posts (title, content, user_id, city, state)
VALUES ('Test Post', 'Test Content', auth.uid(), 'Test City', 'TS');

-- 4. Test user can update own post only
UPDATE posts SET title = 'Updated Test Post' WHERE user_id = auth.uid();

-- 5. Test user cannot update others' posts (should return 0 rows affected)
UPDATE posts SET title = 'Should Fail' WHERE user_id != auth.uid();
*/

-- =====================================================
-- ROLLBACK SCRIPT (if authentication breaks)
-- =====================================================
/*
-- EMERGENCY ROLLBACK: Restore basic RLS policies if issues occur

BEGIN;

-- Users table basic policies
CREATE POLICY "users_basic_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_basic_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_basic_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts table basic policies
CREATE POLICY "posts_basic_select" ON posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_basic_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_basic_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_basic_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Add similar basic policies for other tables...

COMMIT;
*/