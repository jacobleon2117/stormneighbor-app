# 🚀 Production Deployment Guide

## ⚠️ CRITICAL: Security First

### 🔴 IMMEDIATE ACTION REQUIRED - Rotate All Secrets

Your current `.env` files contain exposed secrets that MUST be changed before production:

1. **Database Password** - Change immediately in Supabase
2. **JWT_SECRET** - Generate new one (instructions below)
3. **Firebase Private Key** - Generate new service account
4. **Cloudinary API Secret** - Regenerate in dashboard
5. **Resend API Key** - Generate new key
6. **OpenWeather API Key** - Get production key

---

## 📋 Pre-Deployment Checklist

### Step 1: Generate New Secrets

```bash
# Generate new JWT secret (run this and copy output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate new encryption keys if needed
openssl rand -base64 32
```

### Step 2: Update Backend Production Environment

**DO NOT use your current `backend/.env` in production!**

Create production environment variables on your hosting platform (Railway, Heroku, etc.):

```bash
NODE_ENV=production
PORT=3000
CLIENT_URL=https://stormneighbor.app
BASE_URL=https://api.stormneighbor.app

# Database - UPDATE WITH NEW CREDENTIALS
DATABASE_URL=postgresql://NEW_USER:NEW_PASSWORD@host:5432/database
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# JWT - GENERATE NEW SECRET
JWT_SECRET=YOUR_NEW_64_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d

# Security
FORCE_HTTPS=true
TRUSTED_PROXIES=your_load_balancer_ip

# Email (Resend) - GENERATE NEW KEY
RESEND_API_KEY=re_NEW_KEY_HERE
FROM_EMAIL=noreply@stormneighbor.app
FROM_NAME=StormNeighbor

# Cloud Storage (Cloudinary) - REGENERATE
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_new_api_key
CLOUDINARY_API_SECRET=your_new_secret

# Firebase - GENERATE NEW SERVICE ACCOUNT
FIREBASE_PROJECT_ID="stormneighbor-app"
FIREBASE_PRIVATE_KEY_ID="new_key_id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nNEW_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@stormneighbor-app.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="new_client_id"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
SOCKET_CORS_ORIGIN=https://stormneighbor.app
ALLOWED_ORIGINS=https://stormneighbor.app,https://www.stormneighbor.app

# Redis (Optional - for production scale)
REDIS_URL=redis://your-redis-url:6379

# Logging
LOG_LEVEL=warn
```

### Step 3: Configure EAS Secrets for Frontend

```bash
cd frontend

# Set production API key (REQUIRED)
eas secret:create --scope project --name EXPO_PUBLIC_OPENWEATHER_API_KEY --value "your_production_openweather_key"

# Set other sensitive values as needed
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "stormneighbor-app"
```

### Step 4: Update Production URLs

Edit `frontend/eas.json` if your API URLs are different:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://YOUR_ACTUAL_API_URL/api/v1"
      }
    }
  }
}
```

---

## 🏗️ Building for Production

### Frontend - iOS/Android App

```bash
cd frontend

# Install dependencies
npm install

# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### Backend Deployment

**Option A: Railway**
```bash
cd backend
railway login
railway init
railway up
# Set environment variables in Railway dashboard
```

**Option B: Heroku**
```bash
cd backend
heroku create stormneighbor-api
git push heroku main
# Set environment variables with: heroku config:set VAR=value
```

**Option C: VPS/DigitalOcean**
```bash
# SSH into server
ssh your-server

# Clone and setup
git clone your-repo
cd backend
npm install
pm2 start src/server.js --name stormneighbor-api
```

---

## 🔒 Security Rotation Steps

### 1. Rotate Database Credentials

```bash
# In Supabase Dashboard:
1. Go to Settings > Database
2. Generate new password
3. Update DATABASE_URL in production environment
4. Restart backend server
```

### 2. Rotate JWT Secret

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update JWT_SECRET in production
# NOTE: This will invalidate all existing sessions
```

### 3. Rotate Firebase Keys

```bash
# In Firebase Console:
1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Delete old service account
4. Update FIREBASE_* variables
```

### 4. Rotate API Keys

- **Cloudinary**: Dashboard > Settings > Security > API Keys > Regenerate
- **Resend**: Dashboard > API Keys > Create new key, delete old
- **OpenWeather**: Account > API keys > Create new key

---

## 📱 App Store Submission

### iOS - App Store Connect

1. **Create App in App Store Connect**
   - Bundle ID: `com.stormneighbor.app`
   - App Name: StormNeighbor

2. **Prepare Assets**
   - App Icon: 1024x1024px
   - Screenshots for all device sizes
   - App Preview video (optional)

3. **App Information**
   - Category: Social Networking / Weather
   - Age Rating: 4+ (if no user-generated content issues)
   - Privacy Policy URL: Required

4. **Submit for Review**
   ```bash
   eas submit --platform ios --profile production
   ```

### Android - Google Play Console

1. **Create App in Play Console**
   - Package name: `com.stormneighbor.app`
   - App name: StormNeighbor

2. **Prepare Assets**
   - Icon: 512x512px
   - Feature graphic: 1024x500px
   - Screenshots for phone/tablet

3. **Submit for Review**
   ```bash
   eas submit --platform android --profile production
   ```

---

## ✅ Final Verification Checklist

Before going live, verify:

- [ ] All secrets have been rotated
- [ ] `.env` files are NOT in git repository
- [ ] Production API URL is set correctly in EAS config
- [ ] Push notifications are enabled (`EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true`)
- [ ] Backend is deployed and accessible
- [ ] Database is production-ready with backups configured
- [ ] SSL/HTTPS is enabled on backend
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is active
- [ ] Error monitoring is set up (Sentry, LogRocket, etc.)
- [ ] Firebase is configured with production credentials
- [ ] Cloudinary is set for production uploads
- [ ] Domain DNS is configured correctly
- [ ] Privacy policy is published
- [ ] Terms of service are published

---

## 🚨 Common Issues

### Issue: App can't connect to API
**Solution**: Check `EXPO_PUBLIC_API_BASE_URL` in EAS config matches your deployed backend URL

### Issue: Push notifications not working
**Solution**:
1. Verify Firebase credentials are correct
2. Check `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true`
3. Ensure iOS/Android push certificates are configured

### Issue: Images not uploading
**Solution**: Verify Cloudinary credentials and CORS settings

### Issue: Database connection fails
**Solution**: Check DATABASE_URL format and SSL settings

---

## 📞 Support

If you encounter issues:
1. Check logs: `eas build:list` for build logs
2. Monitor backend: Check your hosting platform's logs
3. Test in preview mode first: `eas build --profile preview`

---

## 🔄 Updating Production

```bash
# Frontend updates
cd frontend
eas build --platform all --profile production --auto-submit

# Backend updates
git push production main  # Or your deployment method
```

---

**Last Updated**: 2025-01-14
**Status**: Ready for deployment after security rotation
