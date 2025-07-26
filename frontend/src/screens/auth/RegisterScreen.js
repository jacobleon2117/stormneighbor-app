// File: frontend/src/screens/auth/RegisterScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Mail, Eye, EyeOff, User } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const RegisterScreen = ({ onRegister, onSwitchToLogin, loading = false }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onRegister(formData);
    } catch (error) {
      console.error("Register error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const renderHeader = () => (
    <View style={[globalStyles.center, { marginBottom: spacing.xxxl }]}>
      <Text style={[globalStyles.title, { marginBottom: spacing.md }]}>
        Create Account
      </Text>
      <Text style={globalStyles.bodySecondary}>
        Join your neighborhood community
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={{ marginBottom: spacing.xxl }}>
      {/* Name Fields */}
      <View
        style={[
          globalStyles.row,
          { marginBottom: spacing.lg, gap: spacing.md },
        ]}
      >
        <View style={globalStyles.flex1}>
          <Text style={globalStyles.label}>First Name</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.firstName && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.firstName}
            onChangeText={(value) => updateField("firstName", value)}
            placeholder="First name"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.firstName && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.firstName}
            </Text>
          )}
        </View>

        <View style={globalStyles.flex1}>
          <Text style={globalStyles.label}>Last Name</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.lastName && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.lastName}
            onChangeText={(value) => updateField("lastName", value)}
            placeholder="Last name"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.lastName && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.lastName}
            </Text>
          )}
        </View>
      </View>

      {/* Email Field */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={globalStyles.label}>Email</Text>
        <View style={{ position: "relative" }}>
          <TextInput
            style={[
              globalStyles.input,
              errors.email && { borderColor: colors.error, borderWidth: 2 },
              { paddingRight: spacing.xxxxl },
            ]}
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="Enter your email"
            placeholderTextColor={colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <View
            style={{
              position: "absolute",
              right: spacing.lg,
              top: spacing.md,
              justifyContent: "center",
            }}
          >
            <Mail size={18} color={colors.text.muted} />
          </View>
        </View>
        {errors.email && (
          <Text
            style={[
              globalStyles.caption,
              { color: colors.error, marginTop: spacing.xs },
            ]}
          >
            {errors.email}
          </Text>
        )}
      </View>

      {/* Password Field */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={globalStyles.label}>Password</Text>
        <View style={{ position: "relative" }}>
          <TextInput
            style={[
              globalStyles.input,
              errors.password && { borderColor: colors.error, borderWidth: 2 },
              { paddingRight: spacing.xxxxl },
            ]}
            value={formData.password}
            onChangeText={(value) => updateField("password", value)}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.text.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={{
              position: "absolute",
              right: spacing.lg,
              top: spacing.md,
              padding: spacing.xs,
            }}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.text.muted} />
            ) : (
              <Eye size={18} color={colors.text.muted} />
            )}
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text
            style={[
              globalStyles.caption,
              { color: colors.error, marginTop: spacing.xs },
            ]}
          >
            {errors.password}
          </Text>
        )}
      </View>
    </View>
  );

  const renderButtons = () => (
    <View style={{ marginBottom: spacing.xl }}>
      <TouchableOpacity
        style={[
          createButtonStyle("primary", "large"),
          loading && globalStyles.buttonDisabled,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.inverse} />
        ) : (
          <Text style={globalStyles.buttonPrimaryText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={[globalStyles.row, globalStyles.center]}>
      <Text style={globalStyles.bodySecondary}>Already have an account? </Text>
      <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
        <Text style={globalStyles.link}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout
      showHeader={false}
      scrollable={false}
      backgroundColor={colors.background}
    >
      <View
        style={[
          globalStyles.flex1,
          globalStyles.justifyCenter,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        {renderHeader()}
        {renderForm()}
        {renderButtons()}
        {renderFooter()}
      </View>
    </ScreenLayout>
  );
};

export default RegisterScreen;
