import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MapPin, Navigation, ChevronRight } from "lucide-react-native";
import * as Location from "expo-location";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useErrorHandler } from "../../utils/errorHandler";
import { useLoadingState } from "../../utils/loadingStates";

export default function LocationSetupScreen() {
  const { refreshProfile } = useAuth();
  const errorHandler = useErrorHandler();
  const loadingState = useLoadingState();
  const [locationGranted, setLocationGranted] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Check if location permission is already granted
  React.useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationGranted(status === "granted");
    })();
  }, []);

  const handleUseCurrentLocation = async () => {
    loadingState.setLoading(true);
    try {
      // Request permission if not granted
      if (!locationGranted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          errorHandler.handleError("Location permission denied. Please enter manually.", "Location Access");
          loadingState.setLoading(false);
          return;
        }
        setLocationGranted(true);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResult) {
        const city = addressResult.city || addressResult.subregion || "";
        const state = addressResult.region || addressResult.isoCountryCode || "";

        if (!city || !state) {
          errorHandler.handleError(
            "Unable to determine address from location. Please enter manually.",
            "Address Lookup"
          );
          loadingState.setLoading(false);
          return;
        }

        await apiService.updateProfile({
          homeCity: city,
          homeState: state,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        await refreshProfile();
        router.replace("/(auth)/notifications-setup");
      } else {
        errorHandler.handleError(
          "Unable to determine address from location. Please enter manually.",
          "Address Lookup"
        );
      }
    } catch (error) {
      errorHandler.handleError(error, "Current Location");
    } finally {
      loadingState.setLoading(false);
    }
  };

  const handleManualLocation = async () => {
    if (!city.trim() || !state.trim()) {
      errorHandler.handleError("Please enter both city and state", "Manual Location");
      return;
    }

    loadingState.setLoading(true);
    try {
      await apiService.updateProfile({
        homeCity: city.trim(),
        homeState: state.trim(),
      });

      await refreshProfile();
      router.push("/(auth)/notifications-setup");
    } catch (error) {
      errorHandler.handleError(error, "Save Location");
    } finally {
      loadingState.setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/(auth)/notifications-setup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MapPin size={48} color={Colors.primary[600]} />
          <Text style={styles.title}>Your Location</Text>
          <Text style={styles.subtitle}>
            Get accurate weather alerts and connect with your local community
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
            disabled={loadingState.isLoading}
          >
            <Navigation size={20} color={Colors.primary[600]} />
            <Text style={styles.currentLocationText}>Use Current Location</Text>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

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
            title={loadingState.isLoading ? "Saving..." : "Continue"}
            onPress={handleManualLocation}
            loading={loadingState.isLoading}
            disabled={loadingState.isLoading || !city.trim() || !state.trim()}
            style={styles.primaryButton}
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loadingState.isLoading}
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
