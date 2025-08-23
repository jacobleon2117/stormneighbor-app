import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Video,
  MoreHorizontal,
  Megaphone,
  Calendar,
  AlertTriangle,
  CloudRain,
  HelpCircle,
  HandHeart,
  Globe,
  MapPin,
  AtSign,
} from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { POST_TYPES, PRIORITIES, CreatePostForm, PostType, Priority, POST_TYPE_OPTIONS, PRIORITY_OPTIONS } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/UI/Input";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
  borderColor: string;
  postType: string;
  priority: string;
}
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "announcement",
    label: "Announcement",
    icon: Megaphone,
    color: Colors.primary[600],
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    postType: POST_TYPES.GENERAL,
    priority: PRIORITIES.NORMAL,
  },
  {
    id: "event",
    label: "Create Event",
    icon: Calendar,
    color: Colors.primary[600],
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    postType: POST_TYPES.GENERAL,
    priority: PRIORITIES.NORMAL,
  },
  {
    id: "safety",
    label: "Safety Alert",
    icon: AlertTriangle,
    color: Colors.error[600],
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[600],
    postType: POST_TYPES.SAFETY_ALERT,
    priority: PRIORITIES.HIGH,
  },
  {
    id: "weather",
    label: "Weather Alert",
    icon: CloudRain,
    color: Colors.primary[600],
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    postType: POST_TYPES.SAFETY_ALERT,
    priority: PRIORITIES.HIGH,
  },
  {
    id: "question",
    label: "Ask Question",
    icon: HelpCircle,
    color: Colors.success[600],
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[100],
    postType: POST_TYPES.HELP_REQUEST,
    priority: PRIORITIES.NORMAL,
  },
  {
    id: "help",
    label: "Offer Help",
    icon: HandHeart,
    color: Colors.warning[600],
    backgroundColor: Colors.warning[50],
    borderColor: Colors.warning[100],
    postType: POST_TYPES.HELP_OFFER,
    priority: PRIORITIES.NORMAL,
  },
];

export default function CreateScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState<CreatePostForm>({
    title: "",
    content: "",
    postType: POST_TYPES.GENERAL,
    priority: PRIORITIES.NORMAL,
    isEmergency: false,
    images: [],
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (form.content.length > 2000) {
      newErrors.content = "Content must be less than 2000 characters";
    }

    if (form.title && form.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePost = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...form,
        title: form.title || undefined,
        images: selectedImages,
      };

      const response = await apiService.createPost(postData);

      if (response.success) {
        Alert.alert("Success", "Your post has been created!", [
          {
            text: "OK",
            onPress: () => {
              setForm({
                title: "",
                content: "",
                postType: POST_TYPES.GENERAL,
                priority: PRIORITIES.NORMAL,
                isEmergency: false,
                images: [],
                tags: [],
              });
              setSelectedImages([]);
              setTagInput("");
              router.push("/(tabs)");
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to your photos to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedImages.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets
          .map((asset) => asset.uri)
          .slice(0, 5 - selectedImages.length);
        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (selectedImages.length < 5) {
          setSelectedImages((prev) => [...prev, result.assets[0].uri]);
        } else {
          Alert.alert(
            "Limit Reached",
            "You can only add up to 5 images per post."
          );
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && form.tags.length < 10) {
      const newTag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(newTag)) {
        setForm((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const selectPostType = (postType: string) => {
    setForm((prev) => ({
      ...prev,
      postType: postType as CreatePostForm["postType"],
    }));
  };

  const selectPriority = (priority: string) => {
    setForm((prev) => ({
      ...prev,
      priority: priority as CreatePostForm["priority"],
    }));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create Post"
        showSearch={false}
        showMessages={false}
        showMore={false}
      />
      <SafeAreaView style={styles.safeContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <View style={styles.postTypeGrid}>
              {[
                { key: "help_request", label: "Help Request", description: "Ask neighbors for help" },
                { key: "help_offer", label: "Help Offer", description: "Offer help to neighbors" },
                { key: "lost_found", label: "Lost & Found", description: "Lost or found items" },
                { key: "safety_alert", label: "Safety Alert", description: "Safety concerns or alerts" },
                { key: "general", label: "General", description: "General community posts" },
              ].map((option) => {
                const isSelected = form.postType === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.postTypeCard,
                      isSelected && styles.postTypeCardSelected,
                    ]}
                    onPress={() => selectPostType(option.key)}
                  >
                    <Text
                      style={[
                        styles.postTypeLabel,
                        isSelected && styles.postTypeLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.postTypeDescription,
                        isSelected && styles.postTypeDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Input
              label="Title (Optional)"
              value={form.title}
              onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
              placeholder="Enter a title for your post..."
              error={errors.title}
              maxLength={200}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content *</Text>
            <TextInput
              style={[styles.contentInput, errors.content && styles.inputError]}
              value={form.content}
              onChangeText={(content) =>
                setForm((prev) => ({ ...prev, content }))
              }
              placeholder="What's happening in your neighborhood?"
              placeholderTextColor={Colors.text.disabled}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>
              {form.content.length}/2000
            </Text>
            {errors.content && (
              <Text style={styles.errorText}>{errors.content}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.priorityRow}>
              {[
                { key: "low", label: "Low", color: Colors.success[500] },
                { key: "normal", label: "Normal", color: Colors.neutral[500] },
                { key: "high", label: "High", color: Colors.warning[500] },
                { key: "urgent", label: "Urgent", color: Colors.error[500] },
              ].map((option) => {
                const isSelected = form.priority === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.priorityOption,
                      isSelected && {
                        borderColor: option.color,
                        backgroundColor: `${option.color}15`,
                      },
                    ]}
                    onPress={() => selectPriority(option.key)}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: option.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        isSelected && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.emergencyToggle}
              onPress={() =>
                setForm((prev) => ({ ...prev, isEmergency: !prev.isEmergency }))
              }
            >
              <View
                style={[
                  styles.checkbox,
                  form.isEmergency && styles.checkboxChecked,
                ]}
              >
                {form.isEmergency && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyLabel}>This is an emergency</Text>
                <Text style={styles.emergencyDescription}>
                  Emergency posts are prioritized and sent as push notifications
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Images ({selectedImages.length}/5)
            </Text>
            <View style={styles.imageActions}>
              <Button
                title="Take Photo"
                onPress={takePhoto}
                variant="outline"
                size="small"
                style={styles.imageButton}
              />
              <Button
                title="Choose Photos"
                onPress={pickImage}
                variant="outline"
                size="small"
                style={styles.imageButton}
              />
            </View>
            {selectedImages.length > 0 && (
              <View style={styles.imagePreview}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tags ({form.tags.length}/10)
            </Text>
            <View style={styles.tagInput}>
              <TextInput
                style={styles.tagInputField}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={Colors.text.disabled}
                onSubmitEditing={addTag}
                maxLength={30}
              />
              <Button
                title="Add"
                onPress={addTag}
                size="small"
                disabled={!tagInput.trim() || form.tags.length >= 10}
              />
            </View>
            {form.tags.length > 0 && (
              <View style={styles.tagContainer}>
                {form.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Text style={styles.tagRemove}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              size="large"
              style={styles.actionButton}
            />
            <Button
              title="Create Post"
              onPress={handleCreatePost}
              loading={loading}
              disabled={!form.content.trim()}
              size="large"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  postTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  postTypeCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.background,
  },
  postTypeCardSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  postTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  postTypeLabelSelected: {
    color: Colors.primary[700],
  },
  postTypeDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  postTypeDescriptionSelected: {
    color: Colors.primary[600],
  },
  contentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 120,
  },
  inputError: {
    borderColor: Colors.error[600],
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "right",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error[600],
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  emergencyToggle: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: Colors.background,
  },
  checkboxChecked: {
    backgroundColor: Colors.emergency[600],
    borderColor: Colors.emergency[600],
  },
  checkmark: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: "bold",
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  emergencyDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  imageActions: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  imagePreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: "relative",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error[600],
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: "bold",
  },
  tagInput: {
    flexDirection: "row",
    gap: 8,
  },
  tagInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary[100],
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary[700],
    fontWeight: "500",
  },
  tagRemove: {
    fontSize: 10,
    color: Colors.primary[600],
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
  },
});
