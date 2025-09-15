import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, AlertTriangle, Sun, Users, Shield } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { Button } from "../../components/UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  essential?: boolean;
}

export default function NotificationsSetupScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "weather_alerts",
      title: "Weather Alerts",
      description: "Severe weather warnings and emergency notifications",
      icon: AlertTriangle,
      enabled: true,
      essential: true,
    },
    {
      id: "daily_weather",
      title: "Daily Weather Summary",
      description: "Morning weather forecast for your area",
      icon: Sun,
      enabled: true,
    },
    {
      id: "community_updates",
      title: "Community Updates",
      description: "Important updates from your neighbors and local officials",
      icon: Users,
      enabled: true,
    },
    {
      id: "emergency_alerts",
      title: "Emergency Alerts",
      description: "Critical safety information and evacuation notices",
      icon: Shield,
      enabled: true,
      essential: true,
    },
  ]);

  const requestNotificationPermission = async () => {
    try {
      setIsLoading(true);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Notifications Help Keep You Safe",
            "StormNeighbor uses notifications to alert you about severe weather and emergencies. You can always change these settings later.",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "Enable Notifications", onPress: requestNotificationPermission },
            ]
          );
          return;
        }
      }

      setPermissionGranted(true);

      const notificationPreferences = settings.reduce((acc, setting) => {
        acc[setting.id] = {
          enabled: setting.enabled,
          essential: setting.essential || false,
        };
        return acc;
      }, {} as any);

      try {
        await apiService.updateNotificationPreferences(notificationPreferences);
        console.log("Notification preferences saved successfully");
      } catch (error) {
        console.error("Failed to save notification preferences:", error);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      Alert.alert(
        "Error",
        "Failed to set up notifications. You can enable them later in settings."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id && !setting.essential
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleContinue = async () => {
    const notificationPreferences = settings.reduce((acc, setting) => {
      acc[setting.id] = {
        enabled: setting.enabled,
        essential: setting.essential || false,
      };
      return acc;
    }, {} as any);

    try {
      await apiService.updateNotificationPreferences(notificationPreferences);
      console.log("Final notification preferences saved successfully");
    } catch (error) {
      console.error("Failed to save final notification preferences:", error);
    }

    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const renderNotificationSetting = (setting: NotificationSetting) => {
    const IconComponent = setting.icon;

    return (
      <View key={setting.id} style={styles.settingItem}>
        <View style={styles.settingIcon}>
          <IconComponent
            size={20}
            color={setting.essential ? Colors.primary[600] : Colors.text.secondary}
          />
        </View>
        <View style={styles.settingContent}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingTitle}>{setting.title}</Text>
            {setting.essential && (
              <View style={styles.essentialBadge}>
                <Text style={styles.essentialText}>Essential</Text>
              </View>
            )}
          </View>
          <Text style={styles.settingDescription}>{setting.description}</Text>
        </View>
        <Switch
          value={setting.enabled}
          onValueChange={() => toggleSetting(setting.id)}
          trackColor={{ false: Colors.neutral[200], true: Colors.primary[200] }}
          thumbColor={setting.enabled ? Colors.primary[600] : Colors.neutral[400]}
          disabled={setting.essential}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Bell size={48} color={Colors.primary[600]} />
          </View>
          <Text style={styles.title}>Stay Informed & Safe</Text>
          <Text style={styles.subtitle}>
            Choose which notifications you'd like to receive. We'll only send important updates
            about weather and your community.
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {settings.map(renderNotificationSetting)}
        </View>

        {!permissionGranted && (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionInfo}>
              <AlertTriangle size={20} color={Colors.warning[600]} />
              <Text style={styles.permissionText}>
                Notifications are disabled. Enable them to receive important weather alerts and
                safety information.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {permissionGranted ? (
            <Button
              title="Continue to App"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          ) : (
            <>
              <Button
                title="Enable Notifications"
                onPress={requestNotificationPermission}
                loading={isLoading}
                style={styles.enableButton}
              />
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for Now</Text>
              </TouchableOpacity>
            </>
          )}
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  settingsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginRight: 8,
  },
  essentialBadge: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  essentialText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.primary[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  permissionContainer: {
    marginBottom: 24,
  },
  permissionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.warning[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning[100],
  },
  permissionText: {
    fontSize: 14,
    color: Colors.warning[700],
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    paddingTop: 24,
  },
  continueButton: {
    marginBottom: 16,
  },
  enableButton: {
    marginBottom: 16,
  },
  skipButton: {
    alignSelf: "center",
    padding: 8,
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
