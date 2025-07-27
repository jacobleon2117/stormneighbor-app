// File: frontend/src/screens/auth/LoginScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { Mail, Eye, EyeOff } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const LoginScreen = ({
  onLogin,
  onSwitchToRegister,
  onForgotPassword,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Auto-login effect when both email and password are filled
  useEffect(() => {
    const autoLoginTimer = setTimeout(() => {
      if (
        formData.email.trim() &&
        formData.password.trim() &&
        !autoLoginAttempted &&
        !loading
      ) {
        setAutoLoginAttempted(true);
        Keyboard.dismiss();
        handleLogin();
      }
    }, 500); // Small delay to allow for autofill completion

    return () => clearTimeout(autoLoginTimer);
  }, [formData.email, formData.password, autoLoginAttempted, loading]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAutoLoginAttempted(false); // Reset auto-login attempt when user manually types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onLogin(formData.email.trim(), formData.password);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setAutoLoginAttempted(false); // Allow retry
    }
  };

  const renderHeader = () => (
    <View style={[globalStyles.center, { marginBottom: spacing.xxxl }]}>
      <Text style={[globalStyles.title, { marginBottom: spacing.md }]}>
        Welcome Back
      </Text>
      <Text style={globalStyles.bodySecondary}>
        Sign in to your StormNeighbor account
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={{ marginBottom: spacing.xxl }}>
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
            autoComplete="email"
            textContentType="emailAddress"
            editable={!loading}
            onSubmitEditing={() => {
              // Focus password field if email is filled
              if (formData.email.trim()) {
                // Password field will be focused automatically
              }
            }}
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
            placeholder="Enter your password"
            placeholderTextColor={colors.text.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            editable={!loading}
            onSubmitEditing={handleLogin}
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
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <View style={globalStyles.buttonContent}>
            <ActivityIndicator color={colors.text.inverse} />
            <Text style={globalStyles.buttonPrimaryText}>Signing In...</Text>
          </View>
        ) : (
          <Text style={globalStyles.buttonPrimaryText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ alignItems: "center", marginTop: spacing.lg }}
        onPress={onForgotPassword}
        disabled={loading}
      >
        <Text style={globalStyles.link}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={[globalStyles.row, globalStyles.center]}>
      <Text style={globalStyles.bodySecondary}>Don't have an account? </Text>
      <TouchableOpacity onPress={onSwitchToRegister} disabled={loading}>
        <Text style={globalStyles.link}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout
      showHeader={false}
      scrollable={true}
      backgroundColor={colors.background}
      safeAreaBackground={colors.background}
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

export default LoginScreen;
