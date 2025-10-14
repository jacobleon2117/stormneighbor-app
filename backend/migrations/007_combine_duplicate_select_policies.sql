-- Migration: Combine Duplicate SELECT Policies
-- This migration combines multiple SELECT policies on the same table to improve performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- 1. Fix posts table - has 2 SELECT policies
-- Drop the duplicate policies
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Posts are readable by all authenticated users" ON posts;

-- Create a single combined policy
CREATE POLICY posts_select_all ON posts
    FOR SELECT
    USING (true);

-- 2. Fix users table - has 2 SELECT policies
-- Drop the duplicate policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create a single combined policy that allows:
-- - All users to read all user data (for public profiles)
-- - Users to read their own data
CREATE POLICY users_select_all ON users
    FOR SELECT
    USING (true);

-- Migration 007 complete: Duplicate SELECT policies combined for better performance
