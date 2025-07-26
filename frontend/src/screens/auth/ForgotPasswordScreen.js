// File: frontend/src/screens/auth/ForgotPasswordScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Mail, CheckCircle } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";
import { useAuth } from "@contexts/AuthContext";

const ForgotPasswordScreen = ({ onBackToLogin }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await forgotPassword(email.trim());

      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
          <View style={[globalStyles.center, { marginBottom: spacing.xxxxl }]}>
            <View style={styles.successIcon}>
              <CheckCircle size={48} color={colors.success} />
            </View>

            <Text
              style={[
                globalStyles.title,
                { marginTop: spacing.xl, marginBottom: spacing.md },
              ]}
            >
              Email Sent!
            </Text>

            <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
              We've sent password reset instructions to{"\n"}
              <Text style={globalStyles.link}>{email}</Text>
            </Text>
          </View>

          <View style={[globalStyles.card, { marginBottom: spacing.xxxxl }]}>
            <Text
              style={[
                globalStyles.bodySecondary,
                { textAlign: "center", lineHeight: 24 },
              ]}
            >
              Please check your email and follow the link to reset your
              password. Don't forget to check your spam folder!
            </Text>
          </View>

          <TouchableOpacity
            style={createButtonStyle("primary", "large")}
            onPress={onBackToLogin}
          >
            <Text style={globalStyles.buttonPrimaryText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      showHeader={false}
      scrollable={false}
      backgroundColor={colors.background}
    >
      <StandardHeader showBack={true} onBack={onBackToLogin} title="" />

      <View
        style={[
          globalStyles.flex1,
          globalStyles.justifyCenter,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        <View style={[globalStyles.center, { marginBottom: spacing.xxxxl }]}>
          <Text style={[globalStyles.title, { marginBottom: spacing.md }]}>
            Forgot Password?
          </Text>
          <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
            Don't worry! Enter your email address and we'll send you
            instructions to reset your password.
          </Text>
        </View>

        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={globalStyles.label}>Email</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                globalStyles.input,
                error && { borderColor: colors.error, borderWidth: 2 },
                { paddingRight: spacing.xxxxl },
              ]}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError("");
              }}
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
          {error && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {error}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            createButtonStyle("primary", "large"),
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={globalStyles.buttonPrimaryText}>
              Send Reset Instructions
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={[
            globalStyles.row,
            globalStyles.center,
            { marginTop: spacing.xl },
          ]}
        >
          <Text style={globalStyles.bodySecondary}>
            Remember your password?{" "}
          </Text>
          <TouchableOpacity onPress={onBackToLogin} disabled={loading}>
            <Text style={globalStyles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
};

export default ForgotPasswordScreen;
