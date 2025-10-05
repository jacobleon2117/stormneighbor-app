import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, AlertTriangle, MessageSquare, Cloud } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useErrorHandler, ErrorHandler } from "../../utils/errorHandler";
import { useLoadingState } from "../../utils/loadingStates";

export default function NotificationSetupScreen() {
  const { refreshProfile } = useAuth();
  const errorHandler = useErrorHandler();
  const loadingState = useLoadingState();

  const handleEnableNotifications = async () => {
    loadingState.setLoading(true);

    try {
      const { status } = await Notifications.requestPermissionsAsync();

      const preferences = {
        pushNotifications: status === "granted",
        weatherAlerts: status === "granted",
        communityUpdates: status === "granted",
        emergencyAlerts: status === "granted",
        messageNotifications: status === "granted",
        emailNotifications: false,
        postReactions: false,
        comments: false,
        quietHoursEnabled: false,
      };

      await apiService.updateNotificationPreferences(preferences);

      if (status === "granted") {
        try {
          // Skip push token registration in Expo Go to avoid errors
          // Push notifications enabled, but token registration skipped in development
        } catch (tokenError) {
          ErrorHandler.silent(tokenError as Error, "Get push token");
        }
      }

      await refreshProfile();
      setNotificationsEnabled(status === "granted");

      router.replace("/(tabs)");
    } catch (error) {
      errorHandler.handleError(error, "Notification Setup");
      router.replace("/(tabs)");
    } finally {
      loadingState.setLoading(false);
    }
  };

  const handleSkip = async () => {
    loadingState.setLoading(true);
    try {
      const preferences = {
        pushNotifications: false,
        weatherAlerts: false,
        communityUpdates: false,
        emergencyAlerts: false,
        messageNotifications: false,
        emailNotifications: false,
        postReactions: false,
        comments: false,
        quietHoursEnabled: false,
      };

      await apiService.updateNotificationPreferences(preferences);
      await refreshProfile();
    } catch (error) {
      ErrorHandler.silent(error as Error, "Save notification preferences");
    } finally {
      loadingState.setLoading(false);
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Bell size={64} color={Colors.primary[600]} />
          <Text style={styles.title}>Stay Informed</Text>
          <Text style={styles.subtitle}>Get important alerts and updates from your community</Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <AlertTriangle size={24} color={Colors.warning[600]} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Weather Alerts</Text>
              <Text style={styles.benefitDescription}>Severe weather warnings in your area</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <MessageSquare size={24} color={Colors.primary[600]} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Community Updates</Text>
              <Text style={styles.benefitDescription}>
                Important posts and messages from neighbors
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Cloud size={24} color={Colors.primary[600]} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Emergency Alerts</Text>
              <Text style={styles.benefitDescription}>Critical safety information and updates</Text>
            </View>
          </View>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            You can customize notification settings anytime in your profile
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={loadingState.isLoading ? "Setting up..." : "Enable Notifications"}
            onPress={handleEnableNotifications}
            loading={loadingState.isLoading}
            disabled={loadingState.isLoading}
            style={styles.primaryButton}
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loadingState.isLoading}
          >
            <Text style={styles.skipText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  benefits: {
    marginBottom: 24,
    gap: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  note: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});
