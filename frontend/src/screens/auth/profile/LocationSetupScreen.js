// File: frontend/src/screens/auth/profile/LocationSetupScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MapPin, ArrowRight } from "lucide-react-native";
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
  const [formData, setFormData] = useState({
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
  });
  const [errors, setErrors] = useState({});

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
      onNext(formData);
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

  return (
    <ScreenLayout showHeader={false} backgroundColor={colors.background}>
      <StandardHeader
        showBack={!!onBack}
        onBack={onBack}
        title="Location Setup"
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
            We use this information to find your neighborhood and provide local
            weather alerts
          </Text>
        </View>

        {/* Street Address Field */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Street Address</Text>
          <TextInput
            style={globalStyles.input}
            value={formData.address}
            onChangeText={(value) => updateField("address", value)}
            placeholder="Your address (optional)"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        {/* City and State Row */}
        <View
          style={[
            globalStyles.row,
            { marginBottom: spacing.lg, gap: spacing.md },
          ]}
        >
          <View style={[globalStyles.flex1, { marginRight: spacing.md }]}>
            <Text style={globalStyles.label}>City</Text>
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
            <Text style={globalStyles.label}>State</Text>
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

        {/* ZIP Code Field */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={globalStyles.label}>ZIP Code</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.zipCode && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.zipCode}
            onChangeText={handleZipChange}
            placeholder="12345 (optional)"
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

export default LocationSetupScreen;
