// File: frontend/src/screens/auth/profile/LocationSetupScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MapPin, ArrowRight, Navigation } from "lucide-react-native";
import * as Location from "expo-location";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const LocationSetupScreen = ({ onNext, onBack, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
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
    usePreciseLocation: false,
    radiusMiles: 15,
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
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

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location permission is needed for precise location features. You can still use the app by entering your city manually."
        );
        return;
      }

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
          usePreciseLocation: true,
        }));
        setErrors({});
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Location Error",
        "Couldn't get your current location. You can enter your city manually below."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleContinue = () => {
    if (!validateForm()) {
      Alert.alert(
        "Please Fix Errors",
        "Make sure all required fields are filled correctly"
      );
      return;
    }

    const locationData = {
      address: formData.address || null,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode || null,
      latitude: formData.usePreciseLocation ? formData.latitude : null,
      longitude: formData.usePreciseLocation ? formData.longitude : null,
      radiusMiles: formData.radiusMiles,
      showCityOnly: !formData.usePreciseLocation,
    };

    if (onNext) {
      onNext(locationData);
    }
  };

  const handleSkip = () => {
    if (onNext) {
      onNext({});
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <ScreenLayout
      title="Your Location"
      showHeader={true}
      headerActions={[]}
      showDefaultActions={false}
      scrollable={true}
      backgroundColor={colors.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <MapPin size={32} color={colors.primary} />
          <Text style={globalStyles.title}>Where are you located?</Text>
          <Text style={globalStyles.bodySecondary}>
            This helps us show you posts from neighbors in your area
          </Text>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Quick Setup</Text>
          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              locationLoading && globalStyles.buttonDisabled,
            ]}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <View style={globalStyles.buttonContent}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={globalStyles.buttonSecondaryText}>
                  Getting Location...
                </Text>
              </View>
            ) : (
              <View style={globalStyles.buttonContent}>
                <Navigation size={20} color={colors.primary} />
                <Text style={globalStyles.buttonSecondaryText}>
                  Use Current Location
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Or enter manually:</Text>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Street Address (Optional)</Text>
            <TextInput
              style={globalStyles.input}
              value={formData.address}
              onChangeText={(value) => updateField("address", value)}
              placeholder="123 Main Street"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.cityInput}>
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
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={styles.stateInput}>
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
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
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
              <Text style={styles.errorText}>{errors.zipCode}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.preciseLocationToggle}
            onPress={() =>
              updateField("usePreciseLocation", !formData.usePreciseLocation)
            }
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={[globalStyles.body, { fontWeight: "500" }]}>
                  Use precise location
                </Text>
                <Text style={globalStyles.caption}>
                  Show posts within {formData.radiusMiles} miles of your exact
                  location
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  formData.usePreciseLocation && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    formData.usePreciseLocation && styles.toggleDotActive,
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>

          {!formData.usePreciseLocation && (
            <View style={styles.cityOnlyNote}>
              <Text style={globalStyles.caption}>
                You'll see posts from your entire city
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonGroup}>
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

        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={[globalStyles.link, { textAlign: "center" }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = {
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  locationCard: {
    ...globalStyles.card,
    marginBottom: spacing.lg,
  },

  formCard: {
    ...globalStyles.card,
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  inputGroup: {
    marginBottom: spacing.lg,
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  cityInput: {
    flex: 2,
  },

  stateInput: {
    flex: 1,
  },

  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.xs,
  },

  preciseLocationToggle: {
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  toggleText: {
    flex: 1,
    marginRight: spacing.md,
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

  cityOnlyNote: {
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonGroup: {
    marginBottom: spacing.lg,
  },

  backButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
};

export default LocationSetupScreen;
