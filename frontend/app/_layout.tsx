import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { LoadingScreen } from "../components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../utils/devTools";

function RootLayoutContent() {
  const { isAuthenticated, isLoading, hasLoggedOut, user } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

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

    return () => clearTimeout(navigationTimer);
  }, [isAuthenticated, isLoading, hasLoggedOut, user, hasNavigated]);

  useEffect(() => {
    setHasNavigated(false);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <>
        <StatusBar style="auto" />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="personal-information" options={{ headerShown: false }} />
        <Stack.Screen name="location-settings" options={{ headerShown: false }} />
        <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="user-feedback" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-security" options={{ headerShown: false }} />
        <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
        <Stack.Screen name="followers" options={{ headerShown: false }} />
        <Stack.Screen name="saved-posts" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]/edit" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/new" options={{ headerShown: false }} />
        <Stack.Screen name="alert/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="create-alert" options={{ headerShown: false }} />
        <Stack.Screen name="profile/search" options={{ headerShown: false }} />
        <Stack.Screen name="settings/location" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
