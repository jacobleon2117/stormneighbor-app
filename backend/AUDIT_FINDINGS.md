# Database Schema vs Code Audit Findings

## Critical Mismatches Found

### 1. Table Name Mismatch: `post_reactions` vs `reactions`
**Files Affected:**
- `src/routes/posts.js` (line 469, 471)

**Issue:** Code references `post_reactions` table which doesn't exist. The actual table is `reactions`.

**Current Code:**
```sql
SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'like'
SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = $1
```

**Should Be:**
```sql
SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'like'
SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $1
```

**Status:** ❌ CRITICAL - Will cause query failures

---

### 2. Missing Column: `comments.is_active`
**Files Affected:**
- `src/routes/posts.js` (line 470, 475)
- Potentially other comment-related routes

**Issue:** Code checks for `is_active` column on `comments` table, but this column doesn't exist.

**Current Code:**
```sql
SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = true
```

**Options:**
1. Remove the `is_active` check (comments don't have soft delete)
2. Add `is_active` column to `comments` table for consistency

**Status:** ❌ CRITICAL - Will cause query failures

---

### 3. Existing Columns (No Issues)
✅ `posts.is_active` - EXISTS
✅ `users.is_active` - EXISTS
✅ `reactions` table - EXISTS (not `post_reactions`)

---

## Recommended Actions

### Immediate Fixes (Required)
1. **Fix table name:** Change all `post_reactions` references to `reactions`
2. **Fix comments query:** Remove `is_active` check from comments queries OR add the column

### Option A: Remove is_active checks (Quick Fix)
Remove `AND is_active = true` from all comments queries since the table doesn't support soft deletes.

### Option B: Add is_active column (Consistent Approach)
Add `is_active BOOLEAN DEFAULT TRUE` to comments table to match posts/users pattern.

---

## Files Requiring Updates

### Backend Files with Mismatches:
1. `/backend/src/routes/posts.js` - Lines 339, 469-471, 475
2. (Need to check other files that may reference these)

---

## Next Steps
1. Search entire codebase for `post_reactions` references
2. Search entire codebase for `comments.*is_active` references
3. Create migration to fix schema OR fix code queries
4. Run tests to verify no other table/column mismatches exist
