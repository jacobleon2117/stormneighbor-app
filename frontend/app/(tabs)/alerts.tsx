import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert as RNAlert,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { Alert as WeatherAlert, Post } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/UI/Button";
import { Header } from "../../components/UI/Header";

interface EmergencyTemplate {
  id: string;
  title: string;
  content: string;
  postType: string;
  priority: string;
  isEmergency: boolean;
  icon: string;
  color: string;
}

const EMERGENCY_TEMPLATES: EmergencyTemplate[] = [
  {
    id: "1",
    title: "Medical Emergency",
    content:
      "Medical emergency in progress. Please avoid the area and call 911 if you see anyone in need of assistance.",
    postType: "safety_alert",
    priority: "urgent",
    isEmergency: true,
    icon: "medical",
    color: Colors.error[600],
  },
  {
    id: "2",
    title: "Fire Alert",
    content:
      "Fire reported in the area. Please evacuate safely and stay clear of emergency vehicles.",
    postType: "safety_alert",
    priority: "urgent",
    isEmergency: true,
    icon: "flame",
    color: Colors.error[600],
  },
  {
    id: "3",
    title: "Severe Weather Warning",
    content:
      "Severe weather conditions expected. Please take shelter and avoid unnecessary travel.",
    postType: "safety_alert",
    priority: "high",
    isEmergency: true,
    icon: "thunderstorm",
    color: Colors.warning[600],
  },
  {
    id: "4",
    title: "Power Outage",
    content:
      "Power outage affecting the area. Check on neighbors who may need assistance.",
    postType: "general",
    priority: "high",
    isEmergency: false,
    icon: "flash-off",
    color: Colors.warning[600],
  },
  {
    id: "5",
    title: "Road Closure",
    content:
      "Road closure due to emergency situation. Please use alternate routes.",
    postType: "safety_alert",
    priority: "normal",
    isEmergency: false,
    icon: "car",
    color: Colors.primary[600],
  },
  {
    id: "6",
    title: "Missing Person",
    content:
      "Please help locate a missing community member. Contact local authorities if you have any information.",
    postType: "lost_found",
    priority: "high",
    isEmergency: false,
    icon: "people",
    color: Colors.warning[600],
  },
];

export default function AlertsScreen() {
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlert[]>([]);
  const [communityAlerts, setCommunityAlerts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmergencyTemplate | null>(null);
  const [customAlert, setCustomAlert] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);

        let weatherAlertsPromise;
        if (user?.locationCity && user?.addressState) {
          weatherAlertsPromise = apiService.getAlerts({
            city: user.locationCity,
            state: user.addressState,
          });
        } else if (user?.latitude && user?.longitude) {
          weatherAlertsPromise = apiService.getAlerts({
            latitude: user.latitude,
            longitude: user.longitude,
          });
        } else {
          weatherAlertsPromise = Promise.resolve({
            success: true,
            data: { alerts: [] },
          });
        }

        const communityAlertsPromise = apiService.getPosts({
          page: 1,
          limit: 10,
          postType: "safety_alert",
        });

        const [weatherResponse, communityResponse] = await Promise.all([
          weatherAlertsPromise,
          communityAlertsPromise,
        ]);

        if (weatherResponse.success && weatherResponse.data) {
          const alerts = weatherResponse.data.alerts || weatherResponse.data;
          setActiveAlerts(
            alerts.filter((alert: WeatherAlert) => alert.isActive)
          );
        }

        if (communityResponse.success && communityResponse.data) {
          const posts = communityResponse.data.posts || communityResponse.data;
          const recentPosts = posts.filter((post: Post) => {
            const postDate = new Date(post.createdAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return (
              postDate > oneDayAgo &&
              (post.isEmergency || post.priority === "urgent")
            );
          });
          setCommunityAlerts(recentPosts);
        }
      } catch (error: any) {
        console.error("Error fetching alerts:", error);
        if (!isRefresh) {
          RNAlert.alert(
            "Error",
            "Failed to load alerts. Please check your connection and try again."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts(true);
  }, [fetchAlerts]);

  const handleSearchPress = () => {
    router.push("/(tabs)/search");
  };

  const handleMessagesPress = () => {
    router.push("/(tabs)/notifications");
  };

  const handleMorePress = () => {
    router.push("/(tabs)/profile");
  };

  const handleCreateAlert = async (template?: EmergencyTemplate) => {
    try {
      setCreating(true);

      const alertData = template
        ? {
            title: template.title,
            content: template.content,
            postType: template.postType,
            priority: template.priority,
            isEmergency: template.isEmergency,
            images: [],
            tags: ["emergency", "alert"],
          }
        : {
            title: customAlert.title,
            content: customAlert.content,
            postType: "safety_alert",
            priority: "high",
            isEmergency: true,
            images: [],
            tags: ["emergency", "custom"],
          };

      const response = await apiService.createPost(alertData);

      if (response.success) {
        setShowCreateModal(false);
        setSelectedTemplate(null);
        setCustomAlert({ title: "", content: "" });
        RNAlert.alert(
          "Alert Created",
          "Your emergency alert has been shared with the community.",
          [
            {
              text: "OK",
              onPress: () => {
                fetchAlerts(true);
                router.push("/(tabs)");
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating alert:", error);
      RNAlert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create alert. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return Colors.error[600];
      case "HIGH":
        return Colors.warning[600];
      case "MODERATE":
        return Colors.primary[600];
      case "LOW":
        return Colors.neutral[500];
      default:
        return Colors.neutral[500];
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "warning";
      case "HIGH":
        return "alert";
      case "MODERATE":
        return "information-circle";
      case "LOW":
        return "notifications";
      default:
        return "notifications";
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - alertDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return alertDate.toLocaleDateString();
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const renderWeatherAlert = ({ item }: { item: WeatherAlert }) => (
    <View
      style={[
        styles.alertCard,
        { borderLeftColor: getAlertColor(item.severity) },
      ]}
    >
      <View style={styles.alertHeader}>
        <Ionicons
          name={getAlertIcon(item.severity) as any}
          size={20}
          color={getAlertColor(item.severity)}
        />
        <Text
          style={[
            styles.alertSeverity,
            { color: getAlertColor(item.severity) },
          ]}
        >
          {item.severity} WEATHER ALERT
        </Text>
      </View>
      <Text style={styles.alertTitle}>{item.title}</Text>
      <Text style={styles.alertDescription} numberOfLines={3}>
        {item.description}
      </Text>
      {item.endTime && (
        <Text style={styles.alertTime}>
          Until {new Date(item.endTime).toLocaleDateString()} at{" "}
          {new Date(item.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </View>
  );

  const renderCommunityAlert = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.alertCard, { borderLeftColor: Colors.error[600] }]}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <View style={styles.alertHeader}>
        <Ionicons name="warning" size={20} color={Colors.error[600]} />
        <Text style={[styles.alertSeverity, { color: Colors.error[600] }]}>
          {item.isEmergency ? "EMERGENCY" : "COMMUNITY ALERT"}
        </Text>
        <Text style={styles.alertTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
      <Text style={styles.alertTitle}>{item.title || "Community Alert"}</Text>
      <Text style={styles.alertDescription} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.alertFooter}>
        <Text style={styles.alertAuthor}>
          By {item.firstName} {item.lastName}
        </Text>
        {item.locationCity && (
          <Text style={styles.alertLocation}>
            {item.locationCity}, {item.locationState}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmergencyTemplate = ({ item }: { item: EmergencyTemplate }) => (
    <TouchableOpacity
      style={[styles.templateCard, { borderColor: item.color }]}
      onPress={() => {
        RNAlert.alert(
          "Create Emergency Alert",
          `Create an alert for: ${item.title}`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create",
              style: "default",
              onPress: () => handleCreateAlert(item),
            },
          ]
        );
      }}
    >
      <Ionicons name={item.icon as any} size={32} color={item.color} />
      <Text style={styles.templateTitle}>{item.title}</Text>
      <Text style={styles.templateDescription} numberOfLines={2}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Alerts"
        onSearchPress={handleSearchPress}
        onMessagesPress={handleMessagesPress}
        onMorePress={handleMorePress}
      />

      <SafeAreaView style={styles.safeContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[600]]}
              tintColor={Colors.primary[600]}
            />
          }
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Emergency Actions</Text>
            </View>

            <View style={styles.emergencyActions}>
              <TouchableOpacity
                style={[
                  styles.emergencyButton,
                  { backgroundColor: Colors.error[600] },
                ]}
                onPress={() =>
                  RNAlert.alert(
                    "Emergency",
                    "In a life-threatening emergency, call 911 immediately!"
                  )
                }
              >
                <Ionicons name="call" size={24} color={Colors.text.inverse} />
                <Text style={styles.emergencyButtonText}>Call 911</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.emergencyButton,
                  { backgroundColor: Colors.warning[600] },
                ]}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons
                  name="warning"
                  size={24}
                  color={Colors.text.inverse}
                />
                <Text style={styles.emergencyButtonText}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeAlerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weather Alerts</Text>
              <FlatList
                data={activeAlerts}
                renderItem={renderWeatherAlert}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {communityAlerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Community Alerts</Text>
              <FlatList
                data={communityAlerts}
                renderItem={renderCommunityAlert}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {activeAlerts.length === 0 && communityAlerts.length === 0 && (
            <View style={styles.noAlertsContainer}>
              <Ionicons
                name="shield-checkmark"
                size={64}
                color={Colors.success[600]}
              />
              <Text style={styles.noAlertsTitle}>No Active Alerts</Text>
              <Text style={styles.noAlertsMessage}>
                Your community is safe. We'll notify you immediately if any
                alerts are issued.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Templates</Text>
            <Text style={styles.sectionSubtitle}>
              Quick templates for common emergency situations
            </Text>
            <FlatList
              data={EMERGENCY_TEMPLATES}
              renderItem={renderEmergencyTemplate}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.templateRow}
            />
          </View>
        </ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Custom Alert</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Create a custom emergency alert for your community. This will be
                sent as a high-priority notification.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alert Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={customAlert.title}
                  onChangeText={(title) =>
                    setCustomAlert((prev) => ({ ...prev, title }))
                  }
                  placeholder="Enter alert title..."
                  placeholderTextColor={Colors.text.disabled}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alert Details</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={customAlert.content}
                  onChangeText={(content) =>
                    setCustomAlert((prev) => ({ ...prev, content }))
                  }
                  placeholder="Describe the emergency situation..."
                  placeholderTextColor={Colors.text.disabled}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowCreateModal(false)}
                  variant="outline"
                  size="large"
                  style={styles.modalButton}
                />
                <Button
                  title="Create Alert"
                  onPress={() => handleCreateAlert()}
                  loading={creating}
                  disabled={
                    !customAlert.title.trim() || !customAlert.content.trim()
                  }
                  size="large"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  emergencyActions: {
    flexDirection: "row",
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  alertCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: "italic",
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  alertAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  alertLocation: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  templateRow: {
    justifyContent: "space-between",
  },
  templateCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    width: "48%",
    borderWidth: 1,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  templateDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
  noAlertsContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noAlertsMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
    paddingHorizontal: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  modalButton: {
    flex: 1,
  },
});
