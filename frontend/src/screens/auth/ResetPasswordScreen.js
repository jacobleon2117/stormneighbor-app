// File path: frontend/src/screens/auth/ResetPasswordScreen.js
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

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";
import apiService from "@services/api";

const ResetPasswordScreen = ({
  email,
  verificationCode,
  onPasswordReset,
  onBack,
}) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { newPassword, confirmPassword } = formData;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await apiService.resetPassword(
        email,
        verificationCode,
        formData.newPassword
      );

      if (result.success) {
        Alert.alert(
          "Success!",
          "Your password has been reset successfully. You can now sign in with your new password.",
          [{ text: "Sign In", onPress: onPasswordReset }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to reset password");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<Lock size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Reset Password</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            Create a new secure password for your account
          </Text>
        }
      />

      {/* New Password Input */}
      <Text style={authStyles.label}>New Password</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={formData.newPassword}
          onChangeText={(value) => updateField("newPassword", value)}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.text.muted}
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 16, top: 16, padding: 8 }}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          {showNewPassword ? (
            <EyeOff size={18} color={colors.text.muted} />
          ) : (
            <Eye size={18} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Password Input */}
      <Text style={authStyles.label}>Confirm Password</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={formData.confirmPassword}
          onChangeText={(value) => updateField("confirmPassword", value)}
          placeholder="Re-enter your password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 16, top: 16, padding: 8 }}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? (
            <EyeOff size={18} color={colors.text.muted} />
          ) : (
            <Eye size={18} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Password Requirements */}
      <View style={[authStyles.card, { marginBottom: 24 }]}>
        <Text style={[authStyles.label, { marginBottom: 12 }]}>
          Password Requirements:
        </Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={[
                authStyles.smallText,
                { marginRight: 8 },
                formData.newPassword.length >= 8
                  ? { color: colors.success }
                  : null,
              ]}
            >
              {formData.newPassword.length >= 8 ? "✓" : "•"}
            </Text>
            <Text
              style={[
                authStyles.smallText,
                formData.newPassword.length >= 8
                  ? { color: colors.success }
                  : null,
              ]}
            >
              At least 8 characters
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={[
                authStyles.smallText,
                { marginRight: 8 },
                formData.newPassword === formData.confirmPassword &&
                formData.newPassword
                  ? { color: colors.success }
                  : null,
              ]}
            >
              {formData.newPassword === formData.confirmPassword &&
              formData.newPassword
                ? "✓"
                : "•"}
            </Text>
            <Text
              style={[
                authStyles.smallText,
                formData.newPassword === formData.confirmPassword &&
                formData.newPassword
                  ? { color: colors.success }
                  : null,
              ]}
            >
              Passwords match
            </Text>
          </View>
        </View>
      </View>

      {/* Reset Password Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <Lock size={20} color={colors.text.inverse} />
              <Text style={authStyles.primaryButtonText}>Reset Password</Text>
            </View>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Remember your password? </Text>
        <TouchableOpacity onPress={onPasswordReset}>
          <Text style={authStyles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default ResetPasswordScreen;
