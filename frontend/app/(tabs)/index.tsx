import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { PostCard } from "../../components/Posts/PostCard";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { Post } from "../../types";
import { Colors } from "../../constants/Colors";

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { user } = useAuth();

  const fetchPosts = async (
    pageNum: number = 1,
    isRefresh: boolean = false
  ) => {
    try {
      if (pageNum === 1) {
        setError(null);
      }

      const response = await apiService.getPosts({
        page: pageNum,
        limit: 20,
      });

      if (response.success && response.data) {
        const newPosts = response.data.posts || response.data;

        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        if (newPosts.length < 20) {
          setHasMore(false);
        }

        setPage(pageNum);
      } else {
        throw new Error(response.message || "Failed to load posts");
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load posts";

      if (pageNum === 1) {
        setError(errorMessage);
      } else {
        Alert.alert("Error", "Failed to load more posts");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchPosts(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && posts.length > 0) {
      setLoadingMore(true);
      fetchPosts(page + 1, false);
    }
  }, [loadingMore, hasMore, page, posts.length]);

  const handleLike = async (postId: number) => {
    try {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                userReaction: post.userReaction ? null : "like",
                likeCount: post.userReaction
                  ? (post.likeCount || 1) - 1
                  : (post.likeCount || 0) + 1,
              }
            : post
        )
      );

      const currentPost = posts.find((p) => p.id === postId);

      if (currentPost?.userReaction) {
        await apiService.getApi().delete(`/posts/${postId}/reactions`);
      } else {
        await apiService.getApi().post(`/posts/${postId}/reactions`, {
          reactionType: "like",
        });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                userReaction: post.userReaction ? null : "like",
                likeCount: post.userReaction
                  ? (post.likeCount || 1) - 1
                  : (post.likeCount || 0) + 1,
              }
            : post
        )
      );

      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
  };

  const handleComment = (postId: number) => {
    // TODO: Navigate to post detail screen with comments
    Alert.alert("Comments", `View comments for post ${postId}`, [
      { text: "OK" },
    ]);
  };

  const handleShare = (postId: number) => {
    // TODO: Implement sharing functionality
    Alert.alert("Share", `Share post ${postId}`, [{ text: "OK" }]);
  };

  const handlePostPress = (postId: number) => {
    // TODO: Navigate to post detail screen
    Alert.alert("Post Detail", `View post ${postId}`, [{ text: "OK" }]);
  };

  useEffect(() => {
    if (user) {
      fetchPosts(1);
    } else {
      setLoading(false);
    }
  }, [user]);

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPress={handlePostPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Home</Text>
      {user && (
        <Text style={styles.subtitle}>Welcome back, {user.firstName}!</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyMessage}>
        Be the first to share something with your community!
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load posts</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[600]]}
            tintColor={Colors.primary[600]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});
