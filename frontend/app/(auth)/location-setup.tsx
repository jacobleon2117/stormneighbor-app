import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MapPin, Navigation, Edit3, ChevronRight } from "lucide-react-native";
import * as Location from "expo-location";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export default function LocationSetupScreen() {
  const { refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"permissions" | "location">("permissions");
  const [locationGranted, setLocationGranted] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const handleRequestPermissions = async () => {
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      let backgroundStatus = "denied";
      if (status === "granted") {
        try {
          const bgPermission = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = bgPermission.status;
        } catch (bgError) {
          console.warn("Background location not available in Expo Go:", bgError);
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
      console.error("Error requesting permissions:", error);
      console.log("Continuing with manual location entry...");
      setStep("location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!locationGranted) {
      Alert.alert("Error", "Location permission not granted");
      return;
    }

    setIsLoading(true);
    try {
      const location = await Location.getCurrentLocationAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResult) {
        await apiService.updateProfile({
          homeCity: addressResult.city || addressResult.subregion || "",
          homeState: addressResult.region || addressResult.isoCountryCode || "",
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        await refreshProfile();
        router.push("/(auth)/notifications-setup");
      } else {
        Alert.alert("Error", "Unable to determine address from location. Please enter manually.");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Unable to get current location. Please enter manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLocation = async () => {
    if (!city.trim() || !state.trim()) {
      Alert.alert("Error", "Please enter both city and state");
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateProfile({
        homeCity: city.trim(),
        homeState: state.trim(),
      });

      await refreshProfile();
      router.push("/(auth)/notification-setup");
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/(auth)/notification-setup");
  };

  if (step === "permissions") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <MapPin size={64} color={Colors.primary[600]} />
            <Text style={styles.title}>Location Setup</Text>
            <Text style={styles.subtitle}>
              Get accurate weather alerts and connect with your local community
            </Text>
          </View>

          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Navigation size={24} color={Colors.success[600]} />
              <Text style={styles.benefitText}>Accurate weather for your area</Text>
            </View>
            <View style={styles.benefitItem}>
              <MapPin size={24} color={Colors.primary[600]} />
              <Text style={styles.benefitText}>Connect with local neighbors</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={isLoading ? "Setting up..." : "Enable Location"}
              onPress={handleRequestPermissions}
              loading={isLoading}
              disabled={isLoading}
              style={styles.primaryButton}
            />

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setStep("location")}
              disabled={isLoading}
            >
              <Text style={styles.skipText}>Set Location Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MapPin size={48} color={Colors.primary[600]} />
          <Text style={styles.title}>Your Location</Text>
          <Text style={styles.subtitle}>
            {locationGranted
              ? "Use your current location or enter manually"
              : "Enter your city and state to get started"
            }
          </Text>
        </View>

        <View style={styles.form}>
          {locationGranted && (
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLoading}
            >
              <Navigation size={20} color={Colors.primary[600]} />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
              <ChevronRight size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Enter your city"
            required
          />

          <Input
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="Enter your state"
            required
          />
        </View>

        <View style={styles.actions}>
          <Button
            title={isLoading ? "Saving..." : "Continue"}
            onPress={handleManualLocation}
            loading={isLoading}
            disabled={isLoading || !city.trim() || !state.trim()}
            style={styles.primaryButton}
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipText}>Skip for Now</Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  benefits: {
    marginBottom: 32,
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 12,
    padding: 16,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.primary[700],
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});