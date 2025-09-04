import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  const { login, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    checkBiometricAndAutoLogin();
  }, [checkBiometricAndAutoLogin]);

  useEffect(() => {
    const checkAutoFillAndLogin = async () => {
      if (email && password && biometricType && !isAutoLoggingIn && !isLoading) {
        setTimeout(async () => {
          try {
            setIsAutoLoggingIn(true);
            await login(email.trim().toLowerCase(), password);
            router.replace("/(tabs)");
          } catch (error) {
            console.log("Auto-login from auto-fill failed:", error);
            setIsAutoLoggingIn(false);
          }
        }, 500);
      }
    };

    checkAutoFillAndLogin();
  }, [email, password, biometricType, isAutoLoggingIn, isLoading, login]);

  const checkBiometricAndAutoLogin = useCallback(async () => {
    try {
      if (!LocalAuthentication) {
        console.log("LocalAuthentication not available");
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (hasHardware && isEnrolled && supportedTypes.length > 0) {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("Face ID");
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("Touch ID");
        }

        const storedEmail = await SecureStore.getItemAsync("biometric_email");
        const storedPassword = await SecureStore.getItemAsync("biometric_password");

        if (storedEmail && storedPassword) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: `Use ${biometricType || "biometrics"} to sign in`,
            cancelLabel: "Cancel",
            disableDeviceFallback: true,
          });

          if (result.success) {
            setEmail(storedEmail);
            setPassword(storedPassword);
            setIsAutoLoggingIn(true);

            try {
              await login(storedEmail.trim().toLowerCase(), storedPassword);
              router.replace("/(tabs)");
            } catch (error) {
              console.log("Auto-login failed:", error);
              setIsAutoLoggingIn(false);
            }
          }
        }
      }
    } catch (error) {
      console.log("Biometric check error:", error);
    }
  }, [biometricType, login]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);

      if (biometricType) {
        try {
          await SecureStore.setItemAsync("biometric_email", email.trim().toLowerCase());
          await SecureStore.setItemAsync("biometric_password", password);
        } catch (error) {
          console.log("Failed to store biometric credentials:", error);
        }
      }

      router.replace("/(tabs)");
    } catch (error) {}
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.contentContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your StormNeighbor account</Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                  required
                />

                <View style={styles.passwordContainer}>
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    error={errors.password}
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

                  <Link href="/(auth)/forgot-password" asChild>
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color={Colors.error[600]} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Button
                  title={
                    isAutoLoggingIn
                      ? `Signing in with ${biometricType || "biometrics"}...`
                      : "Sign In"
                  }
                  onPress={handleLogin}
                  loading={isLoading || isAutoLoggingIn}
                  style={styles.loginButton}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or login with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity style={[styles.socialButton, styles.socialButtonHalf]}>
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.socialButton, styles.socialButtonHalf]}>
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpText}>Sign Up</Text>
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
  contentContainer: {
    flex: 1,
    justifyContent: "center",
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
  loginButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    padding: 8,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
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
  footerText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  signUpText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: "600",
  },
});
