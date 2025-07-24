// File path: frontend/src/screens/auth/ForgotPasswordScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Mail, CheckCircle } from "lucide-react-native";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

const ForgotPasswordScreen = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setEmailSent(true);
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        {/* Success Header with Lucide Icon */}
        <AuthHeader
          icon={<CheckCircle size={48} color={colors.success} />}
          title={<Text style={authStyles.title}>Email Sent!</Text>}
          subtitle={
            <Text style={authStyles.subtitle}>
              We've sent password reset instructions to{"\n"}
              <Text style={authStyles.linkText}>{email}</Text>
            </Text>
          }
        />

        {/* Instructions */}
        <View style={[authStyles.card, { marginBottom: 32 }]}>
          <Text
            style={[
              authStyles.bodyText,
              { textAlign: "center", lineHeight: 24 },
            ]}
          >
            Please check your email and follow the link to reset your password.
            Don't forget to check your spam folder!
          </Text>
        </View>

        {/* Back to Sign In Button */}
        <AuthButtons>
          <TouchableOpacity
            style={authStyles.primaryButton}
            onPress={onBackToLogin}
          >
            <Text style={authStyles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </AuthButtons>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Header */}
      <AuthHeader
        title={<Text style={authStyles.title}>Forgot Password?</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            Don't worry! Enter your email address and we'll send you
            instructions to reset your password.
          </Text>
        }
      />

      {/* Email Input */}
      <Text style={authStyles.label}>Email</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={authStyles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.text.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Mail
          size={18}
          color={colors.text.muted}
          style={{ position: "absolute", right: 16, top: 16 }}
        />
      </View>

      {/* Send Reset Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={authStyles.primaryButtonText}>
              Send Reset Instructions
            </Text>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Remember your password? </Text>
        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={authStyles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default ForgotPasswordScreen;
