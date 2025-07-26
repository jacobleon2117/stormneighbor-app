// File: frontend/src/components/common/PostCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import {
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  MapPin,
} from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";

const PostCard = ({
  post,
  index,
  onPress,
  onLike,
  onComment,
  onShare,
  onMore,
}) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPostTypeBadge = () => {
    if (
      post.isEmergency ||
      post.postType === "safety_alert" ||
      post.postType === "safety"
    ) {
      return (
        <View style={[styles.badge, styles.safetyBadge]}>
          <Text style={[styles.badgeText, styles.safetyBadgeText]}>
            Safety Alert
          </Text>
        </View>
      );
    }

    if (post.postType === "weather_update" || post.postType === "weather") {
      return (
        <View style={[styles.badge, styles.weatherBadge]}>
          <Text style={[styles.badgeText, styles.weatherBadgeText]}>
            Weather Alert
          </Text>
        </View>
      );
    }

    if (post.postType === "announcement") {
      return (
        <View style={[styles.badge, styles.announcementBadge]}>
          <Text style={[styles.badgeText, styles.announcementBadgeText]}>
            Announcement
          </Text>
        </View>
      );
    }

    if (post.postType === "event") {
      return (
        <View style={[styles.badge, styles.eventBadge]}>
          <Text style={[styles.badgeText, styles.eventBadgeText]}>Event</Text>
        </View>
      );
    }

    if (post.postType === "question") {
      return (
        <View style={[styles.badge, styles.questionBadge]}>
          <Text style={[styles.badgeText, styles.questionBadgeText]}>
            Question
          </Text>
        </View>
      );
    }

    if (post.postType === "help") {
      return (
        <View style={[styles.badge, styles.helpBadge]}>
          <Text style={[styles.badgeText, styles.helpBadgeText]}>
            Offer Help
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(post)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.authorSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.user?.firstName?.[0] || post.author?.[0] || "U"}
            </Text>
          </View>

          <View style={styles.authorInfo}>
            <View style={styles.authorNameAndBadge}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>
                  {post.user?.firstName && post.user?.lastName
                    ? `${post.user.firstName} ${post.user.lastName}`
                    : post.author || "Unknown User"}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
              </View>
              {getPostTypeBadge()}
            </View>

            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.text.muted} />
              <Text style={styles.postLocation}>
                {post.location || post.neighborhoodName || "Local Area"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
        <Text style={styles.postText}>{post.content}</Text>
      </View>

      {/* Only show image if user actually uploaded one */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike && onLike(post)}
        >
          <Heart size={18} color={colors.text.muted} />
          <Text style={styles.actionText}>{post.reactionCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment && onComment(post)}
        >
          <MessageSquare size={18} color={colors.text.muted} />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare && onShare(post)}
        >
          <Share size={18} color={colors.text.muted} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onMore && onMore(post)}
        >
          <MoreHorizontal size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  authorSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  authorInfo: {
    flex: 1,
  },

  authorNameAndBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  dot: {
    fontSize: 24,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },

  postTime: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  postLocation: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: spacing.xs,
    fontFamily: "Inter",
  },

  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter",
  },

  safetyBadge: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },

  safetyBadgeText: {
    color: colors.error,
  },

  weatherBadge: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },

  weatherBadgeText: {
    color: colors.warning,
  },

  announcementBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  announcementBadgeText: {
    color: colors.primary,
  },

  eventBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  eventBadgeText: {
    color: colors.primary,
  },

  questionBadge: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },

  questionBadgeText: {
    color: colors.success,
  },

  helpBadge: {
    backgroundColor: "#FED7AA",
    borderColor: "#F97316",
  },

  helpBadgeText: {
    color: "#F97316",
  },

  // Content styles
  content: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontFamily: "Inter",
  },

  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    fontFamily: "Inter",
  },

  // Image styles
  postImage: {
    height: 200,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
  },

  // Actions
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.xl,
    paddingVertical: spacing.xs,
  },

  actionText: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: spacing.xs,
    fontFamily: "Inter",
  },

  moreButton: {
    marginLeft: "auto",
    padding: spacing.xs,
  },
});

export default PostCard;
