import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.forgotPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error?.response?.status === 429) {
        setError("Too many reset attempts. Please try again later.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={Colors.success[600]}
            />
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to {email}. Please check your
              email and follow the instructions to reset your password.
            </Text>

            <Button
              title="Back to Sign In"
              onPress={() => router.replace("/(auth)/login")}
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons
              name="lock-closed-outline"
              size={48}
              color={Colors.primary[600]}
            />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
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
              error={error}
              required
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
            />

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backToLogin}>
                <Ionicons
                  name="arrow-back-outline"
                  size={16}
                  color={Colors.primary[600]}
                />
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: 16,
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
    width: "100%",
    maxWidth: 400,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  backToLoginText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  successContainer: {
    alignItems: "center",
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    minWidth: 160,
  },
});
