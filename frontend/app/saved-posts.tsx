import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Bookmark, BookmarkX, ArrowLeft } from "lucide-react-native";
import { Header } from "../components/UI/Header";
import { PostCard } from "../components/Posts/PostCard";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Post } from "../types";

export default function SavedPostsScreen() {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPosts = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await apiService.getSavedPosts();

      if (response.success && response.data?.posts) {
        setSavedPosts(response.data.posts);
      } else {
        setError("Failed to load saved posts");
      }
    } catch (error: any) {
      console.error("Error fetching saved posts:", error);
      setError("Failed to load saved posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user, fetchSavedPosts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedPosts(true);
  }, [fetchSavedPosts]);

  const handleUnsavePost = async (postId: number) => {
    Alert.alert(
      "Remove from Saved",
      "Are you sure you want to remove this post from your saved posts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setSavedPosts((prev) => prev.filter((post) => post.id !== postId));
            Alert.alert("Removed", "Post has been removed from your saved posts.");
          },
        },
      ]
    );
  };

  const handleLike = async (postId: number) => {
    try {
      await apiService.togglePostReaction(postId);
      setSavedPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                userReaction: post.userReaction ? null : "like",
                likesCount: post.userReaction ? post.likesCount - 1 : post.likesCount + 1,
              }
            : post
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
  };

  const handleComment = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = async (postId: number) => {
    Alert.alert("Share", "Sharing functionality will be implemented soon.");
  };

  const handlePostPress = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPress={handlePostPress}
      onSave={() => handleUnsavePost(item.id)}
      currentUserId={user?.id}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bookmark size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>No saved posts yet</Text>
      <Text style={styles.emptyMessage}>
        Posts you save will appear here. Tap the bookmark icon on any post to save it for later.
      </Text>
    </View>
  );

  const handleGoBack = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Saved Posts" showBackButton={true} onBackPress={handleGoBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading saved posts...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Saved Posts" showBackButton={true} onBackPress={handleGoBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load saved posts</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSavedPosts()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Saved Posts" showBackButton={true} onBackPress={handleGoBack} />

      <View style={styles.content}>
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          contentContainerStyle={[
            styles.listContainer,
            savedPosts.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
              tintColor={Colors.primary[500]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
