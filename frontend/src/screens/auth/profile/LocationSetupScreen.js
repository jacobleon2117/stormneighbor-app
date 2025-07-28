// File: frontend/src/screens/auth/profile/LocationSetupScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MapPin, ArrowRight, Navigation, RefreshCw } from "lucide-react-native";
import * as Location from "expo-location";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const LocationSetupScreen = ({ onNext, onBack, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [formData, setFormData] = useState({
    address: initialData.address || "",
    city: initialData.city || initialData.location_city || "",
    state: initialData.state || initialData.address_state || "",
    zipCode: initialData.zipCode || initialData.zip_code || "",
    latitude:
      initialData.latitude ||
      initialData.location?.coordinates?.latitude ||
      null,
    longitude:
      initialData.longitude ||
      initialData.location?.coordinates?.longitude ||
      null,
    radiusMiles:
      initialData.radiusMiles || initialData.location_radius_miles || 10,
    showCityOnly:
      initialData.showCityOnly || initialData.show_city_only || false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setHasLocationPermission(true);
        await getCurrentLocation();
      } else {
        Alert.alert(
          "Location Permission Required",
          "To show you posts from your area, we need access to your location. You can enable this in your device settings.",
          [
            { text: "Skip", onPress: () => {} },
            {
              text: "Try Again",
              onPress: requestLocationPermission,
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert(
        "Error",
        "Failed to get location permission. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      const { latitude, longitude } = location.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          city: address.city || prev.city,
          state: address.region || prev.state,
          zipCode: address.postalCode || prev.zipCode,
          address:
            `${address.streetNumber || ""} ${address.street || ""}`.trim() ||
            prev.address,
        }));

        setErrors({});
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Location Error",
        "Couldn't get your current location. You can enter your city manually below.",
        [{ text: "OK" }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    } else if (formData.state.length !== 2) {
      newErrors.state = "State must be 2 letters (e.g., TX)";
    }

    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) {
      newErrors.zipCode = "ZIP code must be 5 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors below");
      return;
    }

    if (onNext) {
      const locationData = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,

        latitude: formData.latitude,
        longitude: formData.longitude,

        radiusMiles: formData.radiusMiles,
        showCityOnly: formData.showCityOnly,
      };

      onNext(locationData);
    }
  };

  const handleSkip = () => {
    if (onNext) {
      onNext({});
    }
  };

  const handleStateChange = (value) => {
    const filteredValue = value
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase();
    updateField("state", filteredValue);
  };

  const handleZipChange = (value) => {
    const filteredValue = value.replace(/[^0-9]/g, "").slice(0, 5);
    updateField("zipCode", filteredValue);
  };

  const renderLocationPermissionCard = () => (
    <View style={[globalStyles.card, { marginBottom: spacing.xl }]}>
      <View style={[globalStyles.center, { marginBottom: spacing.lg }]}>
        <View style={styles.permissionIcon}>
          <Navigation size={24} color={colors.primary} />
        </View>
        <Text
          style={[
            globalStyles.body,
            { fontWeight: "600", textAlign: "center" },
          ]}
        >
          Find Your Neighborhood
        </Text>
        <Text
          style={[
            globalStyles.caption,
            { textAlign: "center", marginTop: spacing.sm },
          ]}
        >
          We'll use your location to show you posts from neighbors in your area
        </Text>
      </View>

      <TouchableOpacity
        style={[
          createButtonStyle("primary", "large"),
          locationLoading && globalStyles.buttonDisabled,
        ]}
        onPress={requestLocationPermission}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <View style={globalStyles.buttonContent}>
            <ActivityIndicator color={colors.text.inverse} size="small" />
            <Text style={globalStyles.buttonPrimaryText}>
              Getting Location...
            </Text>
          </View>
        ) : (
          <View style={globalStyles.buttonContent}>
            <Navigation size={20} color={colors.text.inverse} />
            <Text style={globalStyles.buttonPrimaryText}>
              Use My Current Location
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          createButtonStyle("secondary", "large"),
          { marginTop: spacing.md },
        ]}
        onPress={() => {}}
        disabled={locationLoading}
      >
        <Text style={globalStyles.buttonSecondaryText}>Enter Manually</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocationSummary = () => (
    <View style={[globalStyles.card, { marginBottom: spacing.lg }]}>
      <View style={styles.locationSummaryHeader}>
        <Text style={[globalStyles.body, { fontWeight: "600" }]}>
          Your Location
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          <RefreshCw
            size={16}
            color={colors.primary}
            style={locationLoading ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      <Text style={[globalStyles.caption, { marginBottom: spacing.sm }]}>
        {formData.city && formData.state
          ? `${formData.city}, ${formData.state}${
              formData.zipCode ? ` ${formData.zipCode}` : ""
            }`
          : "Location not set"}
      </Text>

      {formData.latitude && formData.longitude && (
        <Text style={[globalStyles.caption, { color: colors.success }]}>
          ✓ GPS coordinates available
        </Text>
      )}
    </View>
  );

  const renderRadiusSettings = () => (
    <View style={[globalStyles.card, { marginBottom: spacing.xl }]}>
      <Text
        style={[
          globalStyles.body,
          { fontWeight: "600", marginBottom: spacing.lg },
        ]}
      >
        Feed Settings
      </Text>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={globalStyles.label}>Show posts within:</Text>
        <View style={styles.radiusOptions}>
          {[5, 10, 15, 25].map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusOption,
                formData.radiusMiles === radius && styles.radiusOptionActive,
              ]}
              onPress={() => updateField("radiusMiles", radius)}
            >
              <Text
                style={[
                  styles.radiusOptionText,
                  formData.radiusMiles === radius &&
                    styles.radiusOptionTextActive,
                ]}
              >
                {radius} miles
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.cityOnlyToggle}
        onPress={() => updateField("showCityOnly", !formData.showCityOnly)}
      >
        <View style={styles.toggleRow}>
          <View style={globalStyles.flex1}>
            <Text style={[globalStyles.body, { fontWeight: "500" }]}>
              City only
            </Text>
            <Text style={globalStyles.caption}>
              Only show posts from your exact city
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              formData.showCityOnly && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleDot,
                formData.showCityOnly && styles.toggleDotActive,
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout showHeader={false} backgroundColor={colors.background}>
      <StandardHeader
        showBack={!!onBack}
        onBack={onBack}
        title="Location Setup"
        showDefaultActions={false}
      />

      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        <View
          style={[
            globalStyles.center,
            { marginBottom: spacing.xl, marginTop: spacing.xl },
          ]}
        >
          <MapPin size={32} color={colors.primary} />
          <Text
            style={[
              globalStyles.title,
              { marginTop: spacing.lg, marginBottom: spacing.md },
            ]}
          >
            Your Location
          </Text>
          <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
            We use this information to show you posts from neighbors in your
            area
          </Text>
        </View>

        {!hasLocationPermission || (!formData.latitude && !formData.longitude)
          ? renderLocationPermissionCard()
          : renderLocationSummary()}

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Street Address (Optional)</Text>
          <TextInput
            style={globalStyles.input}
            value={formData.address}
            onChangeText={(value) => updateField("address", value)}
            placeholder="Your address"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        <View
          style={[
            globalStyles.row,
            { marginBottom: spacing.lg, gap: spacing.md },
          ]}
        >
          <View style={[globalStyles.flex1, { marginRight: spacing.md }]}>
            <Text style={globalStyles.label}>City *</Text>
            <TextInput
              style={[
                globalStyles.input,
                errors.city && { borderColor: colors.error, borderWidth: 2 },
              ]}
              value={formData.city}
              onChangeText={(value) => updateField("city", value)}
              placeholder="Your city"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="words"
              editable={!loading}
            />
            {errors.city && (
              <Text
                style={[
                  globalStyles.caption,
                  { color: colors.error, marginTop: spacing.xs },
                ]}
              >
                {errors.city}
              </Text>
            )}
          </View>

          <View style={{ flex: 0.4 }}>
            <Text style={globalStyles.label}>State *</Text>
            <TextInput
              style={[
                globalStyles.input,
                errors.state && { borderColor: colors.error, borderWidth: 2 },
              ]}
              value={formData.state}
              onChangeText={handleStateChange}
              placeholder="TX"
              placeholderTextColor={colors.text.muted}
              maxLength={2}
              autoCapitalize="characters"
              editable={!loading}
            />
            {errors.state && (
              <Text
                style={[
                  globalStyles.caption,
                  { color: colors.error, marginTop: spacing.xs },
                ]}
              >
                {errors.state}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={globalStyles.label}>ZIP Code (Optional)</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.zipCode && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.zipCode}
            onChangeText={handleZipChange}
            placeholder="12345"
            placeholderTextColor={colors.text.muted}
            keyboardType="numeric"
            maxLength={5}
            editable={!loading}
          />
          {errors.zipCode && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.zipCode}
            </Text>
          )}
        </View>

        {renderRadiusSettings()}

        <View style={{ marginBottom: spacing.xl }}>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "large"),
              loading && globalStyles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <View style={globalStyles.buttonContent}>
                <Text style={globalStyles.buttonPrimaryText}>Continue</Text>
                <ArrowRight size={20} color={colors.text.inverse} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              { marginTop: spacing.md },
            ]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={globalStyles.buttonSecondaryText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  locationSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  refreshButton: {
    padding: spacing.xs,
  },

  radiusOptions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  radiusOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },

  radiusOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  radiusOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },

  radiusOptionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },

  cityOnlyToggle: {
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  toggleActive: {
    backgroundColor: colors.primary,
  },

  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
};

export default LocationSetupScreen;
