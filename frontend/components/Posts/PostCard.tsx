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
  ScrollView,
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
  UserPlus,
  Info,
  Calendar,
  Megaphone,
  CloudRain,
  ArrowLeft,
  VolumeX,
  RotateCcw,
  Trash2
} from "lucide-react-native";
import { Post } from "../../types";
import { Colors } from "../../constants/Colors";

const { height: screenHeight } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onMessage?: (userId: number, userName: string) => void;
  onReport?: (postId: number) => void;
  onBlock?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onHide?: (postId: number) => void;
  onFollow?: (userId: number) => void;
  onMute?: (userId: number) => void;
  onDelete?: (postId: number) => void;
  currentUserId?: number;
  isFollowing?: boolean;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onMessage,
  onReport,
  onBlock,
  onUnfollow,
  onHide,
  currentUserId,
  isFollowing = false,
  onFollow,
  onMute,
  onDelete,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Track if any modal is currently open
  const isAnyModalOpen = showCommentModal || showMoreModal || showHideModal || showReportModal || showShareModal || showDeleteModal;
  
  // Helper to safely open a modal (only if no other modal is open)
  const openModalSafely = (modalSetter: (value: boolean) => void) => {
    if (!isAnyModalOpen) {
      modalSetter(true);
    }
  };
  
  // Helper to close modal immediately
  const closeModalImmediately = (modalSetter: (value: boolean) => void, animatedValue: Animated.Value) => {
    modalSetter(false);
    animatedValue.setValue(0);
  };

  const commentModalY = React.useRef(new Animated.Value(0)).current;
  const moreModalY = React.useRef(new Animated.Value(0)).current;
  const hideModalY = React.useRef(new Animated.Value(0)).current;
  const reportModalY = React.useRef(new Animated.Value(0)).current;
  const shareModalY = React.useRef(new Animated.Value(0)).current;


  const commentPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        commentModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 60 || gestureState.vy > 0.5) {
        Animated.timing(commentModalY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setShowCommentModal(false);
          setTimeout(() => {
            commentModalY.setValue(0);
          }, 50);
        });
      } else {
        Animated.spring(commentModalY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const morePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        moreModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 60 || gestureState.vy > 0.5) {
        Animated.timing(moreModalY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setShowMoreModal(false);
          setTimeout(() => {
            moreModalY.setValue(0);
          }, 50);
        });
      } else {
        Animated.spring(moreModalY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const hidePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        hideModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 60 || gestureState.vy > 0.5) {
        Animated.timing(hideModalY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setShowHideModal(false);
          setTimeout(() => {
            hideModalY.setValue(0);
          }, 50);
        });
      } else {
        Animated.spring(hideModalY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const reportPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        reportModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 60 || gestureState.vy > 0.5) {
        Animated.timing(reportModalY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setShowReportModal(false);
          setTimeout(() => {
            reportModalY.setValue(0);
          }, 50);
        });
      } else {
        Animated.spring(reportModalY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const sharePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        shareModalY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 60 || gestureState.vy > 0.5) {
        Animated.timing(shareModalY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setShowShareModal(false);
          setTimeout(() => {
            shareModalY.setValue(0);
          }, 50);
        });
      } else {
        Animated.spring(shareModalY, {
          toValue: 0,
          tension: 120,
          friction: 8,
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
      case "question":
        return HelpCircle;
      case "event":
        return Calendar;
      case "announcement":
        return Megaphone;
      case "weather_alert":
        return CloudRain;
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
      case "question":
        return Colors.neutral[600];
      case "event":
        return Colors.purple[600];
      case "announcement":
        return Colors.primary[600];
      case "weather_alert":
        return Colors.warning[600];
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
    if (type === "help_offer") {
      return "Offering Help";
    }
    if (type === "question") {
      return "Question";
    }
    if (type === "event") {
      return "Event";
    }
    if (type === "announcement") {
      return "Announcement";
    }
    if (type === "weather_alert") {
      return "Weather Alert";
    }
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleBackToMore = () => {
    closeModalImmediately(setShowHideModal, hideModalY);
    closeModalImmediately(setShowReportModal, reportModalY);
    setShowMoreModal(true);
  };

  const closeAllModals = () => {
    closeModalImmediately(setShowMoreModal, moreModalY);
    closeModalImmediately(setShowHideModal, hideModalY);
    closeModalImmediately(setShowReportModal, reportModalY);
    closeModalImmediately(setShowShareModal, shareModalY);
  };

  return (
    <View
      style={styles.card}
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
          {post.isEmergency && post.postType !== "safety_alert" && (
            <View style={[styles.badge, styles.emergencyBadge]}>
              <AlertTriangle size={12} color={Colors.error[700]} />
              <Text style={styles.emergencyText}>EMERGENCY</Text>
            </View>
          )}
          {(post.postType === "safety_alert" || post.postType === "help_request" || post.postType === "help_offer" || post.postType === "question" || post.postType === "event" || post.postType === "announcement" || post.postType === "weather_alert") && (
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
            resizeMode="contain"
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
            onPress={() => openModalSafely(setShowCommentModal)}
          >
            <MessageCircle
              size={20}
              color={Colors.neutral[600]}
            />
            <Text style={styles.actionText}>{post.commentCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openModalSafely(setShowShareModal)}
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
          onPress={() => openModalSafely(setShowMoreModal)}
        >
          <MoreHorizontal
            size={20}
            color={Colors.neutral[600]}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModalImmediately(setShowCommentModal, commentModalY)}
      >
        <TouchableWithoutFeedback onPress={() => closeModalImmediately(setShowCommentModal, commentModalY)}>
          <View style={styles.modalOverlayTransparent}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer, 
                  { height: screenHeight * 0.5 },
                  { transform: [{ translateY: commentModalY }] }
                ]}
              >
                <View 
                  style={styles.modalHeaderContainer}
                  {...commentPanResponder.panHandlers}
                >
                  <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                  </View>
                  <View style={styles.modalHeaderCentered}>
                    <Text style={styles.modalTitle}>Comments</Text>
                  </View>
                </View>
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showMoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModalImmediately(setShowMoreModal, moreModalY)}
      >
        <TouchableWithoutFeedback onPress={() => closeModalImmediately(setShowMoreModal, moreModalY)}>
          <View style={styles.modalOverlayTransparent}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer, 
                  { height: screenHeight * 0.5 },
                  { transform: [{ translateY: moreModalY }] }
                ]}
              >
                <View 
                  style={styles.modalHeaderContainer}
                  {...morePanResponder.panHandlers}
                >
                  <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                  </View>
                  <View style={styles.modalHeaderCentered}>
                    <Text style={styles.modalTitle}>More Options</Text>
                  </View>
                </View>
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  {currentUserId !== post.userId && (
                    <TouchableOpacity 
                      style={styles.modalOptionNoBorder}
                      onPress={() => {
                        setShowMoreModal(false);
                        if (isFollowing) {
                          onUnfollow?.(post.userId);
                        } else {
                          onFollow?.(post.userId);
                        }
                      }}
                    >
                      {isFollowing ? (
                        <UserMinus size={20} color={Colors.warning[600]} />
                      ) : (
                        <UserPlus size={20} color={Colors.primary[600]} />
                      )}
                      <Text style={[styles.modalOptionText, isFollowing ? { color: Colors.warning[600] } : { color: Colors.primary[600] }]}>
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.modalOptionNoBorder}
                    onPress={() => {
                      closeModalImmediately(setShowMoreModal, moreModalY);
                      setShowHideModal(true);
                    }}
                  >
                    <EyeOff size={20} color={Colors.neutral[600]} />
                    <Text style={styles.modalOptionText}>Hide</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOptionNoBorder}
                    onPress={() => {
                      closeModalImmediately(setShowMoreModal, moreModalY);
                      setShowReportModal(true);
                    }}
                  >
                    <Flag size={20} color={Colors.error[600]} />
                    <Text style={[styles.modalOptionText, { color: Colors.error[600] }]}>Report</Text>
                  </TouchableOpacity>

                  {currentUserId !== post.userId && (
                    <TouchableOpacity 
                      style={styles.modalOptionNoBorder}
                      onPress={() => {
                        setShowMoreModal(false);
                        onBlock?.(post.userId);
                      }}
                    >
                      <UserX size={20} color={Colors.error[600]} />
                      <Text style={[styles.modalOptionText, { color: Colors.error[600] }]}>Block User</Text>
                    </TouchableOpacity>
                  )}

                  {currentUserId === post.userId && (
                    <TouchableOpacity 
                      style={styles.modalOptionNoBorder}
                      onPress={() => {
                        setShowMoreModal(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={20} color={Colors.error[600]} />
                      <Text style={[styles.modalOptionText, { color: Colors.error[600] }]}>Delete Post</Text>
                    </TouchableOpacity>
                  )}
            </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showHideModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModalImmediately(setShowHideModal, hideModalY)}
      >
        <TouchableWithoutFeedback onPress={() => closeModalImmediately(setShowHideModal, hideModalY)}>
          <View style={styles.modalOverlayTransparent}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer, 
                  { height: screenHeight * 0.5 },
                  { transform: [{ translateY: hideModalY }] }
                ]}
              >
                <View 
                  style={styles.modalHeaderContainer}
                  {...hidePanResponder.panHandlers}
                >
                  <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                  </View>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={handleBackToMore}
                    >
                      <ArrowLeft size={20} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Hide Post</Text>
                    <View style={styles.backButton} />
                  </View>
                </View>
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      closeModalImmediately(setShowHideModal, hideModalY);
                      setShowReportModal(true);
                    }}
                  >
                    <Flag size={20} color={Colors.error[600]} />
                    <Text style={styles.modalOptionText}>Report this post</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowHideModal(false);
                      onMute?.(post.userId);
                    }}
                  >
                    <VolumeX size={20} color={Colors.neutral[600]} />
                    <Text style={styles.modalOptionText}>Mute {post.firstName} {post.lastName}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => setShowHideModal(false)}
                  >
                    <RotateCcw size={20} color={Colors.neutral[600]} />
                    <Text style={styles.modalOptionText}>Undo</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModalImmediately(setShowReportModal, reportModalY)}
      >
        <TouchableWithoutFeedback onPress={() => closeModalImmediately(setShowReportModal, reportModalY)}>
          <View style={styles.modalOverlayTransparent}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer, 
                  { height: screenHeight * 0.5 },
                  { transform: [{ translateY: reportModalY }] }
                ]}
              >
                <View 
                  style={styles.modalHeaderContainer}
                  {...reportPanResponder.panHandlers}
                >
                  <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                  </View>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={handleBackToMore}
                    >
                      <ArrowLeft size={20} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Report Post</Text>
                    <View style={styles.backButton} />
                  </View>
                </View>
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>I just don't like it</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Bullying or unwanted content</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Suicide, self injury or eating disorders</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Violence, hate or exploitation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Selling or promoting restricted items</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Nudity or sexual activity</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Scam, fraud or spam</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Intellectual property</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setShowReportModal(false);
                      onReport?.(post.id);
                    }}
                  >
                    <Text style={styles.modalOptionText}>I want to request a community note</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModalImmediately(setShowShareModal, shareModalY)}
      >
        <TouchableWithoutFeedback onPress={() => closeModalImmediately(setShowShareModal, shareModalY)}>
          <View style={styles.modalOverlayTransparent}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer, 
                  { height: screenHeight * 0.5 },
                  { transform: [{ translateY: shareModalY }] }
                ]}
              >
                <View 
                  style={styles.modalHeaderContainer}
                  {...sharePanResponder.panHandlers}
                >
                  <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                  </View>
                  <View style={styles.modalHeaderCentered}>
                    <Text style={styles.modalTitle}>Share</Text>
                  </View>
                </View>
                <View style={styles.shareModalContent}>
                  <View style={styles.followersSection}>
                    <Text style={styles.sectionTitle}>Send to</Text>
                    <ScrollView 
                      style={styles.followersScrollContainer}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <View style={styles.followersGrid}>
                      </View>
                    </ScrollView>
                  </View>
                  
                  <View style={styles.shareOptionsSection}>
                    <Text style={styles.sectionTitle}>More Options</Text>
                    <ScrollView 
                      horizontal 
                      style={styles.shareOptionsContainer}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.shareOptionsContent}
                    >
                      <TouchableOpacity style={styles.shareOption}>
                        <View style={styles.shareOptionIcon}>
                          <MessageCircle size={24} color={Colors.primary[600]} />
                        </View>
                        <Text style={styles.shareOptionText}>Messages</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.shareOption}>
                        <View style={styles.shareOptionIcon}>
                          <Share size={24} color={Colors.neutral[600]} />
                        </View>
                        <Text style={styles.shareOptionText}>Copy Link</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.shareOption}>
                        <View style={styles.shareOptionIcon}>
                          <Share size={24} color={Colors.warning[600]} />
                        </View>
                        <Text style={styles.shareOptionText}>Snapchat</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.shareOption}>
                        <View style={styles.shareOptionIcon}>
                          <Share size={24} color={Colors.purple[600]} />
                        </View>
                        <Text style={styles.shareOptionText}>Instagram</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.shareOption}>
                        <View style={styles.shareOptionIcon}>
                          <Share size={24} color={Colors.primary[600]} />
                        </View>
                        <Text style={styles.shareOptionText}>More</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete post?</Text>
            <Text style={styles.deleteMessage}>
              This can't be undone and it will be removed from your profile and the timeline.
            </Text>
            
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.deleteButtonSecondary}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButtonPrimary}
                onPress={() => {
                  setShowDeleteModal(false);
                  onDelete?.(post.id);
                }}
              >
                <Text style={styles.deleteButtonPrimaryText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginHorizontal: -16,
    borderRadius: 0,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1.5,
    maxHeight: 300,
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
  modalHeaderContainer: {
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  modalHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral[300],
    borderRadius: 2,
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
  modalHeaderCentered: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  shareModalContent: {
    flex: 1,
    flexDirection: 'column',
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
  modalOptionNoBorder: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  followersSection: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  followersScrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  followersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  followerItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  followerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  followerName: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.primary,
    textAlign: 'center',
  },
  shareOptionsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingBottom: 34,
  },
  shareOptionsContainer: {
    paddingHorizontal: 20,
  },
  shareOptionsContent: {
    paddingRight: 20,
    gap: 16,
  },
  shareOption: {
    alignItems: 'center',
    width: 80,
  },
  shareOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.primary,
    textAlign: 'center',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteModal: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  deleteButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.error[600],
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
