// File: frontend/src/screens/main/MainApp.js
import { useState, useEffect } from "react";
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
import PostCommentsScreen from "./PostCommentsScreen";

const MainApp = ({ user }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
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
      console.log("Creating post with data:", postData);

      const result = await apiService.createPost({
        ...postData,
      });

      if (result.success) {
        console.log("Post created successfully:", result.data);
        setShowCreatePost(false);
      } else {
        console.log("Post creation failed:", result.error);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleNavigateToPost = (postId) => {
    // TODO: Implement post detail navigation
    console.log("Navigate to post:", postId);
  };

  const handleNavigateToComments = (post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPost(null);
  };

  const handleUpdateCommentCount = (postId, newCount) => {
    // Update comment count in the current screen if needed
    // This could be passed down to child components to update their state
    console.log(`Post ${postId} now has ${newCount} comments`);
  };

  const handlePostLike = async (post) => {
    try {
      const result = await apiService.addReaction(post.id, "like");

      if (result.success) {
        // Update the selected post if it's the same one being liked
        if (selectedPost && selectedPost.id === post.id) {
          setSelectedPost((prev) => ({
            ...prev,
            userHasLiked:
              result.data.action === "added" ||
              result.data.action === "updated",
            reactionCount:
              result.data.action === "added"
                ? (prev.reactionCount || 0) + 1
                : result.data.action === "removed"
                ? Math.max((prev.reactionCount || 0) - 1, 0)
                : prev.reactionCount,
          }));
        }
        console.log(`Like ${result.data.action} for post ${post.id}`);
      } else {
        console.error("Failed to update reaction:", result.error);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleNavigateToProfile = (userId) => {
    // TODO: Implement profile navigation
    console.log("Navigate to profile:", userId);
  };

  const renderCurrentScreen = () => {
    const screenProps = {
      user,
      onNavigateToPost: handleNavigateToPost,
      onNavigateToComments: handleNavigateToComments,
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

      {!showCreatePost && !showComments && (
        <TabNavigation
          activeTab={activeTab}
          onTabPress={handleTabPress}
          alertCounts={alertCounts}
        />
      )}

      {/* Create Post Modal */}
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

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedPost && (
          <PostCommentsScreen
            post={selectedPost}
            user={user}
            onClose={handleCloseComments}
            onLike={handlePostLike}
            onUpdateCommentCount={handleUpdateCommentCount}
          />
        )}
      </Modal>
    </View>
  );
};

export default MainApp;
