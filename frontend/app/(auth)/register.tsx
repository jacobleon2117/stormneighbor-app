import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { useAuthStore, useAuthLoading, useAuthError } from "../../stores";
import { Colors } from "../../constants/Colors";
import { ErrorHandler } from "../../utils/errorHandler";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { register, clearError } = useAuthStore();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (
      formData.phone.trim() &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const success = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() ? formData.phone.replace(/[\s\-\(\)\+]/g, "") : undefined,
        password: formData.password,
      });

      if (success) {
        router.push("/(auth)/location-setup");
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Registration error in component");
    }
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join your neighborhood community</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData("firstName", value)}
                  placeholder="John"
                  autoCapitalize="words"
                  error={errors.firstName}
                  containerStyle={{ ...styles.halfWidth, ...styles.rightMargin }}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData("lastName", value)}
                  placeholder="Doe"
                  autoCapitalize="words"
                  error={errors.lastName}
                  containerStyle={styles.halfWidth}
                  required
                />
              </View>

              <Input
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                required
              />

              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => updateFormData("phone", value)}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <View style={styles.passwordContainer}>
                <Input
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  placeholder="Create a strong password"
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  textContentType="none"
                  autoComplete="off"
                  required
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={Colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <Input
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData("confirmPassword", value)}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                  textContentType="none"
                  autoComplete="off"
                  required
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={Colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={Colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={Colors.error[600]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push("/(auth)/terms-of-service")}
                  >
                    Terms of Service
                  </Text>
                  {" and "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push("/(auth)/privacy-policy")}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  form: {
    flex: 0,
  },
  row: {
    flexDirection: "row",
  },
  halfWidth: {
    flex: 1,
  },
  rightMargin: {
    marginRight: 8,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    top: 25,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 44,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.error[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error[700],
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  termsContainer: {
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: Colors.primary[600],
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  socialButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  socialButtonHalf: {
    flex: 1,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  registerButton: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  signInText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: "600",
  },
});
