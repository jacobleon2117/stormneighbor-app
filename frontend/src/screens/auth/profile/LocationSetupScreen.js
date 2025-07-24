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
import { MapPin, ArrowRight } from "lucide-react-native";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthInput,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

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
      newErrors.state = "State must be 2 letters";
    }

    if (formData.zipCode && formData.zipCode.length !== 5) {
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
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<MapPin size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Your Location</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            We use this information to find your neighborhood and provide local
            weather alerts
          </Text>
        }
      />

      {/* Address Input */}
      <AuthInput label={<Text style={authStyles.label}>Street Address</Text>}>
        <TextInput
          style={authStyles.input}
          value={formData.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="Your address (optional)"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="words"
        />
      </AuthInput>

      {/* City and State Row */}
      <View style={authStyles.row}>
        <View style={[authStyles.flex1, { marginRight: 12 }]}>
          <AuthInput
            label={<Text style={authStyles.label}>City</Text>}
            error={errors.city}
          >
            <TextInput
              style={[
                authStyles.input,
                errors.city && { borderColor: colors.error },
              ]}
              value={formData.city}
              onChangeText={(value) => updateField("city", value)}
              placeholder="Your city"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="words"
            />
          </AuthInput>
        </View>

        <View style={{ flex: 0.4 }}>
          <AuthInput
            label={<Text style={authStyles.label}>State</Text>}
            error={errors.state}
          >
            <TextInput
              style={[
                authStyles.input,
                errors.state && { borderColor: colors.error },
              ]}
              value={formData.state}
              onChangeText={handleStateChange}
              placeholder="TX"
              placeholderTextColor={colors.text.muted}
              maxLength={2}
              autoCapitalize="characters"
            />
          </AuthInput>
        </View>
      </View>

      {/* ZIP Code */}
      <AuthInput
        label={<Text style={authStyles.label}>ZIP Code</Text>}
        error={errors.zipCode}
      >
        <TextInput
          style={[
            authStyles.input,
            errors.zipCode && { borderColor: colors.error },
          ]}
          value={formData.zipCode}
          onChangeText={handleZipChange}
          placeholder="12345 (optional)"
          placeholderTextColor={colors.text.muted}
          keyboardType="numeric"
          maxLength={5}
        />
      </AuthInput>

      {/* Continue Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <Text style={authStyles.primaryButtonText}>Continue</Text>
              <ArrowRight size={20} color={colors.text.inverse} />
            </View>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={handleSkip}
        >
          <Text style={authStyles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </AuthButtons>
    </AuthLayout>
  );
};

export default LocationSetupScreen;
