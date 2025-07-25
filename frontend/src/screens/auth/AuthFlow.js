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
      // Check if user needs profile setup
      setUserNeedsSetup(true);
      setCurrentScreen("profileSetup");
      return;
    }

    if (result.error) {
      Alert.alert("Registration Failed", result.error);
    }
  };

  const handleProfileSetupComplete = () => {
    setUserNeedsSetup(false);
    // Navigation will be handled by the main app
  };

  if (loading && currentScreen === "welcome") {
    return <LoadingScreen />;
  }

  if (userNeedsSetup || currentScreen === "profileSetup") {
    return (
      <ProfileSetupFlow
        onSetupComplete={handleProfileSetupComplete}
        onBack={() => setCurrentScreen("register")}
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
