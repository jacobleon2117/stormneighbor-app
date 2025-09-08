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
          const hasHomeLocation = user?.homeCity && user?.homeState;
          const hasLegacyLocation = user?.locationCity && user?.addressState;
          const hasLocationPreferences =
            user?.locationPreferences && Object.keys(user.locationPreferences).length > 0;

          const needsLocationOnboarding = !hasHomeLocation && !hasLegacyLocation;
          const needsPermissionsOnboarding = !hasLocationPreferences;

          console.log("Onboarding check:", {
            homeCity: user?.homeCity,
            homeState: user?.homeState,
            locationCity: user?.locationCity,
            addressState: user?.addressState,
            locationPreferences: user?.locationPreferences,
            hasHomeLocation,
            hasLegacyLocation,
            hasLocationPreferences,
            needsLocationOnboarding,
            needsPermissionsOnboarding,
          });

          if (needsPermissionsOnboarding) {
            console.log("Redirecting to location permissions setup");
            router.replace("/(auth)/location-permissions");
            setHasNavigated(true);
          } else if (needsLocationOnboarding) {
            console.log("Redirecting to home address setup");
            router.replace("/(auth)/home-address-setup");
            setHasNavigated(true);
          } else {
            console.log("Location onboarding complete, going to main app");
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
