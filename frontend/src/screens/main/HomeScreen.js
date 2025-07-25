// File: frontend/src/screens/main/HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import { useAuth } from "@contexts/AuthContext";
import ScreenLayout from "@components/layout/ScreenLayout";
import GreetingHeader from "@components/common/GreetingHeader";
import PostCard from "@components/common/PostCard";
import apiService from "@services/api";

const HomeScreen = ({ onNavigateToPost, onNavigateToProfile }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    weather: 0,
    community: 0,
    total: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.neighborhoodId) {
      loadInitialData();
    }
  }, [user?.neighborhoodId]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([loadHomeFeed(), loadAlertCounts()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.neighborhoodId]);

  const loadHomeFeed = async () => {
    if (!user?.neighborhoodId) {
      setPosts([]);
      return;
    }

    try {
      const result = await apiService.getPosts(user.neighborhoodId, {
        limit: 20,
        sortBy: "createdAt",
        order: "desc",
      });

      if (result.success) {
        setPosts(result.data.posts || []);
      } else {
        console.error("Failed to load posts:", result.error);
        setError(result.error || "Failed to load posts");
      }
    } catch (error) {
      console.error("Error loading home feed:", error);
      setError("Failed to load posts");
    }
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadHomeFeed(), loadAlertCounts()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handlePostPress = useCallback(
    (post) => {
      if (onNavigateToPost) {
        onNavigateToPost(post.id);
      }
    },
    [onNavigateToPost]
  );

  const handleLike = useCallback(async (post) => {
    try {
      const result = await apiService.addReaction(post.id, "like");
      if (result.success) {
        // Update the post in the local state
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === post.id
              ? { ...p, reactionCount: (p.reactionCount || 0) + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }, []);

  const handleComment = useCallback(
    (post) => {
      if (onNavigateToPost) {
        onNavigateToPost(post.id);
      }
    },
    [onNavigateToPost]
  );

  const handleShare = useCallback((post) => {
    // TODO: Implement share functionality
    console.log("Share post:", post.id);
  }, []);

  const handleMore = useCallback((post) => {
    // TODO: Implement more options
    console.log("More options for post:", post.id);
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Loading your feed...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyTitle}>Something went wrong</Text>
          <Text style={globalStyles.emptyText}>{error}</Text>
        </View>
      );
    }

    if (!user?.neighborhoodId) {
      return (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyTitle}>Welcome to StormNeighbor!</Text>
          <Text style={globalStyles.emptyText}>
            Complete your profile setup to connect with your neighborhood.
          </Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyTitle}>No posts yet</Text>
          <Text style={globalStyles.emptyText}>
            Be the first to share something with your neighborhood!
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={{ marginTop: spacing.lg }}>
          <GreetingHeader user={user} alertCounts={alertCounts} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              onPress={handlePostPress}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onMore={handleMore}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <ScreenLayout title="Home" refreshing={refreshing} onRefresh={onRefresh}>
      {renderContent()}
    </ScreenLayout>
  );
};

export default HomeScreen;
