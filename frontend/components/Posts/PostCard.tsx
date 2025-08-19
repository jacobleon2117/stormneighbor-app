import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "../../types";
import { Colors } from "../../constants/Colors";

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onPress?: (postId: number) => void;
}

const { width: screenWidth } = Dimensions.get("window");

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onPress,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "help_request":
        return "help-circle-outline";
      case "help_offer":
        return "heart-outline";
      case "safety_alert":
        return "warning-outline";
      case "lost_found":
        return "search-outline";
      default:
        return "chatbubble-outline";
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "help_request":
        return Colors.warning[600];
      case "help_offer":
        return Colors.success[600];
      case "safety_alert":
        return Colors.error[600];
      case "lost_found":
        return Colors.primary[600];
      default:
        return Colors.neutral[600];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return Colors.error[600];
      case "high":
        return Colors.warning[600];
      case "normal":
        return Colors.primary[600];
      case "low":
        return Colors.neutral[500];
      default:
        return Colors.neutral[500];
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return postDate.toLocaleDateString();
  };

  const formatPostType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(post.id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.profileImageUrl && !imageError ? (
              <Image
                source={{ uri: post.profileImageUrl }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name="person" size={20} color={Colors.neutral[600]} />
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {post.firstName} {post.lastName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>
                {formatTimeAgo(post.createdAt)}
              </Text>
              {post.locationCity && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={Colors.neutral[500]}
                  />
                  <Text style={styles.location}>
                    {post.locationCity}, {post.locationState}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.badges}>
          {post.isEmergency && (
            <View style={[styles.badge, styles.emergencyBadge]}>
              <Ionicons name="warning" size={12} color={Colors.error[700]} />
              <Text style={styles.emergencyText}>EMERGENCY</Text>
            </View>
          )}

          <View
            style={[
              styles.badge,
              { borderColor: getPostTypeColor(post.postType) },
            ]}
          >
            <Ionicons
              name={getPostTypeIcon(post.postType) as any}
              size={12}
              color={getPostTypeColor(post.postType)}
            />
            <Text
              style={[
                styles.badgeText,
                { color: getPostTypeColor(post.postType) },
              ]}
            >
              {formatPostType(post.postType)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {post.title && (
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
        )}
        <Text style={styles.postContent} numberOfLines={4}>
          {post.content}
        </Text>
      </View>

      {post.images && post.images.length > 0 && (
        <View style={styles.imagesContainer}>
          <Image
            source={{ uri: post.images[0] }}
            style={styles.postImage}
            resizeMode="cover"
          />
          {post.images.length > 1 && (
            <View style={styles.imageOverlay}>
              <Text style={styles.imageCount}>+{post.images.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text style={styles.moreTags}>+{post.tags.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike?.(post.id)}
        >
          <Ionicons
            name={post.userReaction ? "heart" : "heart-outline"}
            size={20}
            color={post.userReaction ? Colors.error[600] : Colors.neutral[600]}
          />
          <Text
            style={[styles.actionText, post.userReaction && styles.likedText]}
          >
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(post.id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={Colors.neutral[600]}
          />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare?.(post.id)}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={Colors.neutral[600]}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <View style={styles.priorityContainer}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(post.priority) },
            ]}
          />
          <Text
            style={[
              styles.priorityText,
              { color: getPriorityColor(post.priority) },
            ]}
          >
            {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  dot: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginHorizontal: 6,
  },
  location: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 2,
  },
  badges: {
    alignItems: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  emergencyBadge: {
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[600],
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.error[700],
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  imagesContainer: {
    position: "relative",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCount: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    alignItems: "center",
  },
  tag: {
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary[700],
    fontWeight: "500",
  },
  moreTags: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  likedText: {
    color: Colors.error[600],
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
