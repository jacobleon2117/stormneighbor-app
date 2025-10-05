# Supabase Database Performance Optimization Plan

## Critical Issues Identified

Based on Supabase's performance linter analysis, we have 3 major categories of issues:

### 1. RLS (Row Level Security) Performance Issues ⚠️ CRITICAL
**Problem**: RLS policies re-evaluate `auth.<function>()` for EVERY row, causing massive performance degradation.

**Affected Tables & Policies**:
- `users`: "Users can read own data", "Enable read access for authenticated users", "Enable users to update own profile", "Enable users to insert own profile"
- `posts`: "Enable insert for authenticated users", "Enable update for authenticated users", "Enable delete for authenticated users"
- `comments`: "Enable insert for authenticated users", "Enable update for authenticated users", "Enable delete for authenticated users"
- `reactions`: "Enable insert for authenticated users", "Enable delete for authenticated users"
- `weather_alerts`: "Enable insert for authenticated users", "Enable update for authenticated users"
- `emergency_resources`: "Enable insert for authenticated users", "Enable update for authenticated users"

**Fix**: Replace `auth.uid()` with `(select auth.uid())` in all RLS policies.

### 2. Multiple Permissive Policies ⚠️ HIGH
**Problem**: Multiple RLS policies for same role/action combination - each must be executed per query.

**Affected Tables**:
- `posts`: Multiple SELECT policies for authenticated users: "Enable read access for all users" + "Posts are readable by all authenticated users"
- `users`: Multiple SELECT policies for various roles (anon, authenticated, authenticator, dashboard_user)

**Fix**: Consolidate redundant policies into single optimized policies.

### 3. Duplicate Indexes ⚠️ HIGH
**Problem**: Identical indexes waste storage and slow down writes.

**Confirmed Duplicates**:
- `comments`: `idx_comments_user` + `idx_comments_user_id`
- `posts`: `idx_posts_city` + `idx_posts_location_city`
- `posts`: `idx_posts_user` + `idx_posts_user_id`
- `reactions`: `idx_reactions_comment` + `idx_reactions_comment_id`
- `users`: `idx_users_city` + `idx_users_location_city`
- `weather_alerts`: `idx_alerts_location` + `idx_weather_alerts_city`
- `weather_alerts`: `idx_weather_alerts_areas` + `idx_weather_alerts_location`

**Fix**: Drop duplicate indexes, keep the most descriptively named ones.

## Optimization Implementation Plan

### Phase 1: Remove Duplicate Indexes (Quick Wins)
**Estimated Time**: 30 minutes
**Impact**: Immediate storage savings, faster writes

```sql
-- Drop duplicate indexes (keep the more descriptive names)
DROP INDEX IF EXISTS idx_comments_user;           -- Keep idx_comments_user_id
DROP INDEX IF EXISTS idx_posts_city;              -- Keep idx_posts_location_city
DROP INDEX IF EXISTS idx_posts_user;              -- Keep idx_posts_user_id
DROP INDEX IF EXISTS idx_reactions_comment;       -- Keep idx_reactions_comment_id
DROP INDEX IF EXISTS idx_users_city;              -- Keep idx_users_location_city
DROP INDEX IF EXISTS idx_alerts_location;         -- Keep idx_weather_alerts_city
DROP INDEX IF EXISTS idx_weather_alerts_areas;    -- Keep idx_weather_alerts_location
```

### Phase 2: Fix RLS Policy Performance (Critical)
**Estimated Time**: 2 hours
**Impact**: Massive query performance improvement

For each affected table, update RLS policies to use subqueries:

**Before (Slow)**:
```sql
CREATE POLICY "Enable read access" ON users FOR SELECT
USING (auth.uid() = id);
```

**After (Fast)**:
```sql
CREATE POLICY "Enable read access" ON users FOR SELECT
USING ((SELECT auth.uid()) = id);
```

### Phase 3: Consolidate Multiple Policies
**Estimated Time**: 1 hour
**Impact**: Reduced policy evaluation overhead

Combine redundant policies into single, efficient policies.

### Phase 4: Add Missing Critical Indexes
**Estimated Time**: 30 minutes
**Impact**: Faster location-based queries

```sql
-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_location_composite ON posts(city, state, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_active_location ON posts(is_active, city, state) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, created_at);
```

## Implementation Scripts

### Script 1: Remove Duplicate Indexes
```sql
-- Safe removal of duplicate indexes
BEGIN;

-- Comments table
DROP INDEX IF EXISTS idx_comments_user;

-- Posts table
DROP INDEX IF EXISTS idx_posts_city;
DROP INDEX IF EXISTS idx_posts_user;

-- Reactions table
DROP INDEX IF EXISTS idx_reactions_comment;

-- Users table
DROP INDEX IF EXISTS idx_users_city;

-- Weather alerts table
DROP INDEX IF EXISTS idx_alerts_location;
DROP INDEX IF EXISTS idx_weather_alerts_areas;

COMMIT;
```

### Script 2: Fix RLS Policies (Sample - Users Table)
```sql
-- Fix users table RLS policies
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable users to update own profile" ON users;
DROP POLICY IF EXISTS "Enable users to insert own profile" ON users;

-- Create optimized policies with subqueries
CREATE POLICY "users_select_own" ON users FOR SELECT
USING ((SELECT auth.uid()) = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
USING ((SELECT auth.uid()) = id);

CREATE POLICY "users_insert_own" ON users FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

COMMIT;
```

### Script 3: Add Missing Indexes
```sql
-- Add critical missing indexes
BEGIN;

-- Location-based post searches (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_posts_location_active_time
ON posts(city, state, is_active, created_at)
WHERE is_active = true;

-- Message conversations (ordered by time)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at DESC);

-- User location searches
CREATE INDEX IF NOT EXISTS idx_users_active_location
ON users(is_active, location_city, address_state)
WHERE is_active = true;

-- Emergency alerts by location and severity
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active_location
ON weather_alerts(is_active, city, state, severity)
WHERE is_active = true;

COMMIT;
```

## Performance Impact Estimates

### Before Optimization:
- **RLS Policies**: O(n) evaluation per row = extremely slow with large datasets
- **Duplicate Indexes**: ~30% storage waste, slower writes
- **Missing Indexes**: Full table scans for location queries

### After Optimization:
- **RLS Policies**: O(1) evaluation per query = 10-100x faster
- **Index Cleanup**: 30% storage savings, faster writes
- **New Indexes**: Location queries 50-1000x faster

## Risk Assessment & Rollback Plan

### Low Risk Changes:
- ✅ Removing duplicate indexes (can recreate if needed)
- ✅ Adding new indexes (can drop if performance issues)

### Medium Risk Changes:
- ⚠️ RLS policy updates (test thoroughly in staging first)

### Rollback Plan:
```sql
-- Emergency rollback for RLS policies
-- Keep original policy backups
-- Can recreate indexes quickly if needed
```

## Testing Strategy

### Pre-Optimization Benchmarks:
1. Time `SELECT * FROM posts WHERE city = 'Nashville' AND state = 'TN'`
2. Measure RLS policy execution time for user queries
3. Check total database size and index sizes

### Post-Optimization Validation:
1. Confirm all queries still work correctly
2. Measure performance improvements
3. Verify security policies still enforce correctly
4. Check for any broken application functionality

## Monitoring & Metrics

### Key Metrics to Track:
- Query execution time (especially location-based searches)
- Database storage usage
- Index hit ratio
- RLS policy execution time
- Application error rates

### Success Criteria:
- ✅ 50%+ improvement in location query performance
- ✅ 30%+ reduction in database storage usage
- ✅ No increase in application errors
- ✅ RLS policies still enforce security correctly

## Implementation Timeline

**Total Estimated Time**: 4 hours

1. **Phase 1** (30 min): Remove duplicate indexes
2. **Phase 2** (2 hours): Fix RLS policies
3. **Phase 3** (1 hour): Consolidate policies
4. **Phase 4** (30 min): Add missing indexes

**Recommended Schedule**:
- Execute during low-traffic hours
- Have rollback scripts ready
- Monitor application closely post-deployment