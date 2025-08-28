# 🧪 StormNeighbor Testing Guide

## 📱 **For Friends & Family Testers**

### **How to Install & Test:**

1. **Download Expo Go** from the App Store
2. **Scan this QR code** (I'll give you the QR code)
3. **Create your account** with your real location
4. **Test these features:**
   - ✅ Sign up & location setup
   - ✅ Post something to the community
   - ✅ Check weather for your area  
   - ✅ View other people's posts on home feed
   - ✅ Try the alerts screen filters
   - ✅ Test notifications (local alerts)

### **What We're Testing:**
- 🏠 **Home Feed Sharing** - Can everyone see each other's posts?
- 🌦️ **Weather Features** - Location-based weather data
- 📍 **Location Services** - Proper location detection
- 🔔 **Notifications** - Local alerts (Firebase coming soon)
- 📱 **App Performance** - Smooth usage across devices

---

## 🛡️ **API Cost Protection (Don't Worry!)**

I've added limits to prevent any charges:
- **Weather API**: Max 10 requests per 15 minutes per person
- **Posts**: Max 3 posts per 5 minutes per person  
- **Uploads**: Max 5 images per 10 minutes per person
- **General API**: Max 50 requests per 15 minutes per person

**You can test freely - these limits prevent any unexpected costs!**

---

## 🚀 **For Jacob (Developer)**

### **Testing Checklist:**
- [ ] Test 1: Multiple users can see each other's posts
- [ ] Test 2: Weather works for different locations
- [ ] Test 3: Local notifications work (temp solution)
- [ ] Test 4: Rate limiting protects API costs
- [ ] Test 5: All screens work properly

### **Next Steps:**
1. **Fix Firebase** - Regenerate private key
2. **Monitor Usage** - Watch logs for API usage
3. **Gather Feedback** - Note any issues from testers
4. **Plan Dev Build** - After tunnel testing success

### **Commands:**
```bash
# Start tunnel for testing
cd frontend && npx expo start --tunnel

# Monitor API usage
cd backend && tail -f logs/app.log | grep "API_USAGE"

# Test local notifications
# Use TempNotificationService.sendTestNotification() in app
```

---

## 🆘 **If Issues:**

**App won't load?**
- Check internet connection
- Try refreshing in Expo Go
- Make sure QR code is recent

**Can't see posts?**
- Make sure location permissions are enabled
- Check if you're in the same general area as other testers

**API limits hit?**
- Wait 15 minutes for weather requests
- Wait 5 minutes for posting
- This is intentional cost protection!

**Questions?**
- Text Jacob with screenshots
- Include what you were trying to do when it broke