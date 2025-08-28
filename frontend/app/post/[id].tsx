import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, router } from "expo-router";
import { PostCard } from "../../components/Posts/PostCard";
import { CommentsSection } from "../../components/Comments/CommentsSection";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { Post } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { URL_CONFIG } from "../../constants/config";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = parseInt(id || "0", 10);

  useEffect(() => {
    if (postId) {
      fetchPost();
    } else {
      setError("Invalid post ID");
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (error && !loading) {
      Alert.alert("Error", error || "Post not found", [
        {
          text: "Go Back",
          onPress: () => router.back(),
        },
      ]);
    }
  }, [error, loading]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getPost(postId);

      if (response.success && response.data) {
        setPost(response.data);
      } else {
        setError("Post not found");
      }
    } catch (error: any) {
      console.error("Error fetching post:", error);
      setError(error.response?.data?.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!post) return;

    try {
      setPost((prevPost) => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          userReaction: prevPost.userReaction ? null : "like",
          likeCount: prevPost.userReaction
            ? (prevPost.likeCount || 1) - 1
            : (prevPost.likeCount || 0) + 1,
        };
      });

      if (post.userReaction) {
        await apiService.getApi().delete(`/posts/${postId}/reactions`);
      } else {
        await apiService.getApi().post(`/posts/${postId}/reactions`, {
          reactionType: "like",
        });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);

      setPost((prevPost) => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          userReaction: prevPost.userReaction ? null : "like",
          likeCount: prevPost.userReaction
            ? (prevPost.likeCount || 1) - 1
            : (prevPost.likeCount || 0) + 1,
        };
      });

      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
  };

  const handleShare = (postId: number) => {
    const shareUrl = `${URL_CONFIG.baseUrl}/post/${postId}`;
    const shareMessage = `Check out this post on StormNeighbor: ${shareUrl}`;

    Alert.alert("Share Post", "How would you like to share this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Link",
        onPress: async () => {
          try {
            await Clipboard.setStringAsync(shareUrl);
            Alert.alert("Success", "Link copied to clipboard!");
          } catch (error) {
            Alert.alert("Error", "Failed to copy link");
          }
        },
      },
      {
        text: "More Options",
        onPress: async () => {
          try {
            await Share.share({
              message: shareMessage,
              url: shareUrl,
            });
          } catch (error) {
            console.error("Error sharing:", error);
          }
        },
      },
    ]);
  };

  const handleCommentCountChange = (count: number) => {
    setPost((prevPost) => {
      if (!prevPost) return null;
      return {
        ...prevPost,
        commentCount: count,
      };
    });
  };

  const handleMessage = async (userId: number, userName: string) => {
    try {
      const conversationsResponse = await apiService.getConversations();
      if (conversationsResponse.success && conversationsResponse.data) {
        const existingConversation = conversationsResponse.data.conversations.find(
          (conv: any) => conv.otherUser.id === userId
        );
        
        if (existingConversation) {
          router.push({
            pathname: "/conversation/[id]" as any,
            params: {
              id: existingConversation.id,
              userName: userName,
              userImage: existingConversation.otherUser.profileImageUrl || "",
            },
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error checking conversations:", error);
    }

    Alert.alert(
      "Start Conversation",
      `Send a message to ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Message",
          onPress: () => {
            router.push({
              pathname: "/conversation/new" as any,
              params: {
                recipientId: userId,
                recipientName: userName,
              },
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView
          style={styles.postContainer}
          showsVerticalScrollIndicator={false}
        >
          <PostCard
            post={post}
            onLike={handleLike}
            onShare={handleShare}
            onPress={() => {}}
            onMessage={handleMessage}
            currentUserId={user?.id}
          />
        </ScrollView>

        <View style={styles.commentsContainer}>
          <CommentsSection
            postId={postId}
            onCommentCountChange={handleCommentCountChange}
          />
        </View>
      </View>
    </SafeAreaView>
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
  postContainer: {
    maxHeight: "40%",
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
