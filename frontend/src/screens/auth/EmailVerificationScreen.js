import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CheckCircle, RotateCcw, ArrowLeft } from "lucide-react-native";
import apiService from "../../services/api";

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wrapper}>
            {/* Back Button */}
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            )}

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a verification email to{" "}
                {userEmail || "your email address"}
              </Text>
            </View>

            {/* Form Content */}
            <View style={styles.form}>
              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>What to do next:</Text>
                <View style={styles.instructionsList}>
                  <View style={styles.instructionItem}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>
                      Check your email inbox (and spam folder)
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={styles.stepNumber}>2</Text>
                    <Text style={styles.stepText}>
                      Click the "Verify Email" button in the email
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={styles.stepNumber}>3</Text>
                    <Text style={styles.stepText}>
                      Come back here and tap "I've Verified"
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    (checking || loading) && styles.buttonDisabled,
                  ]}
                  onPress={handleCheckVerification}
                  disabled={checking || loading}
                >
                  {checking ? (
                    <View style={styles.checkingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.checkingText}>
                        Checking verification...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <CheckCircle size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>I've Verified</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    (!canResend || resendLoading) && styles.buttonDisabled,
                  ]}
                  onPress={handleResendEmail}
                  disabled={!canResend || resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator color="#3B82F6" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <RotateCcw size={20} color="#3B82F6" />
                      <Text style={styles.secondaryButtonText}>
                        {canResend ? "Resend Email" : `Resend Email`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {!canResend && (
                  <Text style={styles.timerText}>
                    You can resend in {countdown} seconds
                  </Text>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Wrong email address? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.footerLink}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  wrapper: {
    justifyContent: "center",
    minHeight: "100%",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: -20,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
  form: {
    marginBottom: 24,
  },
  instructionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
    fontFamily: "Inter",
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    marginRight: 12,
    fontFamily: "Inter",
    minWidth: 20,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
    flex: 1,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkingText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  secondaryButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: "Inter",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
  },
  footerLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    fontFamily: "Inter",
  },
});

export default EmailVerificationScreen;
