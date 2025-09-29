import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "../components/UI/Header";
import { Button } from "../components/UI/Button";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { ErrorHandler } from "../utils/errorHandler";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  emergencyAlerts: boolean;
  weatherAlerts: boolean;
  communityUpdates: boolean;
  postReactions: boolean;
  comments: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export default function NotificationSettingsScreen() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    emergencyAlerts: true,
    weatherAlerts: true,
    communityUpdates: true,
    postReactions: true,
    comments: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });

  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotificationPrefs({
        ...notificationPrefs,
        ...user.notificationPreferences,
      });
    }
  }, [user]);

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      await apiService.updateNotificationPreferences(notificationPrefs);

      await refreshProfile();
      Alert.alert("Success", "Notification preferences updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Notification preferences update error");
      Alert.alert("Error", "Failed to update notification preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSwitch = (
    key: keyof NotificationPreferences,
    label: string,
    description: string,
    isEmergency = false
  ) => (
    <View style={styles.switchRow}>
      <View style={styles.switchInfo}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        value={notificationPrefs[key] as boolean}
        onValueChange={(value) => setNotificationPrefs((prev) => ({ ...prev, [key]: value }))}
        trackColor={{
          false: Colors.neutral[300],
          true: isEmergency ? Colors.error[300] : Colors.primary[300],
        }}
        thumbColor={
          notificationPrefs[key]
            ? isEmergency
              ? Colors.error[600]
              : Colors.primary[500]
            : Colors.neutral[500]
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Notification Settings" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Methods</Text>
            <Text style={styles.sectionDescription}>
              Choose how you want to receive notifications
            </Text>
          </View>

          {renderSwitch(
            "pushNotifications",
            "Push Notifications",
            "Receive notifications on your device"
          )}

          {renderSwitch(
            "emailNotifications",
            "Email Notifications",
            "Receive important updates via email"
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alert Types</Text>
            <Text style={styles.sectionDescription}>
              Select which types of alerts you want to receive
            </Text>
          </View>

          {renderSwitch(
            "emergencyAlerts",
            "Emergency Alerts",
            "Critical safety notifications (recommended)",
            true
          )}

          {renderSwitch("weatherAlerts", "Weather Alerts", "Severe weather warnings for your area")}

          {renderSwitch(
            "communityUpdates",
            "Community Updates",
            "Important neighborhood announcements"
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Social Notifications</Text>
            <Text style={styles.sectionDescription}>
              Get notified about interactions with your posts
            </Text>
          </View>

          {renderSwitch(
            "postReactions",
            "Post Reactions",
            "When someone likes or reacts to your posts"
          )}

          {renderSwitch("comments", "Comments", "When someone comments on your posts")}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <Text style={styles.sectionDescription}>
              Reduce notifications during specified hours (emergency alerts will still come through)
            </Text>
          </View>

          {renderSwitch(
            "quietHoursEnabled",
            "Enable Quiet Hours",
            "Silence non-emergency notifications from 10 PM to 7 AM"
          )}

          {notificationPrefs.quietHoursEnabled && (
            <View style={styles.quietHoursInfo}>
              <Text style={styles.quietHoursText}>🌙 Quiet hours: 10:00 PM - 7:00 AM</Text>
              <Text style={styles.quietHoursNote}>
                Emergency alerts will always come through regardless of quiet hours settings.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            Disabling emergency alerts may prevent you from receiving critical safety information.
            We strongly recommend keeping emergency alerts enabled.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.footerButton}
          disabled={loading}
        />
        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSaveNotifications}
          loading={loading}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  quietHoursInfo: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  quietHoursText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 8,
    fontWeight: "500",
  },
  quietHoursNote: {
    fontSize: 12,
    color: Colors.text.disabled,
    lineHeight: 16,
  },
  warningSection: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[200],
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.warning[700],
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning[700],
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerButton: {
    flex: 1,
    height: 48,
  },
});
