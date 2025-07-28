// File: frontend/src/screens/main/HomeScreen.js
import { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import { useAuth } from "@contexts/AuthContext";
import ScreenLayout from "@components/layout/ScreenLayout";
import GreetingHeader from "@components/common/GreetingHeader";
import PostCard from "@components/common/PostCard";
import apiService from "@services/api";

const HomeScreen = ({
  onNavigateToPost,
  onNavigateToComments,
  onNavigateToProfile,
}) => {
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

  const getUserCity = () => {
    return user?.location?.city || user?.location_city || null;
  };

  const getUserState = () => {
    return user?.location?.state || user?.address_state || null;
  };

  const getUserCoordinates = () => {
    if (user?.location?.coordinates) {
      return user.location.coordinates;
    }
    if (user?.latitude && user?.longitude) {
      return {
        latitude: user.latitude,
        longitude: user.longitude,
      };
    }
    return null;
  };

  const hasUserLocation = () => {
    const city = getUserCity();
    const state = getUserState();
    return !!(city && state);
  };

  useEffect(() => {
    console.log("HomeScreen user data:", {
      hasLocation: hasUserLocation(),
      city: getUserCity(),
      state: getUserState(),
      coordinates: getUserCoordinates(),
      full_user: user,
    });

    if (hasUserLocation()) {
      loadInitialData();
    }
  }, [user]);

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
  }, [user]);

  const loadHomeFeed = async () => {
    if (!hasUserLocation()) {
      setPosts([]);
      return;
    }

    try {
      console.log(
        "Loading home feed for user with location:",
        `${getUserCity()}, ${getUserState()}`
      );

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

        const mappedPosts =
          result.data.posts?.map((post) => ({
            ...post,
            likeCount: post.likeCount || 0,
            reactionCount: post.totalReactions || 0,
            userHasLiked: post.userHasLiked || false,
          })) || [];

        console.log(
          "Mapped posts with like counts:",
          mappedPosts.map((p) => ({
            id: p.id,
            likeCount: p.likeCount,
            reactionCount: p.reactionCount,
            userHasLiked: p.userHasLiked,
          }))
        );

        setPosts(mappedPosts);
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
    const coordinates = getUserCoordinates();
    if (!coordinates) {
      return;
    }

    try {
      const result = await apiService.getAlerts(null, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius:
          user?.location?.radiusMiles || user?.location_radius_miles || 25,
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
      console.log("Navigate to post:", post.id);
      if (onNavigateToPost) {
        onNavigateToPost(post.id);
      }
    },
    [onNavigateToPost]
  );

  const handleLike = useCallback(async (post) => {
    try {
      console.log("Liking post:", post.id, "Current state:", {
        likeCount: post.likeCount,
        userHasLiked: post.userHasLiked,
      });

      const result = await apiService.addReaction(post.id, "like");

      if (result.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === post.id) {
              const wasLiked = p.userHasLiked;
              const isNowLiked =
                result.data.action === "added" ||
                result.data.action === "updated";

              let newLikeCount = p.likeCount || 0;
              if (result.data.action === "added") {
                newLikeCount = newLikeCount + 1;
              } else if (result.data.action === "removed") {
                newLikeCount = Math.max(newLikeCount - 1, 0);
              }

              const updatedPost = {
                ...p,
                userHasLiked: isNowLiked,
                likeCount: newLikeCount,
                reactionCount: newLikeCount,
              };

              console.log("Updated post state:", {
                id: updatedPost.id,
                action: result.data.action,
                likeCount: updatedPost.likeCount,
                userHasLiked: updatedPost.userHasLiked,
              });

              return updatedPost;
            }
            return p;
          })
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
      if (onNavigateToComments) {
        onNavigateToComments(post);
      }
    },
    [onNavigateToComments]
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

    if (!hasUserLocation()) {
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
