import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { 
  ArrowLeft, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Palette,
  Send
} from "lucide-react-native";
import { Colors } from "../constants/Colors";
import { Button } from "../components/UI/Button";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { UserFeedback } from "../types";

const FEEDBACK_TYPES = [
  {
    key: "general_feedback" as const,
    label: "General Feedback",
    description: "Share your overall thoughts about the app",
    icon: MessageSquare,
    color: Colors.primary[500],
  },
  {
    key: "bug_report" as const,
    label: "Bug Report",
    description: "Report something that isn't working correctly",
    icon: Bug,
    color: Colors.error[500],
  },
  {
    key: "feature_request" as const,
    label: "Feature Request",
    description: "Suggest a new feature or improvement",
    icon: Lightbulb,
    color: Colors.warning[500],
  },
  {
    key: "ui_ux_feedback" as const,
    label: "UI/UX Feedback",
    description: "Comments on design, layout, or user experience",
    icon: Palette,
    color: Colors.purple[500],
  },
];

const PRIORITY_OPTIONS = [
  { key: "low" as const, label: "Low", description: "Minor issue or suggestion" },
  { key: "normal" as const, label: "Normal", description: "Standard feedback" },
  { key: "high" as const, label: "High", description: "Important issue or critical feedback" },
];

export default function UserFeedbackScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<UserFeedback["feedbackType"] | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<UserFeedback["priority"]>("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !title.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields and select a feedback type.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        feedbackType: selectedType,
        title: title.trim(),
        description: description.trim(),
        priority: selectedPriority,
        appVersion: "1.0.0",
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
      };

      await apiService.submitUserFeedback(feedbackData);
      
      Alert.alert(
        "Feedback Submitted", 
        "Thank you for your feedback! We'll review it and get back to you if needed.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = FEEDBACK_TYPES.find(type => type.key === selectedType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What type of feedback do you have?</Text>
          <Text style={styles.sectionDescription}>
            Your feedback helps us improve the app for everyone during testing.
          </Text>
          
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    isSelected && styles.typeCardSelected,
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                    <Icon size={24} color={type.color} />
                  </View>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedType && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority Level</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <TouchableOpacity
                    key={priority.key}
                    style={[
                      styles.priorityChip,
                      selectedPriority === priority.key && styles.priorityChipSelected,
                    ]}
                    onPress={() => setSelectedPriority(priority.key)}
                  >
                    <Text style={[
                      styles.priorityChipText,
                      selectedPriority === priority.key && styles.priorityChipTextSelected,
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder={`Brief ${selectedTypeInfo?.label.toLowerCase()} summary`}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionDescription}>
                Please provide detailed information about your feedback. What happened? What did you expect? Any steps to reproduce?
              </Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe your feedback in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                maxLength={1000}
                textAlignVertical="top"
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.characterCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.submitSection}>
              <Button
                title={isSubmitting ? "Submitting..." : "Submit Feedback"}
                onPress={handleSubmit}
                disabled={isSubmitting || !title.trim() || !description.trim()}
                loading={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[25],
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: Colors.primary[700],
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 12,
  },
  priorityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  priorityChipSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  priorityChipTextSelected: {
    color: Colors.primary[700],
  },
  titleInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "right",
    marginTop: 4,
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  submitButton: {
    marginTop: 8,
  },
});