// File path: frontend/src/screens/auth/ChangePasswordScreen.js
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
} from "../../components/AuthLayout";
import { authStyles, colors } from "../../styles/authStyles";
import apiService from "../../services/api";

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

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Error",
        "New password must be different from current password"
      );
      return false;
    }

    return true;
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

  return (
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        title={<Text style={authStyles.title}>Change Password</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            Update your password to keep your account secure
          </Text>
        }
      />

      {/* Current Password Input */}
      <Text style={authStyles.label}>Current Password</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={formData.currentPassword}
          onChangeText={(value) => updateField("currentPassword", value)}
          placeholder="Enter current password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry={!showCurrentPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 16, top: 16, padding: 8 }}
          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
        >
          {showCurrentPassword ? (
            <EyeOff size={18} color={colors.text.muted} />
          ) : (
            <Eye size={18} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* New Password Input */}
      <Text style={authStyles.label}>NewPassword</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={formData.password}
          onChangeText={(value) => updateField("password", value)}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.text.muted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 16, top: 16, padding: 8 }}
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={18} color={colors.text.muted} />
          ) : (
            <Eye size={18} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm New Password Input */}
      <Text style={authStyles.label}>Confirm New Password</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={formData.confirmPassword}
          onChangeText={(value) => updateField("confirmPassword", value)}
          placeholder="Re-enter new password"
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={[
                authStyles.smallText,
                { marginRight: 8 },
                formData.currentPassword !== formData.newPassword &&
                formData.newPassword
                  ? { color: colors.success }
                  : null,
              ]}
            >
              {formData.currentPassword !== formData.newPassword &&
              formData.newPassword
                ? "✓"
                : "•"}
            </Text>
            <Text
              style={[
                authStyles.smallText,
                formData.currentPassword !== formData.newPassword &&
                formData.newPassword
                  ? { color: colors.success }
                  : null,
              ]}
            >
              Different from current password
            </Text>
          </View>
        </View>
      </View>

      {/* Change Password Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <Lock size={20} color={colors.text.inverse} />
              <Text style={authStyles.primaryButtonText}>Change Password</Text>
            </View>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Need help? </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Contact Support",
              "Email us at support@stormneighbor.com"
            )
          }
        >
          <Text style={authStyles.linkText}>Contact Support</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default ChangePasswordScreen;
