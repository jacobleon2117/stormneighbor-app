// File: frontend/src/components/common/PostCard.js
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import {
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  MapPin,
} from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  borderRadius,
  shadows,
} from "@styles/designSystem";

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
    let badgeText = "";
    let badgeStyle = styles.generalBadge;
    let textStyle = styles.generalBadgeText;

    if (post.isEmergency || post.postType === "safety_alert") {
      badgeText = "Safety Alert";
      badgeStyle = styles.safetyBadge;
      textStyle = styles.safetyBadgeText;
    } else if (post.postType === "help_offer") {
      badgeText = "Offer Help";
      badgeStyle = styles.helpBadge;
      textStyle = styles.helpBadgeText;
    } else if (post.postType === "general") {
      if (post.title?.toLowerCase().includes("announcement")) {
        badgeText = "Announcement";
        badgeStyle = styles.announcementBadge;
        textStyle = styles.announcementBadgeText;
      } else if (post.title?.toLowerCase().includes("event")) {
        badgeText = "Event";
        badgeStyle = styles.eventBadge;
        textStyle = styles.eventBadgeText;
      } else if (post.title?.toLowerCase().includes("question")) {
        badgeText = "Question";
        badgeStyle = styles.questionBadge;
        textStyle = styles.questionBadgeText;
      } else if (post.title?.toLowerCase().includes("weather")) {
        badgeText = "Weather Alert";
        badgeStyle = styles.weatherBadge;
        textStyle = styles.weatherBadgeText;
      } else {
        return null;
      }
    }

    if (!badgeText) return null;

    return (
      <View style={[styles.badge, badgeStyle]}>
        <Text style={[styles.badgeText, textStyle]}>{badgeText}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(post)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            {post.user?.profileImageUrl ? (
              <Image
                source={{ uri: post.user.profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {post.user?.firstName?.[0] || "U"}
              </Text>
            )}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameAndTime}>
              <Text style={styles.userName}>
                {post.user?.firstName && post.user?.lastName
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : "Unknown User"}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.timestamp}>
                {formatTimeAgo(post.createdAt)}
              </Text>
            </View>

            <View style={styles.locationContainer}>
              <MapPin size={12} color={colors.text.muted} />
              <Text style={styles.locationText}>
                {post.location || "Local Area"}
              </Text>
            </View>
          </View>
        </View>
        {getPostTypeBadge()}
      </View>

      <View style={styles.content}>
        <Text style={styles.postText}>{post.content}</Text>
      </View>

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
          <Heart
            size={20}
            color={post.userHasLiked ? colors.error : colors.text.muted}
            fill={post.userHasLiked ? colors.error : "none"}
          />
          <Text style={styles.actionText}>{post.likeCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment && onComment(post)}
        >
          <MessageSquare size={20} color={colors.text.muted} />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare && onShare(post)}
        >
          <Share size={20} color={colors.text.muted} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onMore && onMore(post)}
        >
          <MoreHorizontal size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },

  userSection: {
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
    overflow: "hidden",
  },

  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  userInfo: {
    flex: 1,
  },

  nameAndTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  dot: {
    fontSize: 16,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },

  timestamp: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
    marginLeft: spacing.xs,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  postImage: {
    height: 200,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    marginLeft: spacing.sm,
    fontFamily: "Inter",
  },

  moreButton: {
    marginLeft: "auto",
    padding: spacing.xs,
  },

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
    borderColor: colors.text.link,
  },

  announcementBadgeText: {
    color: colors.text.link,
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

  generalBadge: {
    backgroundColor: colors.borderLight,
    borderColor: colors.text.muted,
  },

  generalBadgeText: {
    color: colors.text.muted,
  },
});

export default PostCard;
