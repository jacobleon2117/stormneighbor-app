import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Home, Navigation, CheckCircle } from "lucide-react-native";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { locationService } from "../../services/locationService";
import { useAuth } from "../../hooks/useAuth";

export default function HomeAddressSetupScreen() {
  const { refreshProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<"current" | "manual" | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [addressSet, setAddressSet] = useState(false);

  useEffect(() => {
    if (user?.homeCity && user?.homeState) {
      setAddressSet(true);
    }
  }, [user]);

  const useCurrentLocationAsHome = async () => {
    setMethod("current");
    setIsLoading(true);

    try {
      const canUseLocation = await locationService.canUseLocationFor("weather");

      if (!canUseLocation) {
        await locationService.showPermissionDeniedAlert("setting your home address");
        setMethod(null);
        return;
      }

      const location = await locationService.getCurrentLocation();

      if (!location) {
        Alert.alert("Error", "Unable to get your current location. Please try manual entry.");
        setMethod("manual");
        return;
      }

      const address = await locationService.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      if (!address) {
        Alert.alert(
          "Error",
          "Unable to determine address from your location. Please try manual entry."
        );
        setMethod("manual");
        return;
      }

      const homeAddressData = {
        homeAddress: `${address.streetNumber || ""} ${address.street || ""}`.trim() || undefined,
        homeCity: address.city || address.subregion,
        homeState: address.region,
        homeZipCode: address.postalCode,
        homeLatitude: location.coords.latitude,
        homeLongitude: location.coords.longitude,
      };

      await apiService.updateProfile(homeAddressData);
      await refreshProfile();

      setAddressSet(true);
    } catch (error: any) {
      console.error("Error setting home address from current location:", error);
      Alert.alert("Error", "Failed to set home address. Please try again.");
      setMethod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!formData.city.trim() || !formData.state.trim()) {
      Alert.alert("Missing Information", "Please enter at least your city and state.");
      return;
    }

    setIsLoading(true);

    try {
      let coordinates = null;

      if (formData.address.trim()) {
        const fullAddress =
          `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim();
        coordinates = await locationService.forwardGeocode(fullAddress);
      }

      if (!coordinates && formData.city.trim() && formData.state.trim()) {
        const cityStateAddress = `${formData.city}, ${formData.state}`;
        coordinates = await locationService.forwardGeocode(cityStateAddress);
      }

      const homeAddressData = {
        homeAddress: formData.address.trim() || undefined,
        homeCity: formData.city.trim(),
        homeState: formData.state.trim(),
        homeZipCode: formData.zipCode.trim() || undefined,
        homeLatitude: coordinates?.latitude,
        homeLongitude: coordinates?.longitude,
      };

      await apiService.updateProfile(homeAddressData);
      await refreshProfile();

      setAddressSet(true);
    } catch (error: any) {
      console.error("Error saving home address:", error);
      Alert.alert("Error", "Failed to save home address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.push("/(auth)/notifications-setup");
  };

  const renderMethodSelection = () => (
    <>
      <TouchableOpacity
        style={styles.methodOption}
        onPress={useCurrentLocationAsHome}
        disabled={isLoading}
      >
        <View style={styles.optionIcon}>
          <Navigation size={24} color={Colors.primary[500]} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Use Current Location</Text>
          <Text style={styles.optionDescription}>
            Set where you are right now as your home address
          </Text>
        </View>
        {isLoading && method === "current" ? (
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        ) : (
          <Text style={styles.optionArrow}>→</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.methodOption} onPress={() => setMethod("manual")}>
        <View style={styles.optionIcon}>
          <Home size={24} color={Colors.text.secondary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Enter Home Address</Text>
          <Text style={styles.optionDescription}>Manually type your home address</Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>
    </>
  );

  const renderManualForm = () => (
    <View style={styles.manualForm}>
      <Input
        label="Street Address (Optional)"
        value={formData.address}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
        placeholder="123 Main Street"
        autoCapitalize="words"
      />
      <Input
        label="City"
        value={formData.city}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, city: text }))}
        placeholder="Your city"
        autoCapitalize="words"
        required
      />
      <Input
        label="State"
        value={formData.state}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, state: text }))}
        placeholder="Your state"
        autoCapitalize="words"
        required
      />
      <Input
        label="ZIP Code (Optional)"
        value={formData.zipCode}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, zipCode: text }))}
        placeholder="12345"
        keyboardType="numeric"
        maxLength={10}
      />

      <View style={styles.formActions}>
        <Button
          title="Save Home Address"
          onPress={handleManualSave}
          loading={isLoading}
          style={styles.saveButton}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => setMethod(null)}>
          <Text style={styles.backButtonText}>Back to Options</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={48} color={Colors.success[600]} />
      </View>
      <Text style={styles.successTitle}>Home Address Set!</Text>
      <Text style={styles.successDescription}>
        We'll use this address to show you relevant community posts and weather alerts for your
        area.
      </Text>

      <View style={styles.addressDisplay}>
        <Text style={styles.addressLabel}>Your Home Address:</Text>
        <Text style={styles.addressText}>
          {user?.homeAddress && `${user.homeAddress}\n`}
          {user?.homeCity}, {user?.homeState}
          {user?.homeZipCode && ` ${user.homeZipCode}`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Home size={48} color={Colors.primary[500]} />
          </View>
          <Text style={styles.title}>Set Your Home Address</Text>
          <Text style={styles.subtitle}>
            {addressSet
              ? "Your home address helps us show you relevant community updates and local weather."
              : "This helps us connect you with your local community and provide accurate weather information for your area."}
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {addressSet
            ? renderSuccess()
            : method === "manual"
              ? renderManualForm()
              : renderMethodSelection()}
        </View>

        <View style={styles.footer}>
          {addressSet && (
            <Button title="Continue" onPress={handleContinue} style={styles.continueButton} />
          )}
          <TouchableOpacity onPress={handleContinue}>
            <Text style={styles.skipText}>{addressSet ? "Continue" : "Skip for Now"}</Text>
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
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
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
  contentContainer: {
    flex: 1,
  },
  methodOption: {
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
  optionArrow: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontWeight: "300",
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
  formActions: {
    marginTop: 16,
  },
  saveButton: {
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
    backgroundColor: Colors.success[25],
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.success[700],
    marginBottom: 12,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 16,
    color: Colors.success[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  addressDisplay: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    alignSelf: "stretch",
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
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
