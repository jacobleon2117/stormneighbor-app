FILE:PostCard.tsx - Is this done? what does that comment mean exactly?
  const handleShareToMessages = () => {
    // This would integrate with the existing messaging system
    closeModalImmediately(setShowShareModal, shareModalY);
    if (onMessage) {
      onMessage(post.userId, `${post.firstName} ${post.lastName}`);
    }
  };


FILE: messagesStore.ts - Is this done? what does that comment mean exactly?
    setCurrentConversation: (conversation) =>
      set((state) => {
        state.currentConversation = conversation;
      }),

    addMessage: (message) =>
      set((state) => {
        state.messages.push(message);

        const conversation = state.conversations.find((c) => c.id === message.conversationId);
        if (conversation) {
          conversation.lastMessage = {
            content: message.content,
            senderId: message.senderId,
            messageType: message.messageType,
            createdAt: message.createdAt,
          };
          conversation.lastMessageAt = message.createdAt;

          // Note: You might need to check against current user ID here
          if (!message.isRead) {
            conversation.unreadCount += 1;
          }
        }
      }),

FILE: pricacy-security.tsx - does this need to be finished now?
  return (
    <View style={styles.container}>
      <Header title="Privacy & Security" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          {renderActionItem(
            "lock-closed",
            "Change Password",
            "Update your account password",
            handleChangePassword
          )}

          {renderSetting(
            "Two-Factor Authentication",
            "Add extra security to your account",
            settings.twoFactorEnabled,
            (value) => updateSettings({ twoFactorEnabled: value }),
            true // Disabled for now (future)
          )}
        </View>

FILE: create-alert.tsx - do the comments mean we need to add debug or is it finsihed already?
      // Debug: Creating alert with data removed
      const response = await apiService.createAlert(alertData);
      // Debug: Create alert response removed


FILE: frontend/app/_layout.tsx - do the comments mean we need to add debug or is it finsihed already?
  useEffect(() => {
    const navigationTimer = setTimeout(() => {
      if (!isLoading && !hasNavigated) {
        if (isAuthenticated && user) {
          const hasLocation = user?.homeCity && user?.homeState;
          const hasNotificationPreferences =
            user?.notificationPreferences && Object.keys(user.notificationPreferences).length > 0;

          // Debug: Onboarding check removed

          if (!hasLocation) {
            // Debug: Redirecting to location setup
            router.replace("/(auth)/location-setup");
            setHasNavigated(true);
          } else if (!hasNotificationPreferences) {
            // Debug: Redirecting to notification setup
            router.replace("/(auth)/notifications-setup");
            setHasNavigated(true);
          } else {
            // Debug: Onboarding complete, going to main app
            router.replace("/(tabs)");
            setHasNavigated(true);
          }
        } else if (!isAuthenticated) {
          if (hasLoggedOut) {
            router.replace("/(auth)/login");
            setHasNavigated(true);
          } else {
            router.replace("/(auth)/welcome");
            setHasNavigated(true);
          }
        }
      }
    }, 300);

FILE: alerts.tsx - ✅ FULLY IMPLEMENTED REAL API
- Removed generateDemoAlerts() function entirely (63 lines deleted)
- Removed demo fallback logic - now uses 100% real API data
- Improved error handling with ErrorHandler.handleError() for user-visible errors
- Backend API fully functional with GET /api/v1/alerts
- Added new backend endpoint GET /api/v1/alerts/:id for individual alerts
- Weather alerts sync with NOAA/NWS API working in background
- Proper error states with retry button
- Empty state shows "No alerts" message (not an error)
        }

FILE: create.tsx - the comments mean what exaclty? is this implmented or not? if not let's implment it please.
  const handleGalleryPress = async () => {
    try {
      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

      let permissionStatus = currentStatus;

      if (currentStatus !== "granted") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        permissionStatus = status;
      }

      if (permissionStatus === "denied") {
        Alert.alert(
          "Photo Library Access Denied",
          "You've denied access to your photo library. To select images, please enable photo library access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {}, // Open settings - implement if needed
            },
          ]
        );
        return;
      }

        const handleCameraPress = async () => {
    try {
      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();

      let permissionStatus = currentStatus;

      if (currentStatus !== "granted") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        permissionStatus = status;
      }

      if (permissionStatus === "denied") {
        Alert.alert(
          "Camera Access Denied",
          "You've denied camera access. To take photos, please enable camera access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {}, // Open settings - implement if needed
            },
          ]
        );
        return;
      }

FILE: frontend/app/(tabs)index.tsx - ✅ FIXED
- Removed unused setError local state (now using usePostsError from store)
- Removed unused setFilters from destructuring
- Added usePostsError selector to postsStore.ts


FILE: messages.tsx - ✅ FULLY MIGRATED TO ZUSTAND
- Migrated to use messagesStore instead of local useState
- Removed unused errorHandler and useLoadingState imports
- Now using useConversationsList, useMessagesLoading, useMessagesError selectors
- All state management centralized in Zustand store


FILE: weather.tsx - so are we using the users home address only here? i thought we removed the home address location setrup screen? Why not get weather around the world? not just display current weather near the user but also provide the users weather/temp/rain/clouds/etc but i might be thinking about this wrong in a way lol. Basically yes we need the users current weather information to show them their current weather information, but if we use their home address what about when they're drving to somewhere lese then checking the app?
const getCurrentLocation = useCallback(async () => {
    try {
      // Determining best location for weather

      const homeLocation =
        user?.homeLatitude && user?.homeLongitude
          ? { latitude: user.homeLatitude, longitude: user.homeLongitude }
          : user?.latitude && user?.longitude
            ? { latitude: user.latitude, longitude: user.longitude }
            : undefined;

      const bestLocation = locationService.getBestLocationFor(
        "weather",
        homeLocation,
        user?.locationPreferences
      );

      if (bestLocation && bestLocation.source === "current") {
        // Using current GPS location for weather
        const address = await locationService.reverseGeocode(
          bestLocation.latitude,
          bestLocation.longitude
        );
        setLocation({
          latitude: bestLocation.latitude,
          longitude: bestLocation.longitude,
          city: address?.city || "Current Location",
          state: address?.region || "Unknown",
          source: "current",
        });
        return;
      }

      if (bestLocation && bestLocation.source === "home") {
        // Using home address for weather
        setLocation({
          latitude: bestLocation.latitude,
          longitude: bestLocation.longitude,
          city: user?.homeCity || user?.locationCity || "Your City",
          state: user?.homeState || user?.addressState || "State",
          source: "home",
        });
        return;
      }

      // No saved location found, requesting current GPS location
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        // Location permission denied, using fallback location
        setLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: "New York",
          state: "NY",
          source: "fallback",
        });
        return;
      }




FILE: location-setup.tsx - ✅ FIXED UNUSED IMPORTS
- Removed unused Alert, ActivityIndicator from react-native imports
- Removed unused Edit3 from lucide-react-native imports
- Note: Expo Go limitation with background location is documented in code comments
- Production build will work correctly with proper permissions

  const handleRequestPermissions = async () => {
    loadingState.setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      let backgroundStatus = "denied";
      if (status === "granted") {
        try {
          const bgPermission = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = bgPermission.status;
        } catch (bgError) {
          // Background location not available in Expo Go
          backgroundStatus = "denied";
        }
      }

      const locationPreferences = {
        useCurrentLocationForWeather: status === "granted",
        useCurrentLocationForAlerts: status === "granted", // Use foreground for Expo Go
        allowBackgroundLocation: backgroundStatus === "granted",
        shareLocationInPosts: status === "granted",
      };

      const locationPermissions = {
        foreground: status,
        background: backgroundStatus,
        lastUpdated: new Date().toISOString(),
      };

      await apiService.updateProfile({
        locationPreferences,
        locationPermissions,
      });

      setLocationGranted(status === "granted");
      setStep("location");
    } catch (error) {
      errorHandler.handleSilentError(error, "Location Permissions");
      // Debug: Continuing with manual location entry
      setStep("location");
    } finally {
      loadingState.setLoading(false);
    }
  };

import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { MapPin, Navigation, Edit3, ChevronRight } from "lucide-react-native";
I also changed this line: const location = await Location.getCurrentPositionAsync({


FILE: login.tsx - what does this comment mean exactly and am i missing features? code? what exactly?

  const checkBiometricAndAutoLogin = useCallback(async () => {
    try {
      if (!LocalAuthentication) {
        // LocalAuthentication not available
        return;
      }


FILE: notifications-setup.tsx - ✅ FIXED UNUSED IMPORTS
- Removed unused notificationsEnabled state variable
- Removed unused CheckCircle from lucide-react-native imports
- Removed unused Alert, ActivityIndicator from react-native imports
- Removed unused useState import (no longer needed)

const [notificationsEnabled, setNotificationsEnabled] = useState(false);
import { Bell, AlertTriangle, MessageSquare, Cloud, CheckCircle } from "lucide-react-native";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

also does this affect anything functointly in the real-world app if the app was in the apple store? like would this affect notifications setup and stuff or what?
      if (status === "granted") {
        try {
          // Skip push token registration in Expo Go to avoid errors
          // Push notifications enabled, but token registration skipped in development
        } catch (tokenError) {
          ErrorHandler.silent(tokenError as Error, "Get push token");
        }
      }


FOLDER: node_modules - need to fix this i think, right?
// @generated by expo-module-scripts { "extends": "expo-module-scripts/tsconfig.base", "compilerOptions": { "outDir": "./build" }, "include": ["./src"], "exclude": ["**/__mocks__/*", "**/__tests__/*", "**/__rsc_tests__/*"] } ⚠ Error File not found. Path to base configuration file to inherit from (requires TypeScript version 2.1 or later), or array of base files, with the rightmost files having the greater priority (requires TypeScript version 5.0 or later). this is in node_modules folder?


FILE: auth.test.js - do we need to add this or what does the comment mean?
    it("should reject registration with missing required fields", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: testUser.password,
          // Missing firstName and lastName
        })
        .expect(400);
    });


FILE: comments.test.js - what do the comments mean and do we need to finish the code? Do we need to add code to finsih it properly and properly implement whatever we need to do here?
    it("should require additional details for 'other' reason", async () => {
      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
          // Missing additionalDetails
        })
        .expect(400);

      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
          additionalDetails: "Some additional details",
        })
        .expect(401);
    });

    it("should prevent self-reporting", async () => {
      // This test needs to be implemented with actual user context
      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "spam",
        })
        .expect(401);
    });
  });

      it("should prevent circular reply references", async () => {
      // This needs more complex testing with actual comment IDs
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Reply with valid parent",
          parentCommentId: 1,
        })
        .expect(401);
    });
  });
});


FILE: notification.test.js - do we need to implement this or finsih it?
    it("should validate bulk operation limits", async () => {
      // Test that bulk operations don't allow excessive deletions
      // This needs to be implemented with actual data
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          onlyRead: true,
        })
        .expect(401);
    });
  });
});


FILE: posts.test.js - do we need to finish this?
    it("should return post details for valid ID", async () => {
      // This needs to require a test post to exist
      const response = await request(app).get("/api/v1/posts/1");

      expect([200, 404]).toContain(response.status);
    });
  });

      it("should require additional details for 'other' reason", async () => {
      await request(app)
        .post("/api/v1/posts/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
          // Missing additionalDetails
        })
        .expect(400);
    });


FILE: upload.test.js - do we need to do this?
    it("should validate file size limits", async () => {
      // This would need actual file upload testing
      const response = await request(app)
        .post("/api/v1/upload")
        .set("Authorization", "Bearer invalid-token");

      expect([400, 401]).toContain(response.status);
    });


FILE: users.test.js - do we need to implement these?
    it("should prevent self-following", async () => {
      // This needs to be tested with actual user context
      await request(app)
        .post("/api/v1/users/follow/1")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

    it("should validate device token format", async () => {
      await request(app)
        .post("/api/v1/users/device-token")
        .set("Authorization", "Bearer invalid-token")
        .send({
          token: "",
          platform: "ios",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/users/device-token")
        .set("Authorization", "Bearer invalid-token")
        .send({
          // Missing token
          platform: "ios",
        })
        .expect(400);
    });

  describe("GET /api/v1/users/search", () => {
    it("should validate search query", async () => {
      await request(app).get("/api/v1/users/search").expect(400); // Missing query parameter

      await request(app).get("/api/v1/users/search?q=").expect(400);

      await request(app).get("/api/v1/users/search?q=ab").expect(400);
    });



FILE: weather.test.js - do we need to fully implement this?
    it("should validate required fields", async () => {
      // Missing alertType
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          severity: "moderate",
          description: "Test alert",
        })
        .expect(400);

      // Missing severity
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          description: "Test alert",
        })
        .expect(400);

      // Missing description
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
        })
        .expect(400);
    });



FILE: security.js - look through this file and see why these comments say what they say and see if we can either fix, implement, or changed to fully get it working or whatever you might think.
      try {
        if (redisClient) {
          attempts = parseInt(await redisClient.get(key)) || 0;
        } else {
          // Fallback to memory-based tracking (not persistent but better than nothing)
          const memKey = `${email}:${req.ip}`;
          attempts = this.requestCounts.get(memKey) || 0;
        }

// Optional Redis setup - falls back to memory if Redis is unavailable
let redisClient = null;
let RedisStore = null;
let redisInitialized = false;

Okay i need you to check the CURRENT_ERRORS.md file in the docs folder in the root of the project, some are errors and some are questions and concerns. Look through everything and then start a todo list that will 100% fully properly implement anything that is missing, needed to be changed or added. You should probaly see how everything works with all of that information in the CURRENT_ERRORS.md file and make sure to understand what is going on and what else might need to be changed if you were to change anything throughout the backend/frontend. Please make sure to 100% fully implement anything if needed! 