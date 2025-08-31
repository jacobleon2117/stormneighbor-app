import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { Header } from "../../components/UI/Header";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import * as ImagePicker from "expo-image-picker";
import { 
  MapPin, 
  Camera, 
  Image as Gallery, 
  MoreHorizontal,
  Megaphone,
  Heart,
  CloudRain,
  AlertTriangle,
  HelpCircle,
  Calendar,
  X,
  Check,
  Globe,
  Users,
  UserCheck
} from "lucide-react-native";


export default function CreateScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const textInputRef = React.useRef<TextInput>(null);
  const [postText, setPostText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude?: number;
    longitude?: number;
    useCurrentLocation: boolean;
  }>({
    name: user?.locationCity ? `${user.locationCity}, ${user.addressState}` : "Current Location",
    latitude: user?.latitude,
    longitude: user?.longitude,
    useCurrentLocation: true
  });
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'neighbors' | 'friends'>('neighbors');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'posting' | 'success'>('idle');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const quickActions = [
    { 
      id: 'announcement', 
      label: 'Announcement', 
      icon: Megaphone, 
      color: Colors.primary[500],
      bgColor: Colors.primary[50]
    },
    { 
      id: 'offer_help', 
      label: 'Offer Help', 
      icon: Heart, 
      color: Colors.success[600],
      bgColor: Colors.success[50]
    },
    { 
      id: 'weather_alert', 
      label: 'Weather Alert', 
      icon: CloudRain, 
      color: Colors.warning[600],
      bgColor: Colors.warning[50]
    },
    { 
      id: 'safety_alert', 
      label: 'Safety Alert', 
      icon: AlertTriangle, 
      color: Colors.error[600],
      bgColor: Colors.error[50]
    },
    { 
      id: 'ask_question', 
      label: 'Ask Question', 
      icon: HelpCircle, 
      color: Colors.neutral[600],
      bgColor: Colors.neutral[50]
    },
    { 
      id: 'create_event', 
      label: 'Create Event', 
      icon: Calendar, 
      color: Colors.purple[600],
      bgColor: Colors.purple[50]
    },
  ];

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillHideListener.remove();
      keyboardWillShowListener.remove();
    };
  }, []);

  const handleTextInputFocus = () => {
    setIsTyping(true);
    setShowQuickActions(false);
  };

  const handleTextInputBlur = () => {
    setIsTyping(false);
  };

  const toggleQuickActions = () => {
    if (showQuickActions) {
      setShowQuickActions(false);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else {
      if (isTyping) {
        Keyboard.dismiss();
      }
      setShowQuickActions(true);
    }
  };

  const selectQuickAction = (actionId: string) => {
    if (selectedAction === actionId) {
      setSelectedAction(null);
    } else {
      setSelectedAction(actionId);
    }
  };

  const removeSelectedAction = () => {
    setSelectedAction(null);
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      Alert.alert("Error", "Please enter some text for your post.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please log in to create a post.");
      return;
    }

    try {
      Keyboard.dismiss();
      setIsPosting(true);
      setPostStatus('posting');
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const selectedQuickAction = quickActions.find(a => a.id === selectedAction);
      
      const postData = {
        content: postText.trim(),
        postType: getPostTypeFromAction(selectedAction),
        priority: getPriorityFromAction(selectedAction),
        isEmergency: selectedAction === 'safety_alert',
        tags: selectedAction ? [selectedAction] : [],
        images: selectedImages,
        // TODO: Backend doesn't support these fields yet, will add later
        // latitude: selectedLocation.latitude,
        // longitude: selectedLocation.longitude,
        // locationName: selectedLocation.name,
        // privacy: privacyLevel,
      };

      console.log('Creating post:', postData);

      const response = await apiService.createPost(postData);

      if (response.success) {
        setPostStatus('success');
        
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setPostText('');
          setSelectedAction(null);
          setSelectedImages([]);
          setShowQuickActions(true);
          setPostStatus('idle');
          scaleAnim.setValue(0);
          fadeAnim.setValue(0);
          
          router.replace("/(tabs)");
        });
      } else {
        throw new Error(response.message || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      setPostStatus('idle');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Alert.alert(
        "Error", 
        error.response?.data?.message || error.message || "Failed to create post. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  const getPostTypeFromAction = (actionId: string | null): string => {
    switch (actionId) {
      case 'safety_alert':
        return 'safety_alert';
      case 'offer_help':
        return 'help_offer';
      case 'ask_question':
        return 'question';
      case 'create_event':
        return 'event';
      case 'weather_alert':
        return 'weather_alert';
      case 'announcement':
        return 'announcement';
      default:
        return 'general';
    }
  };

  const getPriorityFromAction = (actionId: string | null): string => {
    switch (actionId) {
      case 'safety_alert':
      case 'weather_alert':
        return 'urgent';
      case 'offer_help':
      case 'ask_question':
        return 'high';
      case 'create_event':
        return 'normal';
      case 'announcement':
        return 'high';
      default:
        return 'normal';
    }
  };

  const handleGalleryPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris].slice(0, 5));
      }
      
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images from gallery.');
    }
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        aspect: [1, 1],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setSelectedImages(prev => [...prev, newImage].slice(0, 5));
      }
      
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacyModal(true);
  };

  const getPrivacyIcon = () => {
    switch (privacyLevel) {
      case 'public': return Globe;
      case 'neighbors': return Users;
      case 'friends': return UserCheck;
      default: return Users;
    }
  };

  const getPrivacyLabel = () => {
    switch (privacyLevel) {
      case 'public': return 'Public';
      case 'neighbors': return 'Neighbors';
      case 'friends': return 'Friends';
      default: return 'Neighbors';
    }
  };

  const handleClosePress = () => {
    const hasContent = postText.trim() || selectedImages.length > 0 || selectedAction;
    
    if (hasContent) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscardPost = () => {
    setPostText('');
    setSelectedAction(null);
    setSelectedImages([]);
    setShowQuickActions(true);
    setShowDiscardModal(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create Post"
        showSearch={false}
        showMessages={false}
        showMore={false}
        showCloseButton={true}
        onClosePress={handleClosePress}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <SafeAreaView style={styles.safeContent}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (isTyping) {
                Keyboard.dismiss();
              }
            }}
          >
            <View style={styles.content}>
              <View style={styles.topButtonRow}>
                <View style={styles.leftButtons}>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleLocationPress}
                  >
                    <MapPin size={16} color={Colors.text.secondary} />
                    <Text style={styles.buttonText} numberOfLines={1}>
                      {selectedLocation.name.length > 12
                        ? selectedLocation.name.substring(0, 12) + "..."
                        : selectedLocation.name}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.privacyButton}
                    onPress={handlePrivacyPress}
                  >
                    {React.createElement(getPrivacyIcon(), {
                      size: 16,
                      color: Colors.text.secondary,
                    })}
                    <Text style={styles.buttonText}>{getPrivacyLabel()}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.postButton,
                    (!postText.trim() || isPosting) &&
                      styles.postButtonDisabled,
                  ]}
                  onPress={handleCreatePost}
                  disabled={!postText.trim() || isPosting}
                >
                  <Text
                    style={[
                      styles.postButtonText,
                      (!postText.trim() || isPosting) &&
                        styles.postButtonTextDisabled,
                    ]}
                  >
                    Post
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.contentArea}>
                <View style={styles.textInputContainer}>
                  {selectedAction && (
                    <View style={styles.selectedActionInline}>
                      {(() => {
                        const action = quickActions.find(
                          (a) => a.id === selectedAction
                        );
                        if (!action) return null;
                        const IconComponent = action.icon;
                        return (
                          <>
                            <IconComponent size={16} color={action.color} />
                            <Text
                              style={[
                                styles.inlineBadgeText,
                                { color: action.color },
                              ]}
                            >
                              {action.label}
                            </Text>
                            <TouchableOpacity
                              style={styles.removeInlineBadgeButton}
                              onPress={removeSelectedAction}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={14} color={Colors.text.secondary} />
                            </TouchableOpacity>
                          </>
                        );
                      })()}
                    </View>
                  )}
                  <TextInput
                    ref={textInputRef}
                    style={[
                      styles.textInput,
                      selectedAction && styles.textInputWithBadge,
                    ]}
                    multiline
                    placeholder="What's happening in your neighborhood?"
                    placeholderTextColor={Colors.text.disabled}
                    value={postText}
                    onChangeText={setPostText}
                    onFocus={handleTextInputFocus}
                    onBlur={handleTextInputBlur}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {selectedImages.length > 0 && (
        <View
          style={[
            styles.selectedImagesFloating,
            {
              bottom: showQuickActions
                ? 372
                : keyboardHeight > 0
                ? keyboardHeight + 72
                : 112,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScrollView}
          >
            {selectedImages.map((imageUri, index) => (
              <View key={index} style={styles.selectedImageWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() =>
                    setSelectedImages((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <X size={16} color={Colors.text.inverse} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View
        style={[
          styles.mediaButtonsContainer,
          {
            bottom: showQuickActions
              ? 300
              : keyboardHeight > 0
              ? keyboardHeight
              : 40,
          },
        ]}
      >
        <View style={styles.mediaButtons}>
          <View style={styles.leftMediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleGalleryPress}
            >
              <Gallery size={20} color={Colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleCameraPress}
            >
              <Camera size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={toggleQuickActions}
          >
            <MoreHorizontal size={20} color={Colors.text.secondary} />
            <Text style={styles.moreButtonText}>
              {showQuickActions ? "Less" : "More"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showQuickActions && (
        <View
          style={[
            styles.quickActionsSection,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <Text style={styles.quickActionsHeader}>Quick Actions</Text>
          <View style={styles.quickActionsList}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              const isSelected = selectedAction === action.id;

              return (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionPill,
                    { backgroundColor: action.bgColor },
                    isSelected && {
                      backgroundColor: action.color,
                    },
                  ]}
                  onPress={() => selectQuickAction(action.id)}
                >
                  <IconComponent
                    size={20}
                    color={isSelected ? Colors.text.inverse : action.color}
                  />
                  <Text
                    style={[
                      styles.quickActionPillText,
                      {
                        color: isSelected ? Colors.text.inverse : action.color,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Check size={24} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                selectedLocation.useCurrentLocation &&
                  styles.locationOptionSelected,
              ]}
              onPress={() =>
                setSelectedLocation({
                  name: user?.locationCity
                    ? `${user.locationCity}, ${user.addressState}`
                    : "Current Location",
                  latitude: user?.latitude,
                  longitude: user?.longitude,
                  useCurrentLocation: true,
                })
              }
            >
              <MapPin
                size={20}
                color={
                  selectedLocation.useCurrentLocation
                    ? Colors.primary[500]
                    : Colors.text.secondary
                }
              />
              <View style={styles.locationOptionText}>
                <Text
                  style={[
                    styles.locationOptionTitle,
                    selectedLocation.useCurrentLocation &&
                      styles.locationOptionTitleSelected,
                  ]}
                >
                  Current Location
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  {user?.locationCity
                    ? `${user.locationCity}, ${user.addressState}`
                    : "Using your current location"}
                </Text>
              </View>
              {selectedLocation.useCurrentLocation && (
                <Check size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                !selectedLocation.useCurrentLocation &&
                  styles.locationOptionSelected,
              ]}
              onPress={() =>
                setSelectedLocation({
                  name: "Custom Location",
                  useCurrentLocation: false,
                })
              }
            >
              <MapPin
                size={20}
                color={
                  !selectedLocation.useCurrentLocation
                    ? Colors.primary[500]
                    : Colors.text.secondary
                }
              />
              <View style={styles.locationOptionText}>
                <Text
                  style={[
                    styles.locationOptionTitle,
                    !selectedLocation.useCurrentLocation &&
                      styles.locationOptionTitleSelected,
                  ]}
                >
                  Custom Location
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  Choose a different location (feature coming soon)
                </Text>
              </View>
              {!selectedLocation.useCurrentLocation && (
                <Check size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Who can see this?</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <Check size={24} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === "public" && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacyLevel("public")}
            >
              <Globe
                size={20}
                color={
                  privacyLevel === "public"
                    ? Colors.primary[500]
                    : Colors.text.secondary
                }
              />
              <View style={styles.privacyOptionText}>
                <Text
                  style={[
                    styles.privacyOptionTitle,
                    privacyLevel === "public" &&
                      styles.privacyOptionTitleSelected,
                  ]}
                >
                  Public
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Anyone can see this post
                </Text>
              </View>
              {privacyLevel === "public" && (
                <Check size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === "neighbors" && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacyLevel("neighbors")}
            >
              <Users
                size={20}
                color={
                  privacyLevel === "neighbors"
                    ? Colors.primary[500]
                    : Colors.text.secondary
                }
              />
              <View style={styles.privacyOptionText}>
                <Text
                  style={[
                    styles.privacyOptionTitle,
                    privacyLevel === "neighbors" &&
                      styles.privacyOptionTitleSelected,
                  ]}
                >
                  Neighbors
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Only people in your neighborhood can see this
                </Text>
              </View>
              {privacyLevel === "neighbors" && (
                <Check size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === "friends" && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacyLevel("friends")}
            >
              <UserCheck
                size={20}
                color={
                  privacyLevel === "friends"
                    ? Colors.primary[500]
                    : Colors.text.secondary
                }
              />
              <View style={styles.privacyOptionText}>
                <Text
                  style={[
                    styles.privacyOptionTitle,
                    privacyLevel === "friends" &&
                      styles.privacyOptionTitleSelected,
                  ]}
                >
                  Friends Only
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Only your friends can see this post
                </Text>
              </View>
              {privacyLevel === "friends" && (
                <Check size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDiscardModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.discardOverlay}>
          <View style={styles.discardModal}>
            <Text style={styles.discardTitle}>Discard post?</Text>
            <Text style={styles.discardMessage}>
              If you go back now, you'll lose your post.
            </Text>

            <View style={styles.discardButtons}>
              <TouchableOpacity
                style={styles.discardButtonSecondary}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.discardButtonSecondaryText}>
                  Keep editing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.discardButtonPrimary}
                onPress={handleDiscardPost}
              >
                <Text style={styles.discardButtonPrimaryText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {postStatus !== "idle" && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <View style={styles.loadingContent}>
            {postStatus === "posting" ? (
              <>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
                <Text style={styles.loadingText}>Posting...</Text>
              </>
            ) : (
              <Animated.View
                style={[
                  styles.successContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <View style={styles.successCircle}>
                  <Check size={32} color={Colors.text.inverse} />
                </View>
                <Text style={styles.successText}>Post Created!</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  postButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  postButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 0.6,
  },
  postButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  contentArea: {
    flex: 1,
  },
  selectedActionBadgeRow: {
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  selectedActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInputContainer: {
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  textInputWithBadge: {
    marginTop: 8,
  },
  selectedActionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginBottom: 4,
  },
  inlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeInlineBadgeButton: {
    marginLeft: 2,
    padding: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeBadgeButton: {
    marginLeft: 4,
    padding: 2,
  },
  mediaButtonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    zIndex: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftMediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  quickActionsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'left',
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 12,
    width: '48%',
    minHeight: 44,
  },
  quickActionPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedImagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectedImagesFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    zIndex: 5,
  },
  imagesScrollView: {
    maxHeight: 100,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  locationOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationOptionTitleSelected: {
    color: Colors.primary[500],
  },
  locationOptionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  privacyOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  privacyOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  privacyOptionTitleSelected: {
    color: Colors.primary[500],
  },
  privacyOptionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginTop: 16,
  },
  discardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  discardModal: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  discardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  discardMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discardButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  discardButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  discardButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.error[600],
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
