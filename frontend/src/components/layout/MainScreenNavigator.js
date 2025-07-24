// File: frontend/src/components/layout/MainScreenNavigator.js
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";

import MainApp from "@screens/main/MainApp";
import HomeScreen from "@screens/main/HomeScreen";
import HomeOnlyTestScreen from "@screens/main/HomeOnlyTestScreen";
import WeatherScreen from "@screens/main/WeatherScreen";
import CreatePostScreen from "@screens/main/CreatePostScreen";
import AlertsScreen from "@screens/main/AlertsScreen";
import ProfileScreen from "@screens/main/ProfileScreen";

const MainScreenNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState("navigator");

  const mockUser = {
    id: 1,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    neighborhoodId: 1,
    neighborhoodName: "Downtown Test Area",
    isVerified: true,
  };

  const mockAlertCounts = {
    total: 3,
    critical: 1,
    weather: 1,
    community: 1,
  };

  const screens = [
    {
      id: "mainApp",
      name: "Complete Main App",
      description: "Full app with tab navigation",
      component: MainApp,
      category: "Complete App",
    },
    {
      id: "homeOnly",
      name: "Home with Navigation",
      description: "Home screen with top nav + bottom tab nav",
      component: HomeOnlyTestScreen,
      category: "Individual Screens",
    },
    {
      id: "home",
      name: "Home Screen Only",
      description: "Just the home screen content, no navigation",
      component: HomeScreen,
      category: "Individual Screens",
    },
    {
      id: "weather",
      name: "Weather Screen",
      description: "Weather maps and forecasts",
      component: WeatherScreen,
      category: "Individual Screens",
    },
    {
      id: "create",
      name: "Create Post Screen",
      description: "Emergency post creation with templates",
      component: CreatePostScreen,
      category: "Individual Screens",
    },
    {
      id: "alerts",
      name: "Alerts Screen",
      description: "Weather and emergency alerts",
      component: AlertsScreen,
      category: "Individual Screens",
    },
    {
      id: "profile",
      name: "Profile Screen",
      description: "User profile and settings",
      component: ProfileScreen,
      category: "Individual Screens",
    },
  ];

  const mockHandlers = {
    user: mockUser,
    alertCounts: mockAlertCounts,
    onNavigateToPost: (postId) => console.log("Navigate to post:", postId),
    onNavigateToProfile: (userId) =>
      console.log("Navigate to profile:", userId),
    onCreatePost: () => console.log("Create post pressed"),
    onLogout: () => {
      console.log("Logout pressed");
      setCurrentScreen("navigator");
    },
  };

  const renderCurrentScreen = () => {
    const screen = screens.find((s) => s.id === currentScreen);
    if (!screen) return null;

    const ScreenComponent = screen.component;
    return <ScreenComponent {...mockHandlers} />;
  };

  const groupedScreens = screens.reduce((acc, screen) => {
    if (!acc[screen.category]) {
      acc[screen.category] = [];
    }
    acc[screen.category].push(screen);
    return acc;
  }, {});

  if (currentScreen !== "navigator") {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen("navigator")}
          >
            <ArrowLeft size={16} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back to Navigator</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.screenContent}>{renderCurrentScreen()}</View>
      </View>
    );
  }

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
        <Text style={styles.subtitle}>Main Screens Navigator</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedScreens).map(([category, categoryScreens]) => (
          <View key={category} style={styles.screenGroup}>
            <Text style={styles.sectionTitle}>{category}</Text>

            {categoryScreens.map((screen) => (
              <TouchableOpacity
                key={screen.id}
                style={styles.screenButton}
                onPress={() => setCurrentScreen(screen.id)}
              >
                <View style={styles.screenInfo}>
                  <Text style={styles.screenButtonText}>{screen.name}</Text>
                  <Text style={styles.screenDescription}>
                    {screen.description}
                  </Text>
                </View>
                <Text style={styles.screenButtonArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Development Info</Text>
          <Text style={styles.infoText}>
            • All screens use mock data for testing{"\n"}• Interactions are
            logged to console{"\n"}• Use back button to return to navigator
            {"\n"}• Test different screen states and layouts{"\n"}• Main App
            shows complete tab navigation{"\n"}• Individual screens show
            components in isolation
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  screenInfo: {
    flex: 1,
  },
  screenButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  screenDescription: {
    fontSize: 14,
    color: "#6B7280",
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
  backButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  backButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
    marginLeft: 6,
  },
  screenContent: {
    flex: 1,
  },
});

export default MainScreenNavigator;
