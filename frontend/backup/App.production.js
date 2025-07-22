import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";

// Import API service
import apiService from "./src/services/api";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("welcome"); // welcome, login, register, main
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        // Verify token with backend
        const result = await apiService.getProfile();
        if (result.success) {
          setUser(result.data);
          setCurrentScreen("main");
        } else {
          // Token is invalid, remove it
          await AsyncStorage.removeItem("authToken");
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    setCurrentScreen("login");
  };

  const handleLogin = (userData) => {
    setUser(userData.user);
    setCurrentScreen("main");
  };

  const handleRegister = (userData) => {
    setUser(userData.user);
    setCurrentScreen("main");
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setUser(null);
      setCurrentScreen("welcome");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🌪️</Text>
        <Text style={styles.loadingTitle}>Storm Neighbor</Text>
      </SafeAreaView>
    );
  }

  // Main app (temporary - we'll replace this with your tab navigation)
  if (currentScreen === "main" && user) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>
              Welcome, {user.firstName}! 👋
            </Text>
            <Text style={styles.subtitleText}>
              Your neighborhood weather app is ready
            </Text>
          </View>

          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
            <Text style={styles.comingSoonTitle}>Main App Coming Soon!</Text>
            <Text style={styles.comingSoonText}>
              We'll build the tab navigation and main screens next:
            </Text>

            <View style={styles.featureList}>
              <Text style={styles.featureItem}>🏠 Home Feed</Text>
              <Text style={styles.featureItem}>🌦️ Weather Alerts</Text>
              <Text style={styles.featureItem}>👥 Community Posts</Text>
              <Text style={styles.featureItem}>🚨 Emergency Alerts</Text>
              <Text style={styles.featureItem}>👤 Profile Settings</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Auth flow screens
  switch (currentScreen) {
    case "welcome":
      return <WelcomeScreen onGetStarted={handleGetStarted} />;

    case "login":
      return (
        <LoginScreen
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentScreen("register")}
        />
      );

    case "register":
      return (
        <RegisterScreen
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentScreen("login")}
        />
      );

    default:
      return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  mainContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#a0a0b8",
    textAlign: "center",
  },
  comingSoonContainer: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 40,
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: "#a0a0b8",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    alignItems: "flex-start",
  },
  featureItem: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
