import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
} from "react-native";
import { 
  HelpCircle, 
  Heart, 
  AlertTriangle, 
  Search, 
  MessageCircle, 
  User, 
  MapPin, 
  Share,
  MoreHorizontal,
  Flag,
  EyeOff,
  UserX,
  UserMinus,
  Info,
  X
} from "lucide-react-native";
import { Post } from "../../types";
import { Colors } from "../../constants/Colors";

const { height: screenHeight } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onPress?: (postId: number) => void;
  onMessage?: (userId: number, userName: string) => void;
  onReport?: (postId: number) => void;
  onBlock?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onHide?: (postId: number) => void;
  currentUserId?: number;
  isFollowing?: boolean;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onPress,
  onMessage,
  onReport,
  onBlock,
  onUnfollow,
  onHide,
  currentUserId,
  isFollowing = false,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Animation values for swipe to dismiss
  const commentModalY = React.useRef(new Animated.Value(0)).current;
  const moreModalY = React.useRef(new Animated.Value(0)).current;

  // Create pan responder for comment modal
  const commentPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        commentModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        // Close modal if dragged down more than 100px
        Animated.timing(commentModalY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowCommentModal(false);
          commentModalY.setValue(0);
        });
      } else {
        // Spring back to original position
        Animated.spring(commentModalY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Create pan responder for more modal
  const morePanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        moreModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        // Close modal if dragged down more than 100px
        Animated.timing(moreModalY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowMoreModal(false);
          moreModalY.setValue(0);
        });
      } else {
        // Spring back to original position
        Animated.spring(moreModalY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "help_request":
        return HelpCircle;
      case "help_offer":
        return Heart;
      case "safety_alert":
        return AlertTriangle;
      case "lost_found":
        return Search;
      default:
        return MessageCircle;
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
              <User size={20} color={Colors.neutral[600]} />
            )}
          </View>

          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>
                {post.firstName} {post.lastName}
              </Text>
              {onMessage && currentUserId && post.userId !== currentUserId && (
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => onMessage(post.userId, `${post.firstName} ${post.lastName}`)}
                >
                  <MessageCircle
                    size={16}
                    color={Colors.primary[600]}
                  />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>
                {formatTimeAgo(post.createdAt)}
              </Text>
              {post.locationCity && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <MapPin
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
              <AlertTriangle size={12} color={Colors.error[700]} />
              <Text style={styles.emergencyText}>EMERGENCY</Text>
            </View>
          )}
          {/* Only show alert type badge if it's from create post screen alert options */}
          {(post.postType === "safety_alert" || post.postType === "help_request" || post.postType === "help_offer") && (
            <View
              style={[
                styles.badge,
                { borderColor: getPostTypeColor(post.postType) },
              ]}
            >
              {React.createElement(getPostTypeIcon(post.postType), {
                size: 12,
                color: getPostTypeColor(post.postType)
              })}
              <Text
                style={[
                  styles.badgeText,
                  { color: getPostTypeColor(post.postType) },
                ]}
              >
                {formatPostType(post.postType)}
              </Text>
            </View>
          )}
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


      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike?.(post.id)}
          >
            <Heart
              size={20}
              color={post.userReaction ? Colors.error[600] : Colors.neutral[600]}
              fill={post.userReaction ? Colors.error[600] : "none"}
            />
            <Text
              style={[styles.actionText, post.userReaction && styles.likedText]}
            >
              {post.likeCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCommentModal(true)}
          >
            <MessageCircle
              size={20}
              color={Colors.neutral[600]}
            />
            <Text style={styles.actionText}>{post.commentCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare?.(post.id)}
          >
            <Share
              size={20}
              color={Colors.neutral[600]}
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowMoreModal(true)}
        >
          <MoreHorizontal
            size={20}
            color={Colors.neutral[600]}
          />
        </TouchableOpacity>
      </View>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlayTransparent}>
          <Animated.View 
            style={[
              styles.modalContainer, 
              { height: screenHeight * 0.6 },
              { transform: [{ translateY: commentModalY }] }
            ]}
            {...commentPanResponder.panHandlers}
          >
            <TouchableOpacity 
              style={styles.modalHandle} 
              onPress={() => setShowCommentModal(false)}
              activeOpacity={0.7}
            />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Comments</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.placeholderText}>Comments coming soon...</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* More Options Modal */}
      <Modal
        visible={showMoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalOverlayTransparent}>
          <Animated.View 
            style={[
              styles.modalContainer, 
              { height: screenHeight * 0.5 },
              { transform: [{ translateY: moreModalY }] }
            ]}
            {...morePanResponder.panHandlers}
          >
            <TouchableOpacity 
              style={styles.modalHandle} 
              onPress={() => setShowMoreModal(false)}
              activeOpacity={0.7}
            />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMoreModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>More Options</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowMoreModal(false);
                  onReport?.(post.id);
                }}
              >
                <Flag size={20} color={Colors.error[600]} />
                <Text style={[styles.modalOptionText, { color: Colors.error[600] }]}>Report Post</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowMoreModal(false);
                  onHide?.(post.id);
                }}
              >
                <EyeOff size={20} color={Colors.neutral[600]} />
                <Text style={styles.modalOptionText}>Hide Post</Text>
              </TouchableOpacity>

              {currentUserId !== post.userId && (
                <>
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowMoreModal(false);
                      onBlock?.(post.userId);
                    }}
                  >
                    <UserX size={20} color={Colors.error[600]} />
                    <Text style={[styles.modalOptionText, { color: Colors.error[600] }]}>Block User</Text>
                  </TouchableOpacity>

                  {isFollowing && (
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setShowMoreModal(false);
                        onUnfollow?.(post.userId);
                      }}
                    >
                      <UserMinus size={20} color={Colors.warning[600]} />
                      <Text style={[styles.modalOptionText, { color: Colors.warning[600] }]}>Unfollow User</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowMoreModal(false);
                      // Navigate to user profile or about
                    }}
                  >
                    <Info size={20} color={Colors.neutral[600]} />
                    <Text style={styles.modalOptionText}>About This Account</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
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
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary[700],
    marginLeft: 4,
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
    borderRadius: 8,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 180,
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  moreButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTransparent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  modalContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 40,
  },
});
