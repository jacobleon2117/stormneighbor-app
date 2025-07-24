// File: frontend/src/screens/auth/EmailVerificationScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CheckCircle, RotateCcw } from "lucide-react-native";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";
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
      const checkingAlert = setTimeout(() => {
        Alert.alert("Checking...", "We're checking your verification status");
      }, 500);

      const result = await apiService.checkEmailVerification();

      clearTimeout(checkingAlert);

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
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        title={<Text style={authStyles.title}>Check Your Email</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            We sent a verification email to{" "}
            <Text style={authStyles.linkText}>
              {userEmail || "your email address"}
            </Text>
          </Text>
        }
      />

      {/* Instructions Card */}
      <View style={[authStyles.card, { marginBottom: 32 }]}>
        <Text style={[authStyles.label, { marginBottom: 16 }]}>
          What to do next:
        </Text>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text
              style={[authStyles.linkText, { marginRight: 12, minWidth: 20 }]}
            >
              1
            </Text>
            <Text style={[authStyles.bodyText, { flex: 1 }]}>
              Check your email inbox (and spam folder)
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text
              style={[authStyles.linkText, { marginRight: 12, minWidth: 20 }]}
            >
              2
            </Text>
            <Text style={[authStyles.bodyText, { flex: 1 }]}>
              Click the "Verify Email" button in the email
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text
              style={[authStyles.linkText, { marginRight: 12, minWidth: 20 }]}
            >
              3
            </Text>
            <Text style={[authStyles.bodyText, { flex: 1 }]}>
              Come back here and tap "I've Verified"
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <AuthButtons>
        {/* I've Verified Button */}
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            (checking || loading) && authStyles.buttonDisabled,
          ]}
          onPress={handleCheckVerification}
          disabled={checking || loading}
        >
          {checking ? (
            <View style={authStyles.buttonContent}>
              <ActivityIndicator color={colors.text.inverse} size="small" />
              <Text style={authStyles.primaryButtonText}>
                Checking verification...
              </Text>
            </View>
          ) : (
            <View style={authStyles.buttonContent}>
              <CheckCircle size={20} color={colors.text.inverse} />
              <Text style={authStyles.primaryButtonText}>I've Verified</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Resend Email Button with Timer Inside */}
        <TouchableOpacity
          style={[
            authStyles.secondaryButton,
            (!canResend || resendLoading) && authStyles.buttonDisabled,
          ]}
          onPress={handleResendEmail}
          disabled={!canResend || resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={authStyles.buttonContent}>
              <RotateCcw size={20} color={colors.primary} />
              <Text style={authStyles.secondaryButtonText}>
                {getResendButtonText()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Wrong email address? </Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={authStyles.linkText}>Go Back</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default EmailVerificationScreen;
