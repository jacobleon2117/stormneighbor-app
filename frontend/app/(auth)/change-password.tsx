import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { ErrorHandler } from "../../utils/errorHandler";

export default function ChangePasswordScreen() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await apiService.getApi().put("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        Alert.alert("Success", "Your password has been changed successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      ErrorHandler.silent(error as Error, "Change password error");

      if (error.response?.status === 400) {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        setErrors(validationErrors);
      } else {
        Alert.alert("Error", "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const renderPasswordInput = (
    label: string,
    field: keyof typeof formData,
    visibilityField: keyof typeof showPasswords,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputWrapper}>
        <Lock size={20} color={Colors.text.disabled} style={styles.inputIcon} />
        <TextInput
          style={[styles.passwordInput, errors[field] && styles.inputError]}
          value={formData[field]}
          onChangeText={(value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            if (errors[field]) {
              setErrors((prev) => ({ ...prev, [field]: "" }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          secureTextEntry={!showPasswords[visibilityField]}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
        />
        <TouchableOpacity
          onPress={() => togglePasswordVisibility(visibilityField)}
          style={styles.eyeButton}
        >
          {showPasswords[visibilityField] ? (
            <EyeOff size={20} color={Colors.text.disabled} />
          ) : (
            <Eye size={20} color={Colors.text.disabled} />
          )}
        </TouchableOpacity>
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: Colors.neutral[300] };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      Colors.error[500],
      Colors.warning[500],
      Colors.warning[400],
      Colors.success[400],
      Colors.success[500],
    ];

    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || Colors.neutral[300],
    };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Change Password" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Update Your Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to keep your account secure
            </Text>
          </View>

          <View style={styles.form}>
            {renderPasswordInput(
              "Current Password",
              "currentPassword",
              "current",
              "Enter your current password"
            )}

            {renderPasswordInput("New Password", "newPassword", "new", "Enter your new password")}

            {formData.newPassword && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  {[...Array(5)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            index < passwordStrength.strength
                              ? passwordStrength.color
                              : Colors.neutral[200],
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {renderPasswordInput(
              "Confirm New Password",
              "confirmPassword",
              "confirm",
              "Confirm your new password"
            )}
          </View>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirement}>• At least 8 characters long</Text>
            <Text style={styles.requirement}>• Contains uppercase and lowercase letters</Text>
            <Text style={styles.requirement}>• Contains at least one number</Text>
            <Text style={styles.requirement}>• Different from current password</Text>
          </View>

          <Button
            title={loading ? "Changing Password..." : "Change Password"}
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: Colors.error[300],
  },
  eyeButton: {
    padding: 12,
    marginRight: 4,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.error[600],
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  requirements: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
});
