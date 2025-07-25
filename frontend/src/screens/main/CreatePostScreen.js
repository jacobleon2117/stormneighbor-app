// File: frontend/src/screens/main/CreatePostScreen.js
import { useState, useEffect, useRef } from "react";
import { TouchableWithoutFeedback } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import {
  X,
  Camera,
  Video,
  MapPin,
  Globe,
  AtSign,
  AlertTriangle,
  Calendar,
  HelpCircle,
  Megaphone,
  Cloud,
  Gift,
  ChevronDown,
  Check,
  LayoutDashboard,
} from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const CreatePostScreen = ({ user, onCreatePost, onClose }) => {
  const [postContent, setPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showPublic, setShowPublic] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [mentionsOff, setMentionsOff] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [publicScope, setPublicScope] = useState("public");
  const [showPublicOptions, setShowPublicOptions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [storedKeyboardHeight, setStoredKeyboardHeight] = useState(0);
  const quickActionsOpacity = useRef(new Animated.Value(1)).current;
  const quickActionsHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setIsKeyboardVisible(true);
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        setStoredKeyboardHeight(height);
        if (showQuickActions) {
          animateQuickActionsOut(() => {
            setShowQuickActions(false);
          });
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        if (!showQuickActions && !postContent.trim()) {
          setShowQuickActions(true);
          animateQuickActionsIn();
        }
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [showQuickActions, postContent]);

  const quickActions = [
    {
      id: "announcement",
      title: "Announcement",
      icon: Megaphone,
      color: "#8B5CF6",
      bgColor: "#F3E8FF",
      badgeText: "Announcement",
    },
    {
      id: "event",
      title: "Create Event",
      icon: Calendar,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      badgeText: "Event",
    },
    {
      id: "safety",
      title: "Safety Alert",
      icon: AlertTriangle,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      badgeText: "Safety Alert",
    },
    {
      id: "weather",
      title: "Weather Alert",
      icon: Cloud,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      badgeText: "Weather Alert",
    },
    {
      id: "question",
      title: "Ask Question",
      icon: HelpCircle,
      color: "#10B981",
      bgColor: "#D1FAE5",
      badgeText: "Question",
    },
    {
      id: "help",
      title: "Offer Help",
      icon: Gift,
      color: "#F97316",
      bgColor: "#FED7AA",
      badgeText: "Offer Help",
    },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedBadge(template);
  };

  const handleSubmit = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please enter your post content");
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        content: postContent.trim(),
        isPublic: showPublic,
        showLocation: showLocation,
        mentionsEnabled: !mentionsOff,
        badge: selectedBadge?.id || null,
        neighborhoodId: user?.neighborhoodId,
      };

      await new Promise((resolve) => setTimeout(resolve, 1500));

      Keyboard.dismiss();

      Alert.alert(
        "Success!",
        "Your post has been shared with the neighborhood",
        [
          {
            text: "OK",
            onPress: () => {
              if (onCreatePost) onCreatePost(postData);
              if (onClose) onClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (postContent.trim() || selectedBadge) {
      Alert.alert(
        "Discard Post?",
        "You have unsaved changes. Are you sure you want to discard this post?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: onClose,
          },
        ]
      );
    } else {
      if (onClose) onClose();
    }
  };

  const handleInputFocus = () => {
    if (showQuickActions) {
      animateQuickActionsOut(() => {
        setShowQuickActions(false);
      });
    }
  };

  const handleMorePress = () => {
    if (showQuickActions) {
      animateQuickActionsOut(() => {
        setShowQuickActions(false);
      });
    } else {
      Keyboard.dismiss();
      setTimeout(() => {
        setShowQuickActions(true);
        animateQuickActionsIn();
      }, 100);
    }
  };

  const animateQuickActionsIn = () => {
    Animated.parallel([
      Animated.timing(quickActionsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(quickActionsHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateQuickActionsOut = (callback) => {
    Animated.parallel([
      Animated.timing(quickActionsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(quickActionsHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback && callback();
    });
  };

  return (
    <KeyboardAvoidingView
      style={mainStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TopNav
        title="Create Post"
        showSearch={false}
        showMessages={false}
        showMore={false}
        rightComponent={
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
        }
      />

      <View style={styles.settingsRow}>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setShowPublicOptions(true)}
        >
          <Globe size={16} color="#6B7280" />
          <Text style={[styles.settingText, { marginRight: 6 }]}>
            {publicScope === "public"
              ? "Public"
              : publicScope === "nearby"
              ? "Nearby"
              : "Local Neighborhood"}
          </Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setMentionsOff(!mentionsOff)}
        >
          <AtSign size={16} color="#6B7280" />
          <Text style={styles.settingText}>{mentionsOff ? "Off" : "On"}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[
            styles.postButton,
            (!postContent.trim() || isSubmitting) && styles.postButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!postContent.trim() || isSubmitting}
        >
          <Text style={styles.postButtonText}>
            {isSubmitting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      {showPublicOptions && (
        <TouchableWithoutFeedback onPress={() => setShowPublicOptions(false)}>
          <View style={styles.publicOptionsOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.publicOptionsPopup}>
                <TouchableOpacity
                  style={styles.popupCloseButton}
                  onPress={() => setShowPublicOptions(false)}
                >
                  <X size={20} color="#374151" />
                </TouchableOpacity>

                {[
                  { label: "Public", value: "public" },
                  { label: "Nearby", value: "nearby" },
                  { label: "Local Neighborhood", value: "local" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.publicOptionButton}
                    onPress={() => {
                      setPublicScope(option.value);
                      setShowPublicOptions(false);
                    }}
                  >
                    <Text style={styles.publicOptionText}>{option.label}</Text>
                    {publicScope === option.value && (
                      <Check size={18} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <View style={styles.postInputContainer}>
        {selectedBadge && (
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.postBadge,
                selectedBadge.id === "safety" && styles.safetyBadge,
                selectedBadge.id === "weather" && styles.weatherBadge,
                selectedBadge.id === "announcement" && styles.announcementBadge,
                selectedBadge.id === "event" && styles.eventBadge,
                selectedBadge.id === "question" && styles.questionBadge,
                selectedBadge.id === "help" && styles.helpBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  selectedBadge.id === "safety" && styles.safetyBadgeText,
                  selectedBadge.id === "weather" && styles.weatherBadgeText,
                  selectedBadge.id === "announcement" &&
                    styles.announcementBadgeText,
                  selectedBadge.id === "event" && styles.eventBadgeText,
                  selectedBadge.id === "question" && styles.questionBadgeText,
                  selectedBadge.id === "help" && styles.helpBadgeText,
                ]}
              >
                {selectedBadge.badgeText}
              </Text>
            </View>
          </View>
        )}

        <TextInput
          style={styles.postInput}
          value={postContent}
          onChangeText={setPostContent}
          placeholder="What's on your mind?"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={500}
          onFocus={handleInputFocus}
        />
      </View>

      <View style={styles.mediaRow}>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() =>
            Alert.alert("Coming Soon", "Photo upload will be available soon!")
          }
        >
          <Camera size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() =>
            Alert.alert("Coming Soon", "Video upload will be available soon!")
          }
        >
          <Video size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Location tagging will be available soon!"
            )
          }
        >
          <MapPin size={24} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {!showQuickActions && (
          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleMorePress}
          >
            <LayoutDashboard size={16} color="#6B7280" />
            <Text style={styles.settingText}>More</Text>
          </TouchableOpacity>
        )}
      </View>

      {showQuickActions && (
        <Animated.View
          style={[
            styles.quickActionsSection,
            {
              opacity: quickActionsOpacity,
              transform: [
                {
                  scaleY: quickActionsHeight,
                },
              ],
              height: storedKeyboardHeight > 0 ? storedKeyboardHeight : "auto",
              maxHeight:
                storedKeyboardHeight > 0 ? storedKeyboardHeight : undefined,
            },
          ]}
        >
          <View style={styles.quickActionsContent}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                const isSelected = selectedBadge?.id === action.id;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.quickActionButton,
                      { backgroundColor: action.bgColor },
                      isSelected && styles.quickActionButtonSelected,
                    ]}
                    onPress={() => handleTemplateSelect(action)}
                  >
                    <IconComponent size={20} color={action.color} />
                    <Text
                      style={[styles.quickActionText, { color: action.color }]}
                    >
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
  },
  closeButtonLeft: {
    padding: 8,
    marginRight: 8,
  },
  settingsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 12,
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  settingButtonActive: {
    backgroundColor: "#EBF8FF",
    borderColor: "#3B82F6",
  },
  settingText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  settingTextActive: {
    color: "#3B82F6",
  },
  spacer: {
    flex: 1,
  },
  postButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  postInputContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: "relative",
    flex: 1,
  },
  badgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  postBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyBadge: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  weatherBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  announcementBadge: {
    backgroundColor: "#F3E8FF",
    borderColor: "#8B5CF6",
  },
  eventBadge: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  questionBadge: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  helpBadge: {
    backgroundColor: "#FED7AA",
    borderColor: "#F97316",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  safetyBadgeText: {
    color: "#EF4444",
  },
  weatherBadgeText: {
    color: "#F59E0B",
  },
  announcementBadgeText: {
    color: "#8B5CF6",
  },
  eventBadgeText: {
    color: "#3B82F6",
  },
  questionBadgeText: {
    color: "#10B981",
  },
  helpBadgeText: {
    color: "#F97316",
  },
  postInput: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
    textAlignVertical: "top",
    flex: 1,
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  mediaButton: {
    padding: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#F8FAFF",
  },
  quickActionsContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
    minWidth: "48%",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  quickActionButtonSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  publicOptionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },

  publicOptionsPopup: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    paddingTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  popupCloseButton: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 0,
  },

  publicOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  publicOptionText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "left",
    flex: 1,
  },
});

export default CreatePostScreen;
