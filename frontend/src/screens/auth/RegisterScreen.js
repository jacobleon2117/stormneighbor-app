// File: frontend/src/screens/auth/RegisterScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Mail, Eye, EyeOff, User } from "lucide-react-native";
import { AntDesign } from "@expo/vector-icons";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "../../components/AuthLayout";
import { authStyles, colors } from "../../styles/authStyles";
import apiService from "../../services/api";

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { fullName, email, password } = formData;

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return false;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = formData;
      const nameParts = userData.fullName.trim().split(" ");
      const firstName = nameParts.shift() || "";
      const lastName = nameParts.join(" ") || "";

      const result = await apiService.register({
        ...userData,
        firstName: firstName,
        lastName: lastName,
        email: userData.email.trim(),
      });

      if (result.success) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => onRegister(result.data) },
        ]);
      } else {
        Alert.alert("Registration Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert(
      "Feature In Development",
      "Google sign-up is currently being developed and will be available in a future update.",
      [{ text: "OK" }]
    );
  };

  const handleAppleSignUp = () => {
    Alert.alert(
      "Feature In Development",
      "Apple sign-up is currently being developed and will be available in a future update.",
      [{ text: "OK" }]
    );
  };

  return (
    <AuthLayout>
      {/* Header */}
      <View style={{ paddingTop: 20 }}>
        <AuthHeader
          title={<Text style={authStyles.title}>Create Account</Text>}
          subtitle={
            <Text style={authStyles.subtitle}>
              Fill out your information to get started with your neighborhood
            </Text>
          }
        />
      </View>

      {/* Full Name Input */}
      <Text style={authStyles.label}>Full Name</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={authStyles.input}
          value={formData.fullName}
          onChangeText={(value) => updateField("fullName", value)}
          placeholder="Your name"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <User
          size={18}
          color={colors.text.muted}
          style={{ position: "absolute", right: 16, top: 16 }}
        />
      </View>

      {/* Email Input */}
      <Text style={authStyles.label}>Email</Text>
      <View style={{ position: "relative", marginBottom: 16 }}>
        <TextInput
          style={authStyles.input}
          value={formData.email}
          onChangeText={(value) => updateField("email", value)}
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
          value={formData.password}
          onChangeText={(value) => updateField("password", value)}
          placeholder="At least 8 characters"
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

      {/* Create Account Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </AuthButtons>

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
          onPress={handleGoogleSignUp}
        >
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text style={authStyles.socialText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.socialButton}
          onPress={handleAppleSignUp}
        >
          <AntDesign name="apple1" size={20} color="#000000" />
          <Text style={authStyles.socialText}>Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <AuthFooter>
        <Text style={authStyles.bodyText}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={authStyles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </AuthFooter>
    </AuthLayout>
  );
};

export default RegisterScreen;
