import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, AlertTriangle, Shield, Users, Megaphone } from "lucide-react-native";
import { Colors } from "../constants/Colors";
import { Button } from "../components/UI/Button";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { ErrorHandler } from "../utils/errorHandler";

const ALERT_TYPES = [
  {
    key: "community_alert",
    label: "Community Alert",
    description: "General community announcements and updates",
    icon: Users,
    color: Colors.primary[500],
  },
  {
    key: "safety_alert",
    label: "Safety Alert",
    description: "Safety concerns and warnings for neighbors",
    icon: Shield,
    color: Colors.warning[500],
  },
  {
    key: "emergency",
    label: "Emergency Alert",
    description: "Urgent emergency situations requiring immediate attention",
    icon: AlertTriangle,
    color: Colors.error[500],
  },
  {
    key: "announcement",
    label: "Announcement",
    description: "Important community announcements and events",
    icon: Megaphone,
    color: Colors.purple[500],
  },
];

const SEVERITY_LEVELS = [
  { key: "LOW", label: "Low", description: "Informational" },
  { key: "MODERATE", label: "Moderate", description: "Important to know" },
  { key: "HIGH", label: "High", description: "Urgent attention needed" },
  { key: "CRITICAL", label: "Critical", description: "Immediate action required" },
];

export default function CreateAlertScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("MODERATE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !title.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create alerts.");
      return;
    }

    setIsSubmitting(true);
    try {
      const alertData = {
        title: title.trim(),
        description: description.trim(),
        severity: selectedSeverity as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
        alertType: selectedType,
        metadata: {
          areaDesc:
            user.homeCity && user.homeState
              ? `${user.homeCity}, ${user.homeState}`
              : user.locationCity && user.addressState
                ? `${user.locationCity}, ${user.addressState}`
                : "Location not specified",
        },
      };

      const response = await apiService.createAlert(alertData);

      if (response.success) {
        Alert.alert(
          "Alert Created",
          "Your alert has been created and will be visible to your community.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.message || "Failed to create alert");
      }
    } catch (error: any) {
      ErrorHandler.silent(error as Error, "Failed to create alert");
      ErrorHandler.silent(
        new Error(`API Error: ${JSON.stringify(error.response?.data || error.message)}`),
        "Alert creation API error details"
      );

      let errorMessage = "Failed to create alert. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Please check your alert information and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Please sign in again to create alerts.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Alert</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Type</Text>
          <Text style={styles.sectionDescription}>
            Choose the type of alert that best describes your situation.
          </Text>

          <View style={styles.typeGrid}>
            {ALERT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + "20" }]}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityRow}>
            {SEVERITY_LEVELS.map((severity) => (
              <TouchableOpacity
                key={severity.key}
                style={[
                  styles.severityChip,
                  selectedSeverity === severity.key && styles.severityChipSelected,
                ]}
                onPress={() => setSelectedSeverity(severity.key)}
              >
                <Text
                  style={[
                    styles.severityChipText,
                    selectedSeverity === severity.key && styles.severityChipTextSelected,
                  ]}
                >
                  {severity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Title *</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Brief, clear title for your alert"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            placeholderTextColor={Colors.text.disabled}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <Text style={styles.sectionDescription}>
            Provide detailed information about the alert. What happened? What should neighbors know
            or do?
          </Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the situation in detail..."
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
            title={isSubmitting ? "Creating Alert..." : "Create Alert"}
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedType || !title.trim() || !description.trim()}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
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
    flex: 1,
    textAlign: "center",
    marginRight: 40,
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
  severityRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  severityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  severityChipSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  severityChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  severityChipTextSelected: {
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
