// File: frontend/src/screens/auth/VerifyCodeScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Shield, RotateCcw } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";
import apiService from "@services/api";

const VerifyCodeScreen = ({ email, onCodeVerified, onBack, onResendCode }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

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

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyCode(email, verificationCode);

      if (result.success) {
        Alert.alert("Success!", "Code verified successfully!", [
          { text: "Continue", onPress: () => onCodeVerified(verificationCode) },
        ]);
      } else {
        Alert.alert("Error", result.error || "Invalid verification code");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const result = await apiService.resendVerificationCode(email);

      if (result.success) {
        Alert.alert(
          "Code Sent!",
          "We've sent a new verification code to your email."
        );
        setCanResend(false);
        setCountdown(60);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Error", result.error || "Failed to resend code");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
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
          <Shield size={32} color={colors.primary} />
          <Text
            style={[
              globalStyles.title,
              { marginTop: spacing.lg, marginBottom: spacing.md },
            ]}
          >
            Enter Verification Code
          </Text>
          <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
            We've sent a 6-digit code to{"\n"}
            <Text style={globalStyles.link}>{email}</Text>
          </Text>
        </View>

        <View style={{ marginBottom: spacing.xxxxl }}>
          <View style={styles.codeInputContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) =>
                  handleCodeChange(value.slice(-1), index)
                }
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
                editable={!loading && !resendLoading}
              />
            ))}
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "large"),
              loading && globalStyles.buttonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={globalStyles.buttonPrimaryText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              { marginTop: spacing.md },
              (!canResend || resendLoading) && globalStyles.buttonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={!canResend || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={globalStyles.buttonContent}>
                <RotateCcw size={20} color={colors.primary} />
                <Text style={globalStyles.buttonSecondaryText}>
                  {canResend ? "Resend Code" : `Resend Code (${countdown}s)`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.row, globalStyles.center]}>
          <Text style={globalStyles.bodySecondary}>
            Didn't receive the code?{" "}
          </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={globalStyles.link}>Change Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
};

export default VerifyCodeScreen;
