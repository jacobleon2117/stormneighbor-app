// File: frontend/src/screens/main/HomeOnlyTestScreen.js
import { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";

import TopNav from "@components/layout/TopNav";
import GreetingHeader from "@components/common/GreetingHeader";
import PostCard from "@components/common/PostCard";
import TabNavigation from "@components/layout/TabNavigation";
import apiService from "@services/api";

const HomeOnlyTestScreen = ({
  user,
  onNavigateToPost,
  onNavigateToProfile,
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
    total: 6,
    critical: 1,
    weather: 2,
    community: 3,
  });

  const mockPosts = [
    {
      id: 1,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      user: { firstName: "John", lastName: "Doe" },
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      isEmergency: true,
      postType: "safety_alert",
      reactionCount: 12,
      commentCount: 5,
      hasImage: false,
    },
    {
      id: 2,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      user: { firstName: "Weather", lastName: "Service" },
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      isEmergency: false,
      postType: "weather_update",
      reactionCount: 24,
      commentCount: 8,
      hasImage: false,
    },
    {
      id: 3,
      content:
        "Hey neighbors! Just wanted to share that the local farmer's market will be open this Saturday from 8 AM to 2 PM. Fresh produce and local goods available. See you there!",
      user: { firstName: "Sarah", lastName: "Johnson" },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isEmergency: false,
      postType: "community",
      reactionCount: 8,
      commentCount: 3,
      hasImage: false,
    },
    {
      id: 4,
      content:
        "Power outage reported in the Oak Street area. Utility company estimates repair time of 2-3 hours. Please stay safe and avoid downed power lines.",
      user: { firstName: "Emergency", lastName: "Services" },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isEmergency: true,
      postType: "safety_alert",
      reactionCount: 15,
      commentCount: 7,
      hasImage: false,
    },
    {
      id: 5,
      content:
        "Beautiful sunset tonight! Hope everyone is staying warm. Don't forget to bring in any outdoor plants if temperatures drop below freezing.",
      user: { firstName: "Mike", lastName: "Chen" },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isEmergency: false,
      postType: "community",
      reactionCount: 21,
      commentCount: 4,
      hasImage: false,
    },
  ];

  useEffect(() => {
    loadHomeFeed();
    loadAlertCounts();
  }, []);

  const loadHomeFeed = async () => {
    try {
      if (!user?.neighborhoodId) {
        setPosts(mockPosts);
        setLoading(false);
        return;
      }

      const result = await apiService.getPosts(user.neighborhoodId);
      if (result.success) {
        setPosts(result.data.posts || mockPosts);
      } else {
        setPosts(mockPosts);
      }
    } catch (error) {
      console.error("Error loading home feed:", error);
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const loadAlertCounts = async () => {
    try {
      if (!user?.neighborhoodId) return;

      const result = await apiService.getAlerts(user.neighborhoodId);
      if (result.success) {
        const alerts = result.data.alerts || [];
        setAlertCounts({
          critical: alerts.filter((a) => a.severity === "CRITICAL").length,
          weather: alerts.filter((a) => a.source === "NOAA").length,
          community: alerts.filter((a) => a.source === "USER").length,
        });
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHomeFeed(), loadAlertCounts()]);
    setRefreshing(false);
  };

  const handlePostPress = (post) => {
    console.log("Post pressed:", post.id);
    if (onNavigateToPost) {
      onNavigateToPost(post.id);
    }
  };

  const handleLike = async (post) => {
    console.log("Like pressed:", post.id);
    try {
      await apiService.addReaction(post.id, "like");
      loadHomeFeed();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleTabPress = (tabId) => {
    console.log("Tab pressed (stays on home):", tabId);
  };

  return (
    <View style={styles.container}>
      <TopNav title="Home" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSpacing} />

        <GreetingHeader user={user} alertCounts={alertCounts} />

        <View style={styles.feed}>
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              onPress={handlePostPress}
              onLike={handleLike}
              onComment={handlePostPress}
              onShare={(post) => console.log("Share post:", post.id)}
              onMore={(post) => console.log("More options:", post.id)}
            />
          ))}
        </View>
      </ScrollView>

      <TabNavigation
        activeTab="home"
        onTabPress={handleTabPress}
        alertCounts={alertCounts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  topSpacing: {
    height: 16,
  },
  feed: {},
});

export default HomeOnlyTestScreen;
