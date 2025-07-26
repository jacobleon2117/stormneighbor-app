// File: frontend/src/screens/auth/EmailVerificationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CheckCircle, RotateCcw } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";
import apiService from "@services/api";

const EmailVerificationScreen = ({ userEmail, onVerified, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const result = await apiService.checkEmailVerification();

      if (result.success && result.verified) {
        Alert.alert("Success!", "Your email has been verified!", [
          { text: "Continue", onPress: onVerified },
        ]);
      } else {
        Alert.alert(
          "Not Verified Yet",
          "Please check your email and click the verification link. Check your spam folder too!"
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to check verification status. Please try again."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      const result = await apiService.resendVerificationEmail();

      if (result.success) {
        Alert.alert(
          "Email Sent!",
          "We've sent another verification email to your inbox."
        );
        setCanResend(false);
        setCountdown(60);
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to resend verification email."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const getResendButtonText = () => {
    if (resendLoading) return "Sending...";
    if (canResend) return "Resend Email";
    return `Resend Email (${countdown}s)`;
  };

  return (
    <ScreenLayout
      showHeader={false}
      scrollable={false}
      backgroundColor={colors.background}
    >
      <StandardHeader showBack={!!onBack} onBack={onBack} title="" />

      <View
        style={[
          globalStyles.flex1,
          globalStyles.justifyCenter,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        <View style={[globalStyles.center, { marginBottom: spacing.xxxxl }]}>
          <Text style={[globalStyles.title, { marginBottom: spacing.md }]}>
            Check Your Email
          </Text>
          <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
            We sent a verification email to{" "}
            <Text style={globalStyles.link}>
              {userEmail || "your email address"}
            </Text>
          </Text>
        </View>

        <View style={[globalStyles.card, { marginBottom: spacing.xxxxl }]}>
          <Text
            style={[
              globalStyles.body,
              { fontWeight: "600", marginBottom: spacing.lg },
            ]}
          >
            What to do next:
          </Text>

          <View style={{ gap: spacing.md }}>
            <View style={globalStyles.row}>
              <Text
                style={[
                  globalStyles.link,
                  { marginRight: spacing.md, minWidth: 20 },
                ]}
              >
                1
              </Text>
              <Text style={[globalStyles.bodySecondary, globalStyles.flex1]}>
                Check your email inbox (and spam folder)
              </Text>
            </View>

            <View style={globalStyles.row}>
              <Text
                style={[
                  globalStyles.link,
                  { marginRight: spacing.md, minWidth: 20 },
                ]}
              >
                2
              </Text>
              <Text style={[globalStyles.bodySecondary, globalStyles.flex1]}>
                Click the "Verify Email" button in the email
              </Text>
            </View>

            <View style={globalStyles.row}>
              <Text
                style={[
                  globalStyles.link,
                  { marginRight: spacing.md, minWidth: 20 },
                ]}
              >
                3
              </Text>
              <Text style={[globalStyles.bodySecondary, globalStyles.flex1]}>
                Come back here and tap "I've Verified"
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "large"),
              (checking || loading) && globalStyles.buttonDisabled,
            ]}
            onPress={handleCheckVerification}
            disabled={checking || loading}
          >
            {checking ? (
              <View style={globalStyles.buttonContent}>
                <ActivityIndicator color={colors.text.inverse} size="small" />
                <Text style={globalStyles.buttonPrimaryText}>
                  Checking verification...
                </Text>
              </View>
            ) : (
              <View style={globalStyles.buttonContent}>
                <CheckCircle size={20} color={colors.text.inverse} />
                <Text style={globalStyles.buttonPrimaryText}>
                  I've Verified
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              { marginTop: spacing.md },
              (!canResend || resendLoading) && globalStyles.buttonDisabled,
            ]}
            onPress={handleResendEmail}
            disabled={!canResend || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={globalStyles.buttonContent}>
                <RotateCcw size={20} color={colors.primary} />
                <Text style={globalStyles.buttonSecondaryText}>
                  {getResendButtonText()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.row, globalStyles.center]}>
          <Text style={globalStyles.bodySecondary}>Wrong email address? </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={globalStyles.link}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default EmailVerificationScreen;
