// File: frontend/src/screens/main/MainApp.js
import React, { useState, useEffect } from "react";
import { View, Modal } from "react-native";
import { globalStyles } from "@styles/designSystem";
import { useAuth } from "@contexts/AuthContext";
import TabNavigation from "@components/layout/TabNavigation";
import apiService from "@services/api";
import HomeScreen from "./HomeScreen";
import WeatherScreen from "./WeatherScreen";
import CreatePostScreen from "./CreatePostScreen";
import AlertsScreen from "./AlertsScreen";
import ProfileScreen from "./ProfileScreen";

const MainApp = ({ user }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
    total: 0,
    critical: 0,
    weather: 0,
    community: 0,
  });

  useEffect(() => {
    if (user?.neighborhoodId) {
      loadAlertCounts();

      const interval = setInterval(loadAlertCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.neighborhoodId]);

  const loadAlertCounts = async () => {
    if (!user?.neighborhoodId) {
      return;
    }

    try {
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

  const handleCreatePost = async (postData) => {
    try {
      console.log("Creating post with data:", postData); // Add this line

      const result = await apiService.createPost({
        ...postData,
        // Remove this line since we don't use neighborhoodId anymore:
        // neighborhoodId: user.neighborhoodId,
      });

      if (result.success) {
        console.log("Post created successfully:", result.data);
        setShowCreatePost(false);
      } else {
        console.log("Post creation failed:", result.error); // Add this line
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleNavigateToPost = (postId) => {
    // TODO: Implement post detail navigation
    console.log("Navigate to post:", postId);
  };

  const handleNavigateToProfile = (userId) => {
    // TODO: Implement profile navigation
    console.log("Navigate to profile:", userId);
  };

  const renderCurrentScreen = () => {
    const screenProps = {
      user,
      onNavigateToPost: handleNavigateToPost,
      onNavigateToProfile: handleNavigateToProfile,
      onCreatePost: handleCreatePost,
      onLogout: logout,
      alertCounts,
    };

    switch (activeTab) {
      case "home":
        return <HomeScreen {...screenProps} />;

      case "weather":
        return <WeatherScreen {...screenProps} />;

      case "alerts":
        return <AlertsScreen {...screenProps} />;

      case "profile":
        return <ProfileScreen {...screenProps} />;

      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  return (
    <View style={globalStyles.container}>
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
