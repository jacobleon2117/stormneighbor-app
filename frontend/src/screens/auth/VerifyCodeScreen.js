// File path: frontend/src/screens/auth/VerifyCodeScreen.js
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Shield, ArrowLeft, RotateCcw } from "lucide-react-native";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "../../components/AuthLayout";
import { authStyles, colors } from "../../styles/authStyles";
import apiService from "../../services/api";

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
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<Shield size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Enter Verification Code</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            We've sent a 6-digit code to{"\n"}
            <Text style={authStyles.linkText}>{email}</Text>
          </Text>
        }
      />

      {/* Code Input Grid */}
      <View style={{ marginBottom: 32 }}>
        <View style={codeInputStyles.container}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                codeInputStyles.input,
                digit ? codeInputStyles.inputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>
      </View>

      {/* Verify Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Resend Button */}
        <TouchableOpacity
          style={[
            authStyles.secondaryButton,
            (!canResend || resendLoading) && authStyles.buttonDisabled,
          ]}
          onPress={handleResendCode}
          disabled={!canResend || resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={authStyles.buttonContent}>
              <RotateCcw size={20} color={colors.primary} />
              <Text style={authStyles.secondaryButtonText}>
                {canResend ? "Resend Code" : `Resend Code ${countdown}s`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={authStyles.linkText}>Change Email</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

// Custom styles for code input grid
const codeInputStyles = {
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  input: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.primary,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
};

export default VerifyCodeScreen;
