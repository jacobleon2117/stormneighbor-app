// File: frontend/src/screens/auth/ChangePasswordScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";
import apiService from "@services/api";

const ChangePasswordScreen = ({ onBack, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters long";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword === newPassword && newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await apiService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        Alert.alert(
          "Success!",
          "Your password has been changed successfully.",
          [{ text: "OK", onPress: onPasswordChanged || onBack }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordRequirements = () => {
    const requirements = [
      {
        text: "At least 8 characters",
        met: formData.newPassword.length >= 8,
      },
      {
        text: "Passwords match",
        met:
          formData.newPassword === formData.confirmPassword &&
          formData.newPassword,
      },
      {
        text: "Different from current password",
        met:
          formData.currentPassword !== formData.newPassword &&
          formData.newPassword,
      },
    ];

    return (
      <View style={[globalStyles.card, { marginBottom: spacing.xl }]}>
        <Text
          style={[
            globalStyles.body,
            { fontWeight: "600", marginBottom: spacing.md },
          ]}
        >
          Password Requirements:
        </Text>
        <View style={{ gap: spacing.sm }}>
          {requirements.map((req, index) => (
            <View key={index} style={globalStyles.row}>
              <Text
                style={[
                  globalStyles.caption,
                  { marginRight: spacing.sm, minWidth: 16 },
                  req.met && { color: colors.success },
                ]}
              >
                {req.met ? "✓" : "•"}
              </Text>
              <Text
                style={[
                  globalStyles.caption,
                  req.met && { color: colors.success },
                ]}
              >
                {req.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout showHeader={false} backgroundColor={colors.background}>
      <StandardHeader
        showBack={!!onBack}
        onBack={onBack}
        title="Change Password"
        showDefaultActions={false}
      />

      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        <View
          style={[
            globalStyles.center,
            { marginBottom: spacing.xl, marginTop: spacing.xl },
          ]}
        >
          <Text style={globalStyles.bodySecondary}>
            Update your password to keep your account secure
          </Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Current Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                globalStyles.input,
                errors.currentPassword && {
                  borderColor: colors.error,
                  borderWidth: 2,
                },
                { paddingRight: spacing.xxxxl },
              ]}
              value={formData.currentPassword}
              onChangeText={(value) => updateField("currentPassword", value)}
              placeholder="Enter current password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry={!showCurrentPassword}
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
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
            >
              {showCurrentPassword ? (
                <EyeOff size={18} color={colors.text.muted} />
              ) : (
                <Eye size={18} color={colors.text.muted} />
              )}
            </TouchableOpacity>
          </View>
          {errors.currentPassword && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.currentPassword}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>New Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                globalStyles.input,
                errors.newPassword && {
                  borderColor: colors.error,
                  borderWidth: 2,
                },
                { paddingRight: spacing.xxxxl },
              ]}
              value={formData.newPassword}
              onChangeText={(value) => updateField("newPassword", value)}
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
          {errors.newPassword && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.newPassword}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Confirm New Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                globalStyles.input,
                errors.confirmPassword && {
                  borderColor: colors.error,
                  borderWidth: 2,
                },
                { paddingRight: spacing.xxxxl },
              ]}
              value={formData.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry={!showConfirmPassword}
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
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} color={colors.text.muted} />
              ) : (
                <Eye size={18} color={colors.text.muted} />
              )}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {renderPasswordRequirements()}

        <TouchableOpacity
          style={[
            createButtonStyle("primary", "large"),
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={globalStyles.buttonContent}>
              <Lock size={20} color={colors.text.inverse} />
              <Text style={globalStyles.buttonPrimaryText}>
                Change Password
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View
          style={[
            globalStyles.row,
            globalStyles.center,
            { marginTop: spacing.xl },
          ]}
        >
          <Text style={globalStyles.bodySecondary}>Need help? </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Contact Support",
                "Email us at support@stormneighbor.com"
              )
            }
          >
            <Text style={globalStyles.link}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default ChangePasswordScreen;
