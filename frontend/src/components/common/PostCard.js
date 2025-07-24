// File: frontend/src/components/PostCard.js
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  MapPin,
} from "lucide-react-native";

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
    if (diffInMinutes < 60) return `${diffInMinutes}mins`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)} d`;
  };

  const getPostTypeBadge = () => {
    if (post.isEmergency || post.postType === "safety_alert") {
      return (
        <View style={styles.safetyAlertBadge}>
          <Text style={styles.safetyAlertText}>Safety Alert</Text>
        </View>
      );
    }
    if (post.postType === "weather_update") {
      return (
        <View style={styles.weatherAlertBadge}>
          <Text style={styles.weatherAlertText}>Weather Alert</Text>
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
              {post.user?.firstName?.[0] || "U"}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameAndBadge}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>
                  {post.user?.firstName} {post.user?.lastName}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
              </View>
              {getPostTypeBadge()}
            </View>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.postLocation}>Downtown Area</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
        <Text style={styles.postText}>{post.content}</Text>
      </View>

      {index === 0 && <View style={styles.placeholderImage} />}

      {post.hasImage && <View style={styles.imagePlaceholder} />}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike && onLike(post)}
        >
          <Heart size={18} color="#6B7280" />
          <Text style={styles.actionText}>{post.reactionCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment && onComment(post)}
        >
          <MessageSquare size={18} color="#6B7280" />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare && onShare(post)}
        >
          <Share size={18} color="#6B7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onMore && onMore(post)}
        >
          <MoreHorizontal size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dot: {
    fontSize: 24,
    color: "#6B7280",
    marginHorizontal: 6,
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
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 2,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  authorNameAndBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  safetyAlertBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    width: 110,
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  safetyAlertText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },
  weatherAlertBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    width: 110,
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: "#FEF3C7",
  },
  weatherAlertText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#F59E0B",
  },
  postTime: {
    fontSize: 14,
    color: "#6B7280",
  },
  postLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
  placeholderImage: {
    height: 180,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCC",
  },
  imagePlaceholder: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  saveButton: {
    marginLeft: "auto",
    padding: 4,
  },
});

export default PostCard;
