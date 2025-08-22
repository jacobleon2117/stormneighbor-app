import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { router } from "expo-router";
import { LoadingScreen } from "../components/LoadingScreen";
import "../utils/devTools";

function RootLayoutContent() {
  const { isAuthenticated, isLoading, hasLoggedOut, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        const hasGPSLocation = user?.latitude && user?.longitude;
        const hasCityLocation = user?.locationCity;
        const needsOnboarding = !hasGPSLocation && !hasCityLocation;

        console.log("Onboarding check:", {
          locationCity: user?.locationCity,
          latitude: user?.latitude,
          longitude: user?.longitude,
          addressState: user?.addressState,
          hasGPSLocation,
          hasCityLocation,
          needsOnboarding,
          user: user ? "User object exists" : "No user object",
        });

        if (needsOnboarding) {
          console.log("Redirecting to location setup - missing location data");
          router.replace("/(auth)/location-setup");
        } else {
          console.log("Location data found, going to main app");
          router.replace("/(tabs)");
        }
      } else {
        if (hasLoggedOut) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(auth)/welcome");
        }
      }
    }
  }, [isAuthenticated, isLoading, hasLoggedOut, user]);

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
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
