import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Save, X, Image as ImageIcon, AlertTriangle, HelpCircle } from "lucide-react-native";
import { Header } from "../../../components/UI/Header";
import { Colors } from "../../../constants/Colors";
import { apiService } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { Post } from "../../../types";

const POST_TYPES = [
  { key: "general", label: "General", icon: HelpCircle },
  { key: "help_request", label: "Help Request", icon: HelpCircle },
  { key: "help_offer", label: "Help Offer", icon: HelpCircle },
  { key: "safety_alert", label: "Safety Alert", icon: AlertTriangle },
  { key: "lost_found", label: "Lost & Found", icon: HelpCircle },
];

const PRIORITIES = [
  { key: "low", label: "Low", color: Colors.neutral[500] },
  { key: "normal", label: "Normal", color: Colors.primary[500] },
  { key: "high", label: "High", color: Colors.warning[500] },
  { key: "urgent", label: "Urgent", color: Colors.error[500] },
];

export default function EditPostScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const postId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [isEmergency, setIsEmergency] = useState(false);
  const [tags, setTags] = useState("");

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPost(postId);

      if (response.success && response.data) {
        const postData = response.data;
        setPost(postData);
        setTitle(postData.title || "");
        setContent(postData.content || "");
        setPostType(postData.postType || "general");
        setPriority(postData.priority || "normal");
        setIsEmergency(postData.isEmergency || false);
        setTags((postData.tags || []).join(", "));
      } else {
        throw new Error("Post not found");
      }
    } catch (error: any) {
      console.error("Error loading post:", error);
      Alert.alert("Error", "Failed to load post data. Please try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter some content for your post.");
      return;
    }

    if (!user || user.id !== post?.userId) {
      Alert.alert("Error", "You can only edit your own posts.");
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        title: title.trim() || undefined,
        content: content.trim(),
        postType,
        priority,
        isEmergency,
        tags: tags.trim()
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      // TODO: Replace with actual API call when backend implements post editing
      // const response = await apiService.updatePost(postId, updateData);

      // Mock success for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Your post has been updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const hasUnsavedChanges = () => {
    if (!post) return false;

    return (
      title !== (post.title || "") ||
      content !== (post.content || "") ||
      postType !== (post.postType || "general") ||
      priority !== (post.priority || "normal") ||
      isEmergency !== (post.isEmergency || false) ||
      tags !== (post.tags || []).join(", ")
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Edit Post" showBackButton={true} onBackPress={handleCancel} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Header title="Edit Post" showBackButton={true} onBackPress={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorMessage}>
            The post you're trying to edit could not be found.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header
        title="Edit Post"
        showBackButton={true}
        onBackPress={handleCancel}
        rightComponent={
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving || !content.trim()}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <Save size={20} color={Colors.text.inverse} />
            )}
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title (Optional)</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Add a title to your post..."
            placeholderTextColor={Colors.text.disabled}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Content *</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="What's happening in your neighborhood?"
            placeholderTextColor={Colors.text.disabled}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{content.length}/2000</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Post Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScrollView}
          >
            {POST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeButton, postType === type.key && styles.selectedTypeButton]}
                onPress={() => setPostType(type.key)}
              >
                <type.icon
                  size={16}
                  color={postType === type.key ? Colors.text.inverse : Colors.text.secondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    postType === type.key && styles.selectedTypeButtonText,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((priorityOption) => (
              <TouchableOpacity
                key={priorityOption.key}
                style={[
                  styles.priorityButton,
                  priority === priorityOption.key && {
                    backgroundColor: priorityOption.color + "20",
                    borderColor: priorityOption.color,
                  },
                ]}
                onPress={() => setPriority(priorityOption.key)}
              >
                <View style={[styles.priorityDot, { backgroundColor: priorityOption.color }]} />
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === priorityOption.key && { color: priorityOption.color },
                  ]}
                >
                  {priorityOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.emergencyToggle}
            onPress={() => setIsEmergency(!isEmergency)}
          >
            <View style={styles.emergencyToggleLeft}>
              <AlertTriangle
                size={20}
                color={isEmergency ? Colors.error[500] : Colors.text.secondary}
              />
              <View>
                <Text style={styles.emergencyToggleTitle}>Emergency Alert</Text>
                <Text style={styles.emergencyToggleSubtitle}>
                  Mark as urgent safety information
                </Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, isEmergency && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, isEmergency && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tags</Text>
          <TextInput
            style={styles.tagsInput}
            placeholder="Add tags separated by commas (e.g., safety, weather, help)"
            placeholderTextColor={Colors.text.disabled}
            value={tags}
            onChangeText={setTags}
            maxLength={200}
          />
          <Text style={styles.helperText}>Tags help others find your post more easily</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "right",
    marginTop: 4,
  },
  typeScrollView: {
    flexGrow: 0,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  selectedTypeButton: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  selectedTypeButtonText: {
    color: Colors.text.inverse,
  },
  priorityContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  emergencyToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emergencyToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  emergencyToggleTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  emergencyToggleSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    backgroundColor: Colors.neutral[200],
    borderRadius: 15,
    justifyContent: "center",
    position: "relative",
  },
  toggleSwitchActive: {
    backgroundColor: Colors.error[500],
  },
  toggleKnob: {
    width: 26,
    height: 26,
    backgroundColor: Colors.background,
    borderRadius: 13,
    position: "absolute",
    left: 2,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    left: 22,
  },
  tagsInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.disabled,
    marginTop: 4,
    lineHeight: 16,
  },
});
