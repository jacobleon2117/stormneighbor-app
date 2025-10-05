# Supabase Database Performance Optimization - Execution Guide

## Overview
This guide contains the complete optimization process for the StormNeighbor app database. The optimization addresses critical performance issues identified by Supabase's performance linter.

## ⚠️ IMPORTANT SAFETY WARNINGS

### Before Execution:
1. **BACKUP YOUR DATABASE** - Create a full backup before running any scripts
2. **Test in Staging First** - Run all migrations in a staging environment
3. **Low Traffic Hours** - Execute during low-traffic periods
4. **Monitor Application** - Watch for errors after each migration
5. **Have Rollback Ready** - Keep rollback scripts accessible

### Risk Assessment:
- **Migration 001**: LOW risk - Index removal only
- **Migration 002**: MEDIUM risk - Changes authentication policies
- **Migration 003**: LOW risk - Adds indexes only

## Migration Files Created

### 📁 Migration Scripts:
1. `001_remove_duplicate_indexes.sql` - Remove duplicate indexes (30 min)
2. `002_optimize_rls_policies.sql` - Fix RLS performance (2 hours)
3. `003_add_missing_indexes.sql` - Add critical indexes (30 min)

## Step-by-Step Execution Instructions

### Step 1: Pre-Migration Validation
```sql
-- 1. Verify current database state
SELECT COUNT(*) as total_indexes FROM pg_indexes WHERE schemaname = 'public';
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- 2. Test critical application queries (time these for before/after comparison)
\timing on
SELECT * FROM posts WHERE city = 'Nashville' AND state = 'TN' ORDER BY created_at DESC LIMIT 20;
SELECT * FROM users WHERE id = auth.uid();
\timing off
```

### Step 2: Execute Migration 001 (Remove Duplicate Indexes)
```bash
# In Supabase SQL Editor or psql:
\i 001_remove_duplicate_indexes.sql

# Expected output:
# - Notice messages showing which indexes were dropped
# - Total database size reduction
# - No errors
```

**✅ Validation After Step 2:**
```sql
-- Verify duplicate indexes are gone
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test that queries still work
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM users;
```

### Step 3: Execute Migration 002 (Optimize RLS Policies)
```bash
# ⚠️ CRITICAL: This changes authentication behavior
\i 002_optimize_rls_policies.sql

# Expected output:
# - Notice messages for each table's policy optimization
# - Count of optimized policies created
# - No errors
```

**✅ Validation After Step 3:**
```sql
-- Test authentication still works
SELECT * FROM users WHERE id = auth.uid();

-- Test user can create posts
INSERT INTO posts (title, content, user_id, city, state)
VALUES ('Test Post', 'Test content', auth.uid(), 'Test City', 'TS');

-- Test user cannot access other users' data
UPDATE users SET email = 'test@test.com' WHERE id != auth.uid();
-- Should return 0 rows affected

-- Clean up test data
DELETE FROM posts WHERE title = 'Test Post' AND user_id = auth.uid();
```

### Step 4: Execute Migration 003 (Add Missing Indexes)
```bash
# This is safe - only adds performance improvements
\i 003_add_missing_indexes.sql

# Expected output:
# - Notice messages for each index created
# - Total index count and size
# - No errors
```

**✅ Validation After Step 4:**
```sql
-- Verify new indexes exist
SELECT COUNT(*) as new_index_count FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Test performance improvement (should be much faster)
\timing on
SELECT * FROM posts WHERE city = 'Nashville' AND state = 'TN' AND is_active = true
ORDER BY created_at DESC LIMIT 20;
\timing off
```

## Performance Testing & Validation

### Critical Test Queries:
```sql
-- 1. Location-based post search (primary app query)
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE city = 'Nashville' AND state = 'TN' AND is_active = true
ORDER BY created_at DESC LIMIT 20;

-- 2. User authentication queries
EXPLAIN ANALYZE
SELECT * FROM users WHERE id = auth.uid();

-- 3. Message conversation loading
EXPLAIN ANALYZE
SELECT c.*, m.content as last_message
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
ORDER BY c.last_message_at DESC LIMIT 10;

-- 4. Post reactions and comments
EXPLAIN ANALYZE
SELECT p.*, COUNT(r.id) as reaction_count, COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN reactions r ON p.id = r.post_id
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.city = 'Austin' AND p.state = 'TX'
GROUP BY p.id ORDER BY p.created_at DESC LIMIT 20;
```

### Expected Performance Improvements:
- **Location queries**: 50-1000x faster (from table scans to index seeks)
- **Authentication**: 10-100x faster (RLS policy optimization)
- **Post listings**: 5-50x faster (better indexes + RLS)
- **Storage usage**: ~30% reduction from duplicate index removal

## Application Testing Checklist

After all migrations, test these critical app functions:

### 🔐 Authentication:
- [ ] User registration
- [ ] User login/logout
- [ ] Profile updates
- [ ] Password reset

### 📝 Posts:
- [ ] Create new post
- [ ] View post listings by location
- [ ] Search posts with filters
- [ ] Like/unlike posts
- [ ] Edit own posts
- [ ] Delete own posts

### 💬 Messaging:
- [ ] Send messages
- [ ] View conversation list
- [ ] Load message history
- [ ] Mark messages as read

### 🔔 Notifications:
- [ ] Receive notifications
- [ ] Mark notifications as read
- [ ] Notification badge counts

### 🌍 Location Features:
- [ ] Location-based post filtering
- [ ] Weather alerts by location
- [ ] Emergency resource lookup

## Monitoring & Metrics

### Key Metrics to Track:
```sql
-- Query performance monitoring
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%posts%' OR query LIKE '%users%'
ORDER BY total_time DESC;

-- Index usage monitoring
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Database size tracking
SELECT
    pg_size_pretty(pg_database_size(current_database())) as total_size,
    pg_size_pretty(pg_total_relation_size('posts')) as posts_size,
    pg_size_pretty(pg_total_relation_size('users')) as users_size;
```

## Emergency Rollback Procedures

### If Authentication Breaks (Migration 002):
```sql
-- Emergency: Restore basic RLS policies
BEGIN;

-- Users table
DROP POLICY IF EXISTS "users_select_optimized" ON users;
DROP POLICY IF EXISTS "users_update_optimized" ON users;
DROP POLICY IF EXISTS "users_insert_optimized" ON users;

CREATE POLICY "users_basic_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_basic_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_basic_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Repeat for other tables as needed...
COMMIT;
```

### If Performance Degrades (Migration 001):
```sql
-- Recreate critical indexes if needed
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
-- Add others as needed
```

### If New Indexes Cause Issues (Migration 003):
```sql
-- Drop specific problematic indexes
DROP INDEX IF EXISTS idx_posts_location_active_time;
-- Drop others as needed
```

## Success Criteria

### ✅ Optimization Complete When:
1. All migrations execute without errors
2. Application functions normally (all features work)
3. Query performance shows measurable improvement
4. No increase in application error rates
5. Authentication and security policies work correctly

### 📊 Performance Benchmarks:
- Location searches: Sub-100ms response time
- User authentication: Sub-50ms response time
- Post listings: Sub-200ms response time
- Database size: 20-30% reduction from index cleanup

## Post-Optimization Tasks

### Week 1: Monitor Closely
- Check application error rates daily
- Monitor query performance metrics
- Validate user feedback on app speed
- Watch for any authentication issues

### Week 2-4: Performance Analysis
- Analyze index usage statistics
- Identify any unused new indexes
- Optimize further based on real usage patterns
- Document performance improvements

### Month 1+: Maintenance
- Set up automated monitoring for query performance
- Schedule regular index maintenance
- Plan future optimization cycles
- Update development team on new patterns

## Contact & Support

If issues arise during migration:
1. Check rollback scripts first
2. Monitor application error logs
3. Review Supabase performance dashboard
4. Contact database administrator if needed

---
**Remember**: Database optimization is an iterative process. This migration addresses the most critical issues, but ongoing monitoring and optimization will be needed as the application scales.