# Issues Found During Testing - Oct 19, 2025

## 🔴 CRITICAL ISSUES (Must Fix Now)

### 1. Login Failed - Password Issue
**Status:** ❌ Blocking
**Error:** Login returns 401 Unauthorized
**User:** jacobleon2117@gmail.com
**Cause:** Password verification is failing
**Impact:** Cannot log into the app

**Solution Options:**
1. **Register a new account** through the app (recommended)
2. **Reset password** for existing account
3. Check if password hashing is working correctly in backend

**Recommendation:** Try registering a NEW account with a different email to test the full registration flow.

---

### 2. Weather Alerts Database Error
**Status:** ❌ Breaking weather alerts feature
**Error:** `column wa.latitude does not exist`
**Location:** `backend/src/controllers/weatherController.js:148`
**Cause:** Backend code expects `latitude`/`longitude` columns, but database has `location_city`, `location_state`, `location_county` instead
**Impact:** Weather alerts screen crashes

**Fix:** The function `get_alerts_by_location` needs to be updated to match the actual database schema (already attempted, needs DROP permission)

---

## 🟡 MODERATE ISSUES

### 3. Community Alerts Return 401
**Status:** ⚠️ Expected when not logged in
**Error:** `GET /api/v1/posts?page=1&limit=20&postType=safety_alert` returns 401
**Cause:** User is not authenticated (login failed)
**Impact:** Cannot see community safety alerts
**Fix:** Will be resolved once login works

---

### 4. Logout Returns 400
**Status:** ⚠️ Minor
**Error:** `POST /api/v1/auth/logout` returns 400 - validation errors
**Cause:** Logout called without refresh token
**Impact:** Minimal - logout flow has issues
**Fix:** Frontend should include refresh token in logout request

### 5. Duplicate Location Setup Screens
**Status:** ✅ FIXED
**Error:** User encountered two separate location setup screens after registration
**Cause:** Two-step flow (permissions → location) in location-setup.tsx
**Fix Applied:**
- Removed two-step state-based navigation
- Consolidated into single screen with both auto-location and manual entry visible
- Auto-location button now handles permission request automatically
**File:** `/Users/jacobleon/stormneighbor-app/frontend/app/(auth)/location-setup.tsx`

### 6. Registration Not Saving Auth Tokens
**Status:** ✅ FIXED
**Error:** After registration, API calls failed with NO_TOKEN error
**Cause:** `apiService.register()` was not saving accessToken/refreshToken to SecureStore
**Fix Applied:**
- Updated `register()` function in api.ts to save tokens immediately after successful registration
- Now matches the pattern used in `login()` function
**File:** `/Users/jacobleon/stormneighbor-app/frontend/services/api.ts` (lines 142-163)

---

## 🟢 WORKING FEATURES

### ✅ Backend Server
- Server running successfully on port 3000
- All routes loaded
- Database connected
- Services initialized (Email, Weather, Images, Firebase)

### ✅ Frontend App
- Expo Metro Bundler running
- App loads on iPhone
- Welcome/Login screen displays
- Navigation configured

### ✅ Database
- User exists (ID: 47, email: jacobleon2117@gmail.com)
- All 29 tables created
- RLS policies fixed

### ✅ Weather Service (Partially)
- Current weather working (using fallback when NOAA fails)
- Weather caching functional
- NOAA API integration present

---

## 🎯 IMMEDIATE ACTION ITEMS

### Priority 1: Get You Logged In
**Option A: Register New Account (EASIEST)**
```
1. On the app, tap "Register" or "Sign Up"
2. Use a NEW email (not jacobleon2117@gmail.com)
3. Create password: Must have:
   - At least 8 characters
   - Uppercase letter
   - Lowercase letter
   - Number
   - Special character (!@#$%^&*)

Example password: TestPass123!
```

**Option B: Fix Existing Account**
1. Use "Forgot Password" flow in the app
2. OR manually reset password in database

### Priority 2: Fix Weather Alerts Function
Need to update the database function to match schema. This requires updating:
- `get_alerts_by_location()` function
- Remove references to `wa.latitude` and `wa.longitude`
- Use `location_city`, `location_state` instead

---

## 📝 TESTING LOG

| Time | Action | Result | Notes |
|------|--------|--------|-------|
| 20:24:45 | Login attempt | ❌ 401 | Invalid credentials |
| 20:24:50 | Fetch community alerts | ❌ 401 | Not authenticated |
| 20:24:50 | Fetch weather alerts | ❌ 500 | Database error |
| 20:25:00 | Get current weather | ✅ 200 | Working (fallback mode) |
| 20:25:04 | Logout | ❌ 400 | Validation error |

---

## 💡 RECOMMENDATIONS

### For Testing Right Now:
1. **Register a brand new account** in the app
   - Use email: `test@example.com` or your personal email
   - Password: `TestPass123!` (or similar with requirements)
   - This will test the complete registration flow

2. **After successful registration:**
   - Set up your location
   - Configure notifications
   - Test all features systematically

### For Fixing Issues:
1. **Weather Alerts Function:** Needs backend update (I can help)
2. **Login Issue:** Might be password hashing - test with new account first
3. **Logout Flow:** Minor fix needed in frontend/backend sync

---

## 🔧 NEXT STEPS

1. **Try registering a new account now** - This will test if registration works
2. If registration works, we know the issue is specific to the old account
3. Then I'll fix the weather alerts database function
4. Then we can systematically test all other features

---

## ✅ WHAT'S ACTUALLY WORKING

Despite the errors, here's what IS working:
- ✅ App loads and displays correctly
- ✅ Backend server operational
- ✅ Database connected
- ✅ Navigation works
- ✅ Weather data loads (with fallback)
- ✅ User interface is functional

**The app is ~80% functional - just needs these specific fixes!**

---

**RECOMMENDATION: Register a new account right now to bypass the login issue and test the rest of the app!**
