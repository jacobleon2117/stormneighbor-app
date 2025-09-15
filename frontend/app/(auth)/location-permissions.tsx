import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { MapPin, Navigation, Home, Shield } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";

export default function LocationPermissionsScreen() {
  const { refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    try {
      await Location.getForegroundPermissionsAsync();
    } catch (error) {
      console.error("Error checking location permissions:", error);
    }
  };

  const handleRequestLocation = async () => {
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      let backgroundStatus = "denied";
      if (status === "granted") {
        const bgPermission = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = bgPermission.status;
      }

      const locationPreferences = {
        useCurrentLocationForWeather: status === "granted",
        useCurrentLocationForAlerts: backgroundStatus === "granted",
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

      await refreshProfile();

      router.push("/(auth)/home-address-setup");
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      Alert.alert(
        "Error",
        "Unable to request location permissions. You can continue and set this up later in settings.",
        [
          {
            text: "Continue Anyway",
            onPress: () => router.push("/(auth)/home-address-setup"),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const locationPreferences = {
        useCurrentLocationForWeather: false,
        useCurrentLocationForAlerts: false,
        allowBackgroundLocation: false,
        shareLocationInPosts: false,
      };

      const locationPermissions = {
        foreground: "denied",
        background: "denied",
        lastUpdated: new Date().toISOString(),
      };

      await apiService.updateProfile({
        locationPreferences,
        locationPermissions,
      });

      await refreshProfile();
      router.push("/(auth)/home-address-setup");
    } catch (error) {
      console.error("Error saving location preferences:", error);
      router.push("/(auth)/home-address-setup");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MapPin size={64} color={Colors.primary[600]} />
          <Text style={styles.title}>Location Access</Text>
          <Text style={styles.subtitle}>
            StormNeighbor works better with location access for accurate weather and local community
            updates.
          </Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Navigation size={24} color={Colors.success[600]} />
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Accurate Weather</Text>
              <Text style={styles.benefitDescription}>Get weather for your exact location</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Home size={24} color={Colors.primary[600]} />
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Local Community</Text>
              <Text style={styles.benefitDescription}>Connect with neighbors in your area</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Shield size={24} color={Colors.warning[600]} />
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Weather Alerts</Text>
              <Text style={styles.benefitDescription}>Get notified of severe weather nearby</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRequestLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <>
                <MapPin size={20} color={Colors.text.inverse} />
                <Text style={styles.primaryButtonText}>Enable Location</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            You can always change location settings later in your profile.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  benefits: {
    gap: 24,
    marginVertical: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  note: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
});
