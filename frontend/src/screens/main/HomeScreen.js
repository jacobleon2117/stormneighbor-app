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
    console.log("HomeScreen user data:", {
      location_city: user?.location?.city,
      address_city: user?.address?.city,
      full_user: user,
    });

    if (user?.location?.city || user?.address?.city) {
      loadInitialData();
    }
  }, [user?.location?.city, user?.address?.city]);

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
  }, [user?.locationCity, user?.address?.city]);

  const loadHomeFeed = async () => {
    // Check for location data instead of neighborhoodId
    if (!user?.location?.city && !user?.address?.city) {
      setPosts([]);
      return;
    }

    try {
      console.log(
        "Loading home feed for user with location:",
        user?.location?.city || user?.address?.city
      );

      // Call getPosts without neighborhoodId parameter since it's location-based now
      const result = await apiService.getPosts(null, {
        limit: 20,
        sortBy: "createdAt",
        order: "desc",
      });

      if (result.success) {
        console.log(
          "Posts loaded successfully:",
          result.data.posts?.length || 0
        );
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
    // Use user coordinates for alerts instead of neighborhoodId
    if (!user?.location?.latitude || !user?.location?.longitude) {
      return;
    }

    try {
      const result = await apiService.getAlerts(null, {
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        radius: user.radiusMiles || 25,
      });

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
        // Update based on the action returned from backend
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  userHasLiked:
                    result.data.action === "added" ||
                    result.data.action === "updated",
                  reactionCount:
                    result.data.action === "added"
                      ? (p.reactionCount || 0) + 1
                      : result.data.action === "removed"
                      ? Math.max((p.reactionCount || 0) - 1, 0)
                      : p.reactionCount,
                }
              : p
          )
        );
        console.log(`Like ${result.data.action} for post ${post.id}`);
      } else {
        console.error("Failed to update reaction:", result.error);
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

    // Check for location data instead of neighborhoodId
    if (!user?.location?.city && !user?.address?.city) {
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
      <View style={{ flex: 1 }}>
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
    );
  };

  // Custom header component that includes the greeting
  const customHeaderComponent = (
    <View>
      <GreetingHeader user={user} alertCounts={alertCounts} />
    </View>
  );

  return (
    <ScreenLayout
      title="Home"
      refreshing={refreshing}
      onRefresh={onRefresh}
      customHeaderComponent={customHeaderComponent}
    >
      {renderContent()}
    </ScreenLayout>
  );
};

export default HomeScreen;
