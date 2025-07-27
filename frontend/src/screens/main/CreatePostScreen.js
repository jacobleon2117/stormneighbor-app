// File: frontend/src/screens/main/CreatePostScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
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
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const CreatePostScreen = ({ user, onCreatePost, onClose }) => {
  const [postContent, setPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [publicScope, setPublicScope] = useState("public");
  const [showPublicOptions, setShowPublicOptions] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const quickActionsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        if (showQuickActions) {
          animateQuickActionsOut();
          setShowQuickActions(false);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
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
      id: "announcement", // Keep unique ID but map to general
      title: "Announcement",
      icon: Megaphone,
      color: colors.text.link,
      bgColor: colors.primaryLight,
      badgeText: "Announcement",
      postType: "general", // Add this field
    },
    {
      id: "event", // Keep unique ID but map to general
      title: "Create Event",
      icon: Calendar,
      color: colors.primary,
      bgColor: colors.primaryLight,
      badgeText: "Event",
      postType: "general", // Add this field
    },
    {
      id: "safety_alert",
      title: "Safety Alert",
      icon: AlertTriangle,
      color: colors.error,
      bgColor: colors.errorLight,
      badgeText: "Safety Alert",
      postType: "safety_alert", // Add this field
    },
    {
      id: "weather", // Keep unique ID but map to general
      title: "Weather Alert",
      icon: Cloud,
      color: colors.warning,
      bgColor: colors.warningLight,
      badgeText: "Weather Alert",
      postType: "general", // Add this field
    },
    {
      id: "question", // Keep unique ID but map to general
      title: "Ask Question",
      icon: HelpCircle,
      color: colors.success,
      bgColor: colors.successLight,
      badgeText: "Question",
      postType: "general", // Add this field
    },
    {
      id: "help_offer",
      title: "Offer Help",
      icon: Gift,
      color: "#F97316",
      bgColor: "#FED7AA",
      badgeText: "Offer Help",
      postType: "help_offer", // Add this field
    },
  ];

  const animateQuickActionsIn = () => {
    Animated.timing(quickActionsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateQuickActionsOut = () => {
    Animated.timing(quickActionsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
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
        title: selectedBadge?.title || null,
        postType: selectedBadge?.postType || "general",
        priority: "normal",
        isEmergency: selectedBadge?.postType === "safety_alert",
      };

      await onCreatePost(postData);
      Keyboard.dismiss();
      onClose();
    } catch (error) {
      console.error("Post creation error:", error);
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
          { text: "Discard", style: "destructive", onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedBadge(template);
  };

  const handleMorePress = () => {
    if (showQuickActions) {
      animateQuickActionsOut();
      setShowQuickActions(false);
    } else {
      Keyboard.dismiss();
      setTimeout(() => {
        setShowQuickActions(true);
        animateQuickActionsIn();
      }, 100);
    }
  };

  const renderSettingsRow = () => (
    <View style={styles.settingsRow}>
      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => setShowPublicOptions(true)}
      >
        <Globe size={16} color={colors.text.muted} />
        <Text style={styles.settingText}>
          {publicScope === "public" ? "Public" : "Neighborhood"}
        </Text>
        <ChevronDown size={16} color={colors.text.muted} />
      </TouchableOpacity>

      <View style={globalStyles.flex1} />

      <TouchableOpacity
        style={[
          createButtonStyle("primary", "small"),
          (!postContent.trim() || isSubmitting) && globalStyles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!postContent.trim() || isSubmitting}
      >
        <Text style={globalStyles.buttonPrimaryText}>
          {isSubmitting ? "Posting..." : "Post"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPostInput = () => (
    <View style={styles.postInputContainer}>
      {selectedBadge && (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.postBadge,
              {
                backgroundColor: selectedBadge.bgColor,
                borderColor: selectedBadge.color,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: selectedBadge.color }]}>
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
        placeholderTextColor={colors.text.muted}
        multiline
        textAlignVertical="top"
        maxLength={500}
        onFocus={() => {
          if (showQuickActions) {
            animateQuickActionsOut();
            setShowQuickActions(false);
          }
        }}
      />
    </View>
  );

  const renderMediaRow = () => (
    <View style={styles.mediaRow}>
      <TouchableOpacity
        style={styles.mediaButton}
        onPress={() =>
          Alert.alert("Coming Soon", "Photo upload will be available soon!")
        }
      >
        <Camera size={24} color={colors.text.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mediaButton}
        onPress={() =>
          Alert.alert("Coming Soon", "Video upload will be available soon!")
        }
      >
        <Video size={24} color={colors.text.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mediaButton}
        onPress={() =>
          Alert.alert("Coming Soon", "Location tagging will be available soon!")
        }
      >
        <MapPin size={24} color={colors.text.muted} />
      </TouchableOpacity>

      <View style={globalStyles.flex1} />

      {!showQuickActions && (
        <TouchableOpacity
          style={styles.settingButton}
          onPress={handleMorePress}
        >
          <LayoutDashboard size={16} color={colors.text.muted} />
          <Text style={styles.settingText}>Templates</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <Animated.View
      style={[styles.quickActionsSection, { opacity: quickActionsOpacity }]}
    >
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
                isSelected && { borderColor: action.color, borderWidth: 2 },
              ]}
              onPress={() => handleTemplateSelect(action)}
            >
              <IconComponent size={20} color={action.color} />
              <Text style={[styles.quickActionText, { color: action.color }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderPublicOptionsModal = () =>
    showPublicOptions && (
      <TouchableWithoutFeedback onPress={() => setShowPublicOptions(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPublicOptions(false)}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>

              {[
                { label: "Public", value: "public" },
                { label: "Neighborhood Only", value: "neighborhood" },
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
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );

  // Header actions for the close button
  const headerActions = [
    {
      icon: <X size={24} color={colors.text.primary} />,
      onPress: handleClose,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout
        title="Create Post"
        showHeader={true}
        headerActions={headerActions}
        scrollable={false}
        contentPadding={false}
        showDefaultActions={false}
      >
        {renderSettingsRow()}
        {renderPostInput()}
        {renderMediaRow()}
        {showQuickActions && renderQuickActions()}
        {renderPublicOptionsModal()}
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
};

const styles = {
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },

  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },

  settingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
  },

  postInputContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flex: 1,
    position: "relative",
  },

  badgeContainer: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
  },

  postBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },

  postInput: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    textAlignVertical: "top",
    flex: 1,
    fontFamily: "Inter",
  },

  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
  },

  mediaButton: {
    padding: spacing.sm,
  },

  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },

  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    minWidth: "48%",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },

  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modalContainer: {
    width: 300,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    paddingTop: spacing.xxxxl,
    position: "relative",
    ...globalStyles.card,
  },

  modalCloseButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    padding: spacing.xs,
  },

  publicOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },

  publicOptionText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
};

export default CreatePostScreen;
