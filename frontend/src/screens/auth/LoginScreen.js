// File: frontend/src/screens/auth/LoginScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Mail, Eye, EyeOff } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "../../components/AuthLayout";
import { authStyles, colors } from "../../styles/authStyles";
import apiService from "../../services/api";

const LoginScreen = ({ onLogin, onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.login(email.trim(), password);

      if (result.success) {
        Alert.alert("Success", "Welcome back!", [
          { text: "OK", onPress: () => onLogin(result.data) },
        ]);
      } else {
        Alert.alert("Login Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Feature In Development",
      "Google sign-in is currently being developed and will be available in a future update.",
      [{ text: "OK" }]
    );
  };

  const handleAppleSignIn = () => {
    Alert.alert(
      "Feature In Development",
      "Apple sign-in is currently being developed and will be available in a future update.",
      [{ text: "OK" }]
    );
  };

  return (
    <AuthLayout>
      {/* Header */}
      <View style={{ paddingTop: 20 }}>
        <AuthHeader
          title={<Text style={authStyles.title}>Welcome Back</Text>}
          subtitle={
            <Text style={authStyles.subtitle}>
              Sign in to your Storm
              <Text style={{ color: colors.primary }}>Neighbor</Text> account
            </Text>
          }
        />
      </View>

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

      {/* Password Input */}
      <Text style={authStyles.label}>Password</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={[authStyles.input, { paddingRight: 50 }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 16, top: 16, padding: 8 }}
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={18} color={colors.text.muted} />
          ) : (
            <Eye size={18} color={colors.text.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Forgot Password Link */}
      <TouchableOpacity
        style={{ alignItems: "center", marginBottom: 16 }}
        onPress={onForgotPassword}
      >
        <Text style={authStyles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Social Login Divider */}
      <View style={authStyles.dividerContainer}>
        <View style={authStyles.dividerLine} />
        <Text style={authStyles.dividerText}>or continue with</Text>
        <View style={authStyles.dividerLine} />
      </View>

      {/* Social Login Buttons */}
      <View style={authStyles.socialContainer}>
        <TouchableOpacity
          style={authStyles.socialButton}
          onPress={handleGoogleSignIn}
        >
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text style={authStyles.socialText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.socialButton}
          onPress={handleAppleSignIn}
        >
          <AntDesign name="apple1" size={20} color="#000000" />
          <Text style={authStyles.socialText}>Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Don't have an account? </Text>
        <TouchableOpacity onPress={onSwitchToRegister}>
          <Text style={authStyles.linkText}>Sign Up</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default LoginScreen;
