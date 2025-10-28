# How to Start StormNeighbor App for Testing

## 🚀 Quick Start - Physical iPhone Testing

### Prerequisites
1. **Install Expo Go** on your iPhone from the App Store
2. **Make sure your iPhone and Mac are on the same WiFi network**
3. Backend server should be running (already running on port 3000)

### Commands to Run

```bash
# 1. Navigate to frontend directory
cd /Users/jacobleon/stormneighbor-app/frontend

# 2. Start Expo development server
npx expo start

# 3. Follow the on-screen instructions:
#    - Press 'i' for iOS Simulator (if you have Xcode)
#    - Scan QR code with Expo Go app on your iPhone
#    - Or press 's' to switch to Expo Go mode
```

### Alternative: If Same WiFi Network Doesn't Work

```bash
# Use tunnel mode (requires ngrok account but free)
cd /Users/jacobleon/stormneighbor-app/frontend
npx expo start --tunnel
```

---

## 🖥️ iOS Simulator Testing (Requires Xcode)

```bash
# Build and run on iOS Simulator
cd /Users/jacobleon/stormneighbor-app/frontend
npx expo run:ios

# This will:
# 1. Build a development version of your app
# 2. Install it in iOS Simulator
# 3. Launch the app automatically
```

---

## 🔄 What's Currently Running

✅ **Backend Server:** http://localhost:3000 (API ready)
- All 136 endpoints active
- Database connected
- Services initialized

⏳ **Frontend:** Ready to start with commands above

---

## 📋 Step-by-Step for Physical iPhone

### Step 1: Open Terminal
```bash
cd /Users/jacobleon/stormneighbor-app/frontend
```

### Step 2: Start Expo
```bash
npx expo start
```

### Step 3: You'll see something like:
```
› Metro waiting on exp://192.168.1.xxx:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

### Step 4: Testing Options

**Option A: Use Expo Go App (Recommended)**
1. Open **Expo Go** app on your iPhone
2. Tap **"Scan QR Code"**
3. Point camera at the QR code in terminal
4. App will load!

**Option B: Use iPhone Camera**
1. Open **Camera** app on iPhone
2. Point at QR code
3. Tap the notification that appears
4. Opens in Expo Go

**Option C: Manual Entry in Expo Go**
1. Open Expo Go app
2. Tap **"Enter URL manually"**
3. Type: `exp://192.168.1.xxx:8081` (replace xxx with your IP from terminal)

---

## 🐛 Troubleshooting

### If QR Code Won't Scan
```bash
# Try tunnel mode
npx expo start --tunnel
# This works across different networks
```

### If App Won't Load
```bash
# Clear cache and restart
npx expo start --clear
```

### If Metro Bundler Won't Start
```bash
# Kill all processes and restart
pkill -f "expo start"
pkill -f "node.*metro"
npx expo start
```

### If iPhone Can't Connect
1. Check both devices on same WiFi
2. Make sure Mac firewall isn't blocking (System Settings > Network > Firewall)
3. Try tunnel mode: `npx expo start --tunnel`

---

## ✅ What to Test First

Once the app loads on your iPhone:

1. **Welcome Screen** - Should see app intro
2. **Register** - Create a new account
3. **Location Setup** - Allow location permissions
4. **Notification Setup** - Configure preferences
5. **Home Feed** - See empty state or sample posts
6. **Navigation** - Try all bottom tabs
7. **Create Post** - Test camera/photo picker
8. **Weather** - View current weather data
9. **Profile** - View and edit profile

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Start Expo (normal) | `npx expo start` |
| Start with tunnel | `npx expo start --tunnel` |
| Clear cache | `npx expo start --clear` |
| iOS Simulator | `npx expo run:ios` |
| Stop Expo | `Ctrl+C` in terminal or `pkill -f "expo start"` |
| Check Backend | `curl http://localhost:3000/api/v1/auth/test-email` |

---

## 🎯 Current Status

- ✅ Backend: Running on port 3000
- ✅ Database: Connected to Supabase
- ✅ Frontend: Ready to start
- ✅ All dependencies: Installed
- ✅ Security: Fixed
- ✅ Configuration: Complete

**You're ready to test! Just run the commands above.** 🚀
