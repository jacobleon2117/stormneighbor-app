import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Home,
  Shield,
  Eye,
  Zap,
  Settings as SettingsIcon,
  Info,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { locationService } from "../../services/locationService";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/UI/Button";
import { Input } from "../../components/UI/Input";

export default function LocationSettingsScreen() {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const [preferences, setPreferences] = useState({
    useCurrentLocationForWeather: user?.locationPreferences?.useCurrentLocationForWeather ?? true,
    useCurrentLocationForAlerts: user?.locationPreferences?.useCurrentLocationForAlerts ?? true,
    allowBackgroundLocation: user?.locationPreferences?.allowBackgroundLocation ?? false,
    shareLocationInPosts: user?.locationPreferences?.shareLocationInPosts ?? true,
  });

  const [homeAddressForm, setHomeAddressForm] = useState({
    address: user?.homeAddress || "",
    city: user?.homeCity || user?.locationCity || "",
    state: user?.homeState || user?.addressState || "",
    zipCode: user?.homeZipCode || user?.zipCode || "",
  });

  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    checkCurrentLocation();
  }, []);

  const checkCurrentLocation = async () => {
    try {
      const canUse = await locationService.canUseLocationFor("weather");
      if (canUse) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          const address = await locationService.reverseGeocode(
            location.coords.latitude,
            location.coords.longitude
          );
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address
              ? `${address.streetNumber || ""} ${address.street || ""}, ${address.city || ""}, ${
                  address.region || ""
                }`.trim()
              : `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
          });
        }
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  const handlePermissionChange = async (permission: keyof typeof preferences, value: boolean) => {
    if (permission === "allowBackgroundLocation" && value) {
      const result = await locationService.requestLocationPermissions();
      if (result.background !== "granted") {
        Alert.alert(
          "Background Location Required",
          'To enable background location, please choose "Always Allow" for location permissions.',
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => locationService.showPermissionDeniedAlert("background location"),
            },
          ]
        );
        return;
      }
    }

    if (
      (permission === "useCurrentLocationForWeather" ||
        permission === "useCurrentLocationForAlerts") &&
      value
    ) {
      const canUse = await locationService.canUseLocationFor("weather");
      if (!canUse) {
        const result = await locationService.requestLocationPermissions();
        if (result.foreground !== "granted") {
          Alert.alert(
            "Location Permission Required",
            "Location access is required for this feature.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => locationService.showPermissionDeniedAlert("location-based features"),
              },
            ]
          );
          return;
        }
      }
    }

    const newPreferences = {
      ...preferences,
      [permission]: value,
    };

    setPreferences(newPreferences);

    try {
      await apiService.updateProfile({
        locationPreferences: newPreferences,
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error updating location preferences:", error);
      Alert.alert("Error", "Failed to save location preferences");
      setPreferences(preferences);
    }
  };

  const handleUpdateHomeAddress = async () => {
    if (!homeAddressForm.city.trim() || !homeAddressForm.state.trim()) {
      Alert.alert("Error", "Please enter at least city and state");
      return;
    }

    setIsUpdatingAddress(true);

    try {
      let coordinates = null;
      if (homeAddressForm.address.trim()) {
        const fullAddress =
          `${homeAddressForm.address}, ${homeAddressForm.city}, ${homeAddressForm.state} ${homeAddressForm.zipCode}`.trim();
        coordinates = await locationService.forwardGeocode(fullAddress);
      }

      if (!coordinates) {
        const cityStateAddress = `${homeAddressForm.city}, ${homeAddressForm.state}`;
        coordinates = await locationService.forwardGeocode(cityStateAddress);
      }

      const updateData = {
        homeAddress: homeAddressForm.address.trim() || undefined,
        homeCity: homeAddressForm.city.trim(),
        homeState: homeAddressForm.state.trim(),
        homeZipCode: homeAddressForm.zipCode.trim() || undefined,
        homeLatitude: coordinates?.latitude,
        homeLongitude: coordinates?.longitude,
      };

      await apiService.updateProfile(updateData);
      await refreshProfile();

      setShowAddressForm(false);
      Alert.alert("Success", "Home address updated successfully");
    } catch (error) {
      console.error("Error updating home address:", error);
      Alert.alert("Error", "Failed to update home address");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const useCurrentLocationAsHome = async () => {
    if (!currentLocation) {
      Alert.alert("Error", "Current location not available");
      return;
    }

    setIsLoading(true);

    try {
      const address = await locationService.reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (!address) {
        Alert.alert("Error", "Unable to determine address from current location");
        return;
      }

      const updateData = {
        homeAddress: `${address.streetNumber || ""} ${address.street || ""}`.trim() || undefined,
        homeCity: address.city || address.subregion,
        homeState: address.region,
        homeZipCode: address.postalCode,
        homeLatitude: currentLocation.latitude,
        homeLongitude: currentLocation.longitude,
      };

      await apiService.updateProfile(updateData);
      await refreshProfile();

      Alert.alert("Success", "Home address set to current location");
    } catch (error) {
      console.error("Error setting current location as home:", error);
      Alert.alert("Error", "Failed to set home address");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPermissionToggle = (
    key: keyof typeof preferences,
    title: string,
    description: string,
    icon: React.ComponentType<any>,
    requiresPermission: boolean = true
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        {React.createElement(icon, { size: 20, color: Colors.primary[600] })}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => handlePermissionChange(key, value)}
        trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
        thumbColor={preferences[key] ? Colors.primary[600] : Colors.neutral[500]}
      />
    </View>
  );

  const renderCurrentLocation = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Location</Text>
      {currentLocation ? (
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Navigation size={16} color={Colors.success[600]} />
            <Text style={styles.locationStatus}>GPS Location Available</Text>
          </View>
          <Text style={styles.locationAddress}>{currentLocation.address}</Text>
          <Button
            title="Use as Home Address"
            onPress={useCurrentLocationAsHome}
            loading={isLoading}
            variant="outline"
            size="small"
            style={styles.useLocationButton}
          />
        </View>
      ) : (
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={16} color={Colors.neutral[400]} />
            <Text style={styles.locationStatus}>Location Not Available</Text>
          </View>
          <Text style={styles.locationDescription}>
            Enable location permissions to see your current location
          </Text>
        </View>
      )}
    </View>
  );

  const renderHomeAddress = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Home Address</Text>
        <TouchableOpacity
          onPress={() => setShowAddressForm(!showAddressForm)}
          style={styles.editButton}
        >
          <SettingsIcon size={16} color={Colors.primary[600]} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {user?.homeCity ? (
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Home size={16} color={Colors.primary[600]} />
            <Text style={styles.locationStatus}>Home Address Set</Text>
          </View>
          <Text style={styles.locationAddress}>
            {user.homeAddress && `${user.homeAddress}\n`}
            {user.homeCity}, {user.homeState}
            {user.homeZipCode && ` ${user.homeZipCode}`}
          </Text>
        </View>
      ) : (
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Home size={16} color={Colors.neutral[400]} />
            <Text style={styles.locationStatus}>No Home Address Set</Text>
          </View>
          <Text style={styles.locationDescription}>
            Set your home address to get relevant community posts and local weather
          </Text>
        </View>
      )}

      {showAddressForm && (
        <View style={styles.addressForm}>
          <Input
            label="Street Address (Optional)"
            value={homeAddressForm.address}
            onChangeText={(text) => setHomeAddressForm((prev) => ({ ...prev, address: text }))}
            placeholder="123 Main Street"
            style={styles.formInput}
          />
          <View style={styles.formRow}>
            <Input
              label="City"
              value={homeAddressForm.city}
              onChangeText={(text) => setHomeAddressForm((prev) => ({ ...prev, city: text }))}
              placeholder="City"
              style={[styles.formInput, styles.formInputHalf]}
              required
            />
            <Input
              label="State"
              value={homeAddressForm.state}
              onChangeText={(text) => setHomeAddressForm((prev) => ({ ...prev, state: text }))}
              placeholder="State"
              style={[styles.formInput, styles.formInputHalf]}
              required
            />
          </View>
          <Input
            label="ZIP Code (Optional)"
            value={homeAddressForm.zipCode}
            onChangeText={(text) => setHomeAddressForm((prev) => ({ ...prev, zipCode: text }))}
            placeholder="12345"
            keyboardType="numeric"
            maxLength={10}
            style={styles.formInput}
          />
          <View style={styles.formActions}>
            <Button
              title="Save Address"
              onPress={handleUpdateHomeAddress}
              loading={isUpdatingAddress}
              style={styles.saveButton}
            />
            <Button
              title="Cancel"
              onPress={() => setShowAddressForm(false)}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentLocation()}
        {renderHomeAddress()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Preferences</Text>
          <Text style={styles.sectionDescription}>
            Control how StormNeighbor uses your location information
          </Text>

          {renderPermissionToggle(
            "useCurrentLocationForWeather",
            "Use Current Location for Weather",
            "Get weather for where you are right now",
            Navigation
          )}

          {renderPermissionToggle(
            "useCurrentLocationForAlerts",
            "Current Location for Emergency Alerts",
            "Receive alerts based on your current GPS location",
            Shield
          )}

          {renderPermissionToggle(
            "allowBackgroundLocation",
            "Background Location Access",
            "Allow location updates when app is closed (for emergency alerts)",
            Zap
          )}

          {renderPermissionToggle(
            "shareLocationInPosts",
            "Share Location in Posts",
            "Include your location when creating posts",
            Eye,
            false
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Info size={20} color={Colors.primary[600]} />
            <Text style={styles.infoTitle}>How Location is Used</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>Weather:</Text> Uses current GPS location for real-time
              weather, falls back to home address
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>Community Posts:</Text> Uses home address to show relevant
              neighborhood content
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>Emergency Alerts:</Text> Uses current location for
              immediate safety, home address as backup
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>Privacy:</Text> Location data never leaves your device
              without your permission
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary[700],
    marginLeft: 4,
  },
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  useLocationButton: {
    alignSelf: "flex-start",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  addressForm: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  formInput: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formInputHalf: {
    flex: 1,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  infoSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.primary[25],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary[700],
    marginLeft: 8,
  },
  infoContent: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary[600],
    lineHeight: 20,
  },
  bold: {
    fontWeight: "600",
  },
});
