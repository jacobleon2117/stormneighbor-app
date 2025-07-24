// File: frontend/src/screens/main/MainApp.js
import { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import { mainStyles } from "@styles/mainStyles";
import TabNavigation from "@components/layout/TabNavigation";
import apiService from "@services/api";
import HomeScreen from "./HomeScreen";
import WeatherScreen from "./WeatherScreen";
import CreatePostScreen from "./CreatePostScreen";
import AlertsScreen from "./AlertsScreen";
import ProfileScreen from "./ProfileScreen";

const MainApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [alertCounts, setAlertCounts] = useState({
    total: 0,
    critical: 0,
    weather: 0,
    community: 0,
  });

  useEffect(() => {
    loadAlertCounts();

    const interval = setInterval(loadAlertCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.neighborhoodId]);

  const loadAlertCounts = async () => {
    try {
      if (!user?.neighborhoodId) return;

      const result = await apiService.getAlerts(user.neighborhoodId);
      if (result.success) {
        const alerts = result.data.alerts || [];
        const counts = {
          critical: alerts.filter((a) => a.severity === "CRITICAL").length,
          weather: alerts.filter((a) => a.source === "NOAA").length,
          community: alerts.filter((a) => a.source === "USER").length,
        };
        counts.total = counts.critical + counts.weather + counts.community;
        setAlertCounts(counts);
      }
    } catch (error) {
      console.error("Error loading alert counts:", error);
    }
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
  };

  const handleNavigateToPost = (postId) => {
    // TODO: Navigate to post detail screen
    Alert.alert("Navigate to Post", `Post ID: ${postId}`);
  };

  const handleNavigateToProfile = (userId) => {
    // TODO: Navigate to user profile screen
    Alert.alert("Navigate to Profile", `User ID: ${userId}`);
  };

  const handleCreatePost = () => {
    // TODO: Navigate to create post screen
    Alert.alert("Create Post", "This will open the create post screen");
  };

  const renderCurrentScreen = () => {
    const screenProps = {
      user,
      onNavigateToPost: handleNavigateToPost,
      onNavigateToProfile: handleNavigateToProfile,
      onCreatePost: handleCreatePost,
      onLogout,
    };

    switch (activeTab) {
      case "home":
        return <HomeScreen {...screenProps} alertCounts={alertCounts} />;

      case "weather":
        return <WeatherScreen {...screenProps} />;

      case "create":
        return <CreatePostScreen {...screenProps} />;

      case "alerts":
        return <AlertsScreen {...screenProps} alertCounts={alertCounts} />;

      case "profile":
        return <ProfileScreen {...screenProps} />;

      default:
        return <HomeScreen {...screenProps} alertCounts={alertCounts} />;
    }
  };

  return (
    <View style={mainStyles.container}>
      {renderCurrentScreen()}
      <TabNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        alertCounts={alertCounts}
      />
    </View>
  );
};

export default MainApp;
