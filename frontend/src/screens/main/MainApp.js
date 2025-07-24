// File: frontend/src/screens/main/MainApp.js
import { useState, useEffect } from "react";
import { View, Alert, Modal } from "react-native";
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
  const [showCreatePost, setShowCreatePost] = useState(false);
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
    if (tabId === "create") {
      setShowCreatePost(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCloseCreatePost = () => {
    setShowCreatePost(false);
  };

  const handleCreatePost = (postData) => {
    console.log("New post created:", postData);
    setShowCreatePost(false);
  };

  const handleNavigateToPost = (postId) => {
    Alert.alert("Navigate to Post", `Post ID: ${postId}`);
  };

  const handleNavigateToProfile = (userId) => {
    Alert.alert("Navigate to Profile", `User ID: ${userId}`);
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

      {!showCreatePost && (
        <TabNavigation
          activeTab={activeTab}
          onTabPress={handleTabPress}
          alertCounts={alertCounts}
        />
      )}

      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CreatePostScreen
          user={user}
          onCreatePost={handleCreatePost}
          onClose={handleCloseCreatePost}
        />
      </Modal>
    </View>
  );
};

export default MainApp;
