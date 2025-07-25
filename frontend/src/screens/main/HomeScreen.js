// File: frontend/src/screens/main/HomeScreen.js
import { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import TopNav from "@components/layout/TopNav";
import GreetingHeader from "@components/common/GreetingHeader";
import PostCard from "@components/common/PostCard";
import apiService from "@services/api";

const HomeScreen = ({ user, onNavigateToPost, onNavigateToProfile }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
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
    if (onNavigateToPost) {
      onNavigateToPost(post.id);
    }
  };

  const handleLike = async (post) => {
    try {
      await apiService.addReaction(post.id, "like");
      loadHomeFeed();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TopNav title="Home" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
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

export default HomeScreen;
