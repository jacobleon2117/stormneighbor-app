// File: frontend/src/screens/auth/AuthFlow.js
import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useAuth } from "@contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import WelcomeScreen from "./WelcomeScreen";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import ProfileSetupFlow from "./profile/ProfileSetupFlow";

const AuthFlow = () => {
  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [userNeedsSetup, setUserNeedsSetup] = useState(false);
  const { login, register, loading } = useAuth();

  const handleLogin = async (email, password) => {
    const result = await login(email, password);

    if (result.success) {
      // Navigation will be handled by the main app based on auth state
      return;
    }

    if (result.error) {
      Alert.alert("Login Failed", result.error);
    }
  };

  const handleRegister = async (userData) => {
    const result = await register(userData);

    if (result.success) {
      console.log("Registration successful, triggering profile setup");
      // User registered successfully, send them to profile setup
      setUserNeedsSetup(true);
      setCurrentScreen("profileSetup");
      return;
    }

    if (result.error) {
      // Check if error indicates user already exists
      if (
        result.error.toLowerCase().includes("already exists") ||
        result.error.toLowerCase().includes("user already") ||
        result.error.toLowerCase().includes("email already")
      ) {
        Alert.alert(
          "Account Exists",
          "An account with this email already exists. Please sign in instead.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign In",
              onPress: () => setCurrentScreen("login"),
            },
          ]
        );
      } else {
        Alert.alert("Registration Failed", result.error);
      }
    }
  };

  const handleProfileSetupComplete = () => {
    console.log("Profile setup completed");
    setUserNeedsSetup(false);
    // This should trigger the main app to show
  };

  if (loading && currentScreen === "welcome") {
    return <LoadingScreen />;
  }

  // Force profile setup if user needs it
  if (userNeedsSetup && currentScreen === "profileSetup") {
    console.log("Showing profile setup flow");
    return (
      <ProfileSetupFlow
        onSetupComplete={handleProfileSetupComplete}
        onBack={() => {
          // Don't allow going back to registration after successful signup
          console.log("Profile setup back pressed - staying in setup");
        }}
      />
    );
  }

  switch (currentScreen) {
    case "welcome":
      return (
        <WelcomeScreen
          onGetStarted={() => setCurrentScreen("register")}
          onSignIn={() => setCurrentScreen("login")}
        />
      );

    case "login":
      return (
        <LoginScreen
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentScreen("register")}
          onForgotPassword={() => setCurrentScreen("forgotPassword")}
          loading={loading}
        />
      );

    case "register":
      return (
        <RegisterScreen
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentScreen("login")}
          loading={loading}
        />
      );

    case "forgotPassword":
      return (
        <ForgotPasswordScreen onBackToLogin={() => setCurrentScreen("login")} />
      );

    case "profileSetup":
      // This should also show profile setup
      console.log("Profile setup case triggered");
      return (
        <ProfileSetupFlow
          onSetupComplete={handleProfileSetupComplete}
          onBack={() => setCurrentScreen("register")}
        />
      );

    default:
      return (
        <WelcomeScreen
          onGetStarted={() => setCurrentScreen("register")}
          onSignIn={() => setCurrentScreen("login")}
        />
      );
  }
};

export default AuthFlow;
