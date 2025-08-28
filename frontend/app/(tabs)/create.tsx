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

  const quickActions = [
    { 
      id: 'announcement', 
      label: 'Announcement', 
      icon: Megaphone, 
      color: Colors.primary[600],
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
      setIsPosting(true);

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
        Alert.alert(
          "Post Created!", 
          "Your post has been shared with the community.",
          [
            {
              text: "OK",
              onPress: () => {
                setPostText('');
                setSelectedAction(null);
                setSelectedImages([]);
                setShowQuickActions(true);
                
                router.replace("/(tabs)");
              }
            }
          ]
        );
      } else {
        throw new Error(response.message || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
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
        return 'safety_alert';
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

  return (
    <View style={styles.container}>
      <Header
        title="Create Post"
        showSearch={false}
        showMessages={false}
        showMore={false}
        showCloseButton={true}
        onClosePress={() => router.back()}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView style={styles.safeContent}>
        <TouchableWithoutFeedback onPress={() => {
          if (isTyping) {
            Keyboard.dismiss();
          }
        }}>
        <View style={styles.content}>
          <View style={styles.topButtonRow}>
            <View style={styles.leftButtons}>
              <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
                <MapPin size={16} color={Colors.text.secondary} />
                <Text style={styles.buttonText} numberOfLines={1}>
                  {selectedLocation.name.length > 12 ? selectedLocation.name.substring(0, 12) + '...' : selectedLocation.name}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.privacyButton} onPress={handlePrivacyPress}>
                {React.createElement(getPrivacyIcon(), { size: 16, color: Colors.text.secondary })}
                <Text style={styles.buttonText}>{getPrivacyLabel()}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.postButton,
                (!postText.trim() || isPosting) && styles.postButtonDisabled
              ]}
              onPress={handleCreatePost}
              disabled={!postText.trim() || isPosting}
            >
              <Text style={[
                styles.postButtonText,
                (!postText.trim() || isPosting) && styles.postButtonTextDisabled
              ]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAction && (
            <View style={styles.selectedActionBadgeRow}>
              <View style={styles.selectedActionBadge}>
                {(() => {
                  const action = quickActions.find(a => a.id === selectedAction);
                  if (!action) return null;
                  const IconComponent = action.icon;
                  return (
                    <>
                      <IconComponent size={14} color={action.color} />
                      <Text style={[styles.badgeText, { color: action.color }]}>
                        {action.label}
                      </Text>
                      <TouchableOpacity 
                        style={styles.removeBadgeButton}
                        onPress={removeSelectedAction}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          <View style={styles.contentArea}>
            <View style={styles.textInputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                multiline
                placeholder="What's happening in your neighborhood?"
                placeholderTextColor={Colors.text.disabled}
                value={postText}
                onChangeText={setPostText}
                onFocus={handleTextInputFocus}
                onBlur={handleTextInputBlur}
              />
            </View>

            {selectedImages.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} style={styles.selectedImageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X size={16} color={Colors.text.inverse} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>


        </View>
        </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <View style={[
        styles.mediaButtonsContainer, 
        { 
          bottom: showQuickActions ? 300 : (keyboardHeight > 0 ? keyboardHeight : 40)
        }
      ]}>
        <View style={styles.mediaButtons}>
          <View style={styles.leftMediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={handleGalleryPress}>
              <Gallery size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton} onPress={handleCameraPress}>
              <Camera size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={toggleQuickActions}
          >
            <MoreHorizontal size={20} color={Colors.text.secondary} />
            <Text style={styles.moreButtonText}>
              {showQuickActions ? 'Less' : 'More'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showQuickActions && (
        <View style={[styles.quickActionsSection, { paddingBottom: insets.bottom + 20 }]}>
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
                    }
                  ]}
                  onPress={() => selectQuickAction(action.id)}
                >
                  <IconComponent 
                    size={20} 
                    color={isSelected ? Colors.text.inverse : action.color} 
                  />
                  <Text style={[
                    styles.quickActionPillText, 
                    { color: isSelected ? Colors.text.inverse : action.color }
                  ]}>
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
              <Check size={24} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                selectedLocation.useCurrentLocation && styles.locationOptionSelected
              ]}
              onPress={() => setSelectedLocation({
                name: user?.locationCity ? `${user.locationCity}, ${user.addressState}` : "Current Location",
                latitude: user?.latitude,
                longitude: user?.longitude,
                useCurrentLocation: true
              })}
            >
              <MapPin size={20} color={selectedLocation.useCurrentLocation ? Colors.primary[600] : Colors.text.secondary} />
              <View style={styles.locationOptionText}>
                <Text style={[
                  styles.locationOptionTitle,
                  selectedLocation.useCurrentLocation && styles.locationOptionTitleSelected
                ]}>
                  Current Location
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  {user?.locationCity ? `${user.locationCity}, ${user.addressState}` : "Using your current location"}
                </Text>
              </View>
              {selectedLocation.useCurrentLocation && (
                <Check size={20} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                !selectedLocation.useCurrentLocation && styles.locationOptionSelected
              ]}
              onPress={() => setSelectedLocation({
                name: "Custom Location",
                useCurrentLocation: false
              })}
            >
              <MapPin size={20} color={!selectedLocation.useCurrentLocation ? Colors.primary[600] : Colors.text.secondary} />
              <View style={styles.locationOptionText}>
                <Text style={[
                  styles.locationOptionTitle,
                  !selectedLocation.useCurrentLocation && styles.locationOptionTitleSelected
                ]}>
                  Custom Location
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  Choose a different location (feature coming soon)
                </Text>
              </View>
              {!selectedLocation.useCurrentLocation && (
                <Check size={20} color={Colors.primary[600]} />
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
              <Check size={24} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === 'public' && styles.privacyOptionSelected
              ]}
              onPress={() => setPrivacyLevel('public')}
            >
              <Globe size={20} color={privacyLevel === 'public' ? Colors.primary[600] : Colors.text.secondary} />
              <View style={styles.privacyOptionText}>
                <Text style={[
                  styles.privacyOptionTitle,
                  privacyLevel === 'public' && styles.privacyOptionTitleSelected
                ]}>
                  Public
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Anyone can see this post
                </Text>
              </View>
              {privacyLevel === 'public' && (
                <Check size={20} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === 'neighbors' && styles.privacyOptionSelected
              ]}
              onPress={() => setPrivacyLevel('neighbors')}
            >
              <Users size={20} color={privacyLevel === 'neighbors' ? Colors.primary[600] : Colors.text.secondary} />
              <View style={styles.privacyOptionText}>
                <Text style={[
                  styles.privacyOptionTitle,
                  privacyLevel === 'neighbors' && styles.privacyOptionTitleSelected
                ]}>
                  Neighbors
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Only people in your neighborhood can see this
                </Text>
              </View>
              {privacyLevel === 'neighbors' && (
                <Check size={20} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === 'friends' && styles.privacyOptionSelected
              ]}
              onPress={() => setPrivacyLevel('friends')}
            >
              <UserCheck size={20} color={privacyLevel === 'friends' ? Colors.primary[600] : Colors.text.secondary} />
              <View style={styles.privacyOptionText}>
                <Text style={[
                  styles.privacyOptionTitle,
                  privacyLevel === 'friends' && styles.privacyOptionTitleSelected
                ]}>
                  Friends Only
                </Text>
                <Text style={styles.privacyOptionSubtitle}>
                  Only your friends can see this post
                </Text>
              </View>
              {privacyLevel === 'friends' && (
                <Check size={20} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: Colors.primary[600],
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    borderTopWidth: 1,
    borderColor: Colors.border,
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
    marginTop: 12,
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
    top: -8,
    right: -8,
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
    color: Colors.primary[600],
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
    color: Colors.primary[600],
  },
  privacyOptionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
