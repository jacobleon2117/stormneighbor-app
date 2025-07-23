import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";

import LoadingScreen from "../screens/auth/LoadingScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import VerifyCodeScreen from "../screens/auth/VerifyCodeScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import EmailVerificationScreen from "../screens/auth/EmailVerificationScreen";

import ProfileSetupFlow from "../screens/auth/profile/ProfileSetupFlow";
import LocationSetupScreen from "../screens/auth/profile/LocationSetupScreen";
import ProfileSetupScreenIndividual from "../screens/auth/profile/ProfileSetupScreenIndividual";
import NotificationsSetupScreen from "../screens/auth/profile/NotificationsSetupScreen";

const ScreenNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState("navigator");

  const screens = [
    {
      id: "loading",
      name: "Loading Screen",
      component: LoadingScreen,
      group: "Auth Flow",
    },
    {
      id: "welcome",
      name: "Welcome Screen",
      component: WelcomeScreen,
      group: "Auth Flow",
    },
    {
      id: "login",
      name: "Login Screen",
      component: LoginScreen,
      group: "Auth Flow",
    },
    {
      id: "register",
      name: "Register Screen",
      component: RegisterScreen,
      group: "Auth Flow",
    },
    {
      id: "email-verify",
      name: "Email Verification",
      component: EmailVerificationScreen,
      group: "Auth Flow",
    },
    {
      id: "forgot",
      name: "Forgot Password",
      component: ForgotPasswordScreen,
      group: "Password Reset",
    },
    {
      id: "verify",
      name: "Verify Code",
      component: VerifyCodeScreen,
      group: "Password Reset",
    },
    {
      id: "reset",
      name: "Reset Password",
      component: ResetPasswordScreen,
      group: "Password Reset",
    },
    {
      id: "change",
      name: "Change Password",
      component: ChangePasswordScreen,
      group: "Settings",
    },
    {
      id: "profile-setup-flow",
      name: "Profile Setup Flow",
      component: ProfileSetupFlow,
      group: "Profile Setup",
    },
    {
      id: "location-setup",
      name: "Location Setup",
      component: LocationSetupScreen,
      group: "Profile Setup",
    },
    {
      id: "profile-setup-individual",
      name: "Profile Setup",
      component: ProfileSetupScreenIndividual,
      group: "Profile Setup",
    },
    {
      id: "notifications-setup",
      name: "Notifications Setup",
      component: NotificationsSetupScreen,
      group: "Profile Setup",
    },
  ];

  const mockHandlers = {
    onGetStarted: () => console.log("Get Started pressed"),
    onLogin: (data) => console.log("Login successful:", data),
    onRegister: (data) => console.log("Register successful:", data),
    onSwitchToLogin: () => setCurrentScreen("login"),
    onSwitchToRegister: () => setCurrentScreen("register"),
    onBackToLogin: () => setCurrentScreen("login"),
    onForgotPassword: () => setCurrentScreen("forgot"),
    onBackToForgot: () => setCurrentScreen("forgot"),
    onCodeVerified: (code) => {
      console.log("Code verified:", code);
      setCurrentScreen("reset");
    },
    onResendCode: () => console.log("Resend code requested"),
    onPasswordReset: () => {
      console.log("Password reset successful");
      setCurrentScreen("login");
    },
    onSetupComplete: () => {
      console.log("Profile setup completed!");
      setCurrentScreen("navigator");
    },
    onBack: () => setCurrentScreen("navigator"),
    onNext: (data) => console.log("Next step:", data),
    onComplete: async (data) => {
      console.log("Setup completed:", data);
      setCurrentScreen("navigator");
    },
    email: "user@example.com",
    verificationCode: "123456",
  };

  const renderCurrentScreen = () => {
    const screen = screens.find((s) => s.id === currentScreen);
    if (!screen) return null;

    const ScreenComponent = screen.component;
    return <ScreenComponent {...mockHandlers} />;
  };

  const groupedScreens = screens.reduce((groups, screen) => {
    const group = screen.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(screen);
    return groups;
  }, {});

  if (currentScreen === "navigator") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </View>
          </View>
          <Text style={styles.title}>
            Storm<Text style={styles.highlightText}>Neighbor</Text>
          </Text>
          <Text style={styles.subtitle}>Auth Screens Navigator</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {Object.entries(groupedScreens).map(([groupName, groupScreens]) => (
            <View key={groupName} style={styles.screenGroup}>
              <Text style={styles.sectionTitle}>{groupName}</Text>

              {groupScreens.map((screen) => (
                <TouchableOpacity
                  key={screen.id}
                  style={styles.screenButton}
                  onPress={() => setCurrentScreen(screen.id)}
                >
                  <Text style={styles.screenButtonText}>{screen.name}</Text>
                  <Text style={styles.screenButtonArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 How to Use</Text>
            <Text style={styles.infoText}>
              • Tap any screen above to preview it{"\n"}• All interactions are
              logged to console{"\n"}• Use back button to return here{"\n"}•
              Perfect for testing designs & flows{"\n"}• Profile Setup Flow
              connects all 3 setup screens
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen("navigator")}
      >
        <Text style={styles.backButtonText}>← Back to Navigator</Text>
      </TouchableOpacity>

      <View style={styles.screenContent}>{renderCurrentScreen()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  highlightText: {
    color: "#FBBF24",
  },
  subtitle: {
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "Inter",
    fontWeight: "300",
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  screenGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 12,
    marginTop: 8,
  },
  screenButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  screenButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  screenButtonArrow: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#EBF8FF",
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#1F2937",
    fontFamily: "Inter",
    fontWeight: "300",
    lineHeight: 20,
    opacity: 0.8,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  backButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  screenContent: {
    flex: 1,
  },
});

export default ScreenNavigator;
