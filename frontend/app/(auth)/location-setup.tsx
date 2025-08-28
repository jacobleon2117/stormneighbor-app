import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
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
  const [manualEntry, setManualEntry] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Access Needed",
          "StormNeighbor needs location access to provide accurate weather alerts and connect you with your local community.",
          [
            {
              text: "Skip for Now",
              style: "cancel",
              onPress: () => setManualEntry(true),
            },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode[0];

      try {
        const profileData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          locationCity: address?.city || "Unknown City",
          addressState: address?.region || "Unknown State",
        };

        console.log("Attempting to save location data:", profileData);

        const updateResponse = await apiService.updateProfile(profileData);
        console.log("Location update response:", updateResponse);

        console.log("Location saved to profile successfully");

        console.log("Refreshing profile after location save...");
        const updatedUser = await refreshProfile();

        if (!updatedUser?.locationCity && !updatedUser?.latitude) {
          console.error("Warning: Location data not found in updated profile");
        } else {
          console.log("Location data verified in updated profile");
        }

        setLocationGranted(true);
      } catch (error) {
        console.error("Error saving location:", error);
        Alert.alert("Error", "Failed to save location. Please try again.");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "We couldn't get your location. You can enter it manually or try again.",
        [
          { text: "Enter Manually", onPress: () => setManualEntry(true) },
          { text: "Try Again", onPress: requestLocationPermission },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!city.trim() || !state.trim()) {
      Alert.alert("Missing Information", "Please enter both city and state.");
      return;
    }

    try {
      setIsLoading(true);

      const profileData = {
        locationCity: city.trim(),
        addressState: state.trim(),
      };

      console.log("Attempting to save manual location data:", profileData);

      const updateResponse = await apiService.updateProfile(profileData);
      console.log("Manual location update response:", updateResponse);

      console.log("Manual location saved successfully");

      console.log("Refreshing profile after manual location save...");
      const updatedUser = await refreshProfile();

      if (!updatedUser?.locationCity) {
        console.error(
          "Warning: Manual location data not found in updated profile"
        );
      } else {
        console.log("Manual location data verified in updated profile");
      }

      setLocationGranted(true);
    } catch (error) {
      console.error("Error saving manual location:", error);
      Alert.alert("Error", "Failed to save location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.push("/(auth)/notifications-setup");
  };

  const handleSkip = () => {
    router.push("/(auth)/notifications-setup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MapPin size={48} color={Colors.primary[500]} />
          </View>
          <Text style={styles.title}>Set Your Location</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience with accurate weather
            information and local community updates for your area.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {!locationGranted && !manualEntry && (
            <>
              <TouchableOpacity
                style={styles.locationOption}
                onPress={requestLocationPermission}
                disabled={isLoading}
              >
                <View style={styles.optionIcon}>
                  <Navigation size={24} color={Colors.primary[500]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Use Current Location</Text>
                  <Text style={styles.optionDescription}>
                    Get precise weather for where you are
                  </Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                ) : (
                  <ChevronRight size={20} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.locationOption}
                onPress={() => setManualEntry(true)}
              >
                <View style={styles.optionIcon}>
                  <Edit3 size={24} color={Colors.text.secondary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Enter Manually</Text>
                  <Text style={styles.optionDescription}>
                    Type your city and state
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </>
          )}

          {manualEntry && !locationGranted && (
            <View style={styles.manualForm}>
              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="Enter your city"
                autoCapitalize="words"
                required
              />
              <Input
                label="State"
                value={state}
                onChangeText={setState}
                placeholder="Enter your state"
                autoCapitalize="words"
                required
              />
              <Button
                title="Save Location"
                onPress={handleManualSave}
                loading={isLoading}
                style={styles.saveButton}
              />
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setManualEntry(false)}
              >
                <Text style={styles.backButtonText}>Back to Options</Text>
              </TouchableOpacity>
            </View>
          )}

          {locationGranted && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MapPin size={24} color={Colors.success[600]} />
              </View>
              <Text style={styles.successText}>Location Set!</Text>
              <Text style={styles.successDescription}>
                We'll use this to provide accurate weather and alerts for your
                area.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {locationGranted ? (
            <Button
              title="Continue"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          ) : (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for Now</Text>
            </TouchableOpacity>
          )}
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
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  optionsContainer: {
    flex: 1,
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  manualForm: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "center",
    padding: 8,
  },
  backButtonText: {
    color: Colors.primary[500],
    fontSize: 14,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: Colors.success[50],
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.success[100],
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.success[700],
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.success[600],
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    paddingTop: 24,
  },
  continueButton: {
    marginBottom: 16,
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    padding: 12,
  },
});
