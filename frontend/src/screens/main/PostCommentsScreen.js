// File: frontend/src/screens/main/PostCommentsScreen.js
import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  ArrowLeft,
  Send,
  Heart,
  MoreHorizontal,
  User,
  MessageSquare,
  MapPin,
} from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  borderRadius,
  shadows,
} from "@styles/designSystem";
import apiService from "@services/api";

const PostCommentsScreen = ({
  post,
  user,
  onClose,
  onLike,
  onUpdateCommentCount,
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiService.getComments(post.id);

      if (result.success) {
        setComments(result.data.comments || []);
      } else {
        setError(result.error || "Failed to load comments");
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";

    try {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown";
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        parentCommentId: replyingTo?.id || null,
      };

      const result = await apiService.createComment(post.id, commentData);

      if (result.success) {
        const newCommentObj = {
          id: result.data.comment.id,
          content: newComment.trim(),
          parentCommentId: replyingTo?.id || null,
          createdAt: result.data.comment.createdAt,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          },
        };

        setComments((prev) => {
          const updatedComments = [...prev, newCommentObj];

          if (onUpdateCommentCount) {
            onUpdateCommentCount(post.id, updatedComments.length);
          }

          return updatedComments;
        });

        setNewComment("");
        setReplyingTo(null);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert("Error", result.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    textInputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const organizeComments = (comments) => {
    if (!Array.isArray(comments)) return [];

    const topLevelComments = [];
    const repliesMap = {};

    comments.forEach((comment) => {
      if (!comment || !comment.id) return;
      if (comment.parentCommentId) {
        if (!repliesMap[comment.parentCommentId]) {
          repliesMap[comment.parentCommentId] = [];
        }
        repliesMap[comment.parentCommentId].push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    const organizedComments = [];
    topLevelComments.forEach((comment) => {
      organizedComments.push(comment);

      if (repliesMap[comment.id]) {
        repliesMap[comment.id].forEach((reply) => {
          organizedComments.push(reply);
        });
      }
    });

    return organizedComments;
  };

  const organizedComments = useMemo(
    () => organizeComments(comments),
    [comments]
  );

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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <ArrowLeft size={24} color={colors.text.primary} />
      </TouchableOpacity>

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
  );

  const renderPostContent = () => (
    <View style={styles.postContent}>
      <Text style={styles.postText}>{post.content}</Text>
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
    </View>
  );

  const renderComment = ({ item: comment }) => {
    if (!comment || !comment.id) return null;

    const isAuthor = comment.user?.id === post.user?.id;
    const isReply = !!comment.parentCommentId;

    return (
      <View>
        <View
          style={[styles.commentContainer, isReply && styles.replyContainer]}
        >
          <View style={styles.commentAvatar}>
            {comment.user?.profileImageUrl ? (
              <Image
                source={{ uri: comment.user.profileImageUrl }}
                style={styles.commentAvatarImage}
              />
            ) : (
              <User size={20} color={colors.text.muted} />
            )}
          </View>

          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentUserName}>
                {comment.user?.firstName || "Unknown"}{" "}
                {comment.user?.lastName || ""}
              </Text>
              {isAuthor && (
                <View style={styles.authorBadge}>
                  <Text style={styles.authorBadgeText}>Author</Text>
                </View>
              )}
            </View>

            <Text style={styles.commentText}>{comment.content}</Text>

            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.commentAction}>
                <Heart size={16} color={colors.text.muted} />
                <Text style={styles.commentActionText}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleReply(comment)}
              >
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>

              <Text style={styles.commentTime}>
                {formatTimeAgo(comment.createdAt)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.commentMore}>
            <MoreHorizontal size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MessageSquare size={48} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptyText}>
        Be the first to share your thoughts on this post
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading comments...</Text>
    </View>
  );

  const renderCommentInput = () => (
    <View style={styles.inputContainer}>
      {replyingTo && (
        <View style={styles.replyingContainer}>
          <Text style={styles.replyingText}>
            Replying to {replyingTo.user?.firstName || "Unknown"}
          </Text>
          <TouchableOpacity onPress={handleCancelReply}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <View style={styles.inputAvatar}>
          {user?.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.inputAvatarImage}
            />
          ) : (
            <User size={16} color={colors.text.muted} />
          )}
        </View>

        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text.muted}
          maxLength={500}
          editable={!submitting}
          returnKeyType="send"
          onSubmitEditing={handleSubmitComment}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || submitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Send size={16} color={colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {renderHeader()}
        {renderPostContent()}

        <View style={styles.commentsSection}>
          {loading ? (
            renderLoadingState()
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Failed to load comments</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : comments.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={organizedComments}
              renderItem={renderComment}
              keyExtractor={(item) =>
                item?.id?.toString() || Math.random().toString()
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {renderCommentInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  keyboardView: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },

  backButton: {
    ...globalStyles.center,
    padding: spacing.xs,
    marginRight: spacing.md,
  },

  userSection: {
    ...globalStyles.row,
    alignItems: "flex-start",
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    ...globalStyles.center,
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
    ...globalStyles.row,
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
    ...globalStyles.row,
    alignItems: "center",
  },

  locationText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
    marginLeft: spacing.xs,
  },

  badge: {
    ...globalStyles.badge,
  },

  badgeText: {
    ...globalStyles.badgeText,
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

  postContent: {
    backgroundColor: colors.surface,
    ...globalStyles.contentPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  postText: {
    ...globalStyles.body,
    fontSize: 15,
    lineHeight: 22,
  },

  postImage: {
    height: 200,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.borderLight,
  },

  commentsSection: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  commentContainer: {
    ...globalStyles.row,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: "flex-start",
  },

  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    ...globalStyles.center,
    marginRight: spacing.md,
    overflow: "hidden",
  },

  commentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  commentContent: {
    flex: 1,
  },

  commentHeader: {
    ...globalStyles.row,
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  commentUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
    marginRight: spacing.sm,
  },

  authorBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },

  authorBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.primary,
    fontFamily: "Inter",
  },

  commentText: {
    ...globalStyles.body,
    marginBottom: spacing.sm,
  },

  commentActions: {
    ...globalStyles.row,
    alignItems: "center",
    gap: spacing.lg,
  },

  commentAction: {
    ...globalStyles.row,
    alignItems: "center",
    gap: spacing.xs,
  },

  commentActionText: {
    ...globalStyles.caption,
    fontWeight: "500",
  },

  commentTime: {
    ...globalStyles.caption,
    marginLeft: "auto",
  },

  replyContainer: {
    marginLeft: spacing.xxxxl,
    backgroundColor: colors.borderLight,
  },

  commentMore: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },

  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...globalStyles.contentPadding,
    paddingVertical: spacing.md,
  },

  replyingContainer: {
    ...globalStyles.row,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },

  replyingText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: "Inter",
    fontWeight: "500",
  },

  cancelText: {
    fontSize: 14,
    color: colors.error,
    fontFamily: "Inter",
    fontWeight: "500",
  },

  inputRow: {
    ...globalStyles.row,
    alignItems: "center",
    gap: spacing.md,
  },

  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    ...globalStyles.center,
    overflow: "hidden",
  },

  inputAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  textInput: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: "Inter",
    height: 36,
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    ...globalStyles.center,
  },

  sendButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },

  emptyContainer: {
    ...globalStyles.emptyContainer,
  },

  emptyTitle: {
    ...globalStyles.emptyTitle,
  },

  emptyText: {
    ...globalStyles.emptyText,
  },

  loadingContainer: {
    ...globalStyles.loadingContainer,
  },

  loadingText: {
    ...globalStyles.loadingText,
  },
};

export default PostCommentsScreen;
