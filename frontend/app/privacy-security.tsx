import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../components/UI/Header";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { ErrorHandler } from "../utils/errorHandler";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  locationSharing: "always" | "contacts_only" | "emergency_only" | "never";
  profileVisibility: "public" | "contacts_only" | "private";
  dataRetention: number;
}

export default function PrivacySecurityScreen() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 24,
    locationSharing: "contacts_only",
    profileVisibility: "public",
    dataRetention: 365,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const response = await apiService.getApi().get("/users/security-settings");
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      setSaving(true);
      const updatedSettings = { ...settings, ...newSettings };

      const response = await apiService.getApi().put("/users/security-settings", updatedSettings);
      if (response.data.success) {
        setSettings(updatedSettings);
        Alert.alert("Success", "Security settings updated successfully!");
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Failed to update security settings");
      Alert.alert("Error", "Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/(auth)/change-password");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.prompt(
      "Confirm Deletion",
      "Type 'DELETE' to confirm account deletion:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: (value?: string) => {
            if (value === "DELETE") {
              (async () => {
                try {
                  await apiService.getApi().delete("/users/account");
                  Alert.alert("Account Deleted", "Your account has been deleted successfully.");
                  router.replace("/(auth)/welcome");
                } catch (error) {
                  Alert.alert("Error", "Failed to delete account. Please try again.");
                }
              })();
            } else {
              Alert.alert("Error", "Confirmation text does not match.");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderSetting = (
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    disabled = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.disabledSetting]}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.neutral[200], true: Colors.primary[200] }}
        thumbColor={value ? Colors.primary[500] : Colors.neutral[400]}
        disabled={disabled || saving}
      />
    </View>
  );

  const renderSelectSetting = (
    title: string,
    description: string,
    value: string,
    options: Array<{ key: string; label: string }>,
    onSelect: (key: string) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
        <View style={styles.optionButtons}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.optionButton, value === option.key && styles.selectedOption]}
              onPress={() => onSelect(option.key)}
              disabled={saving}
            >
              <Text style={[styles.optionText, value === option.key && styles.selectedOptionText]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderActionItem = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
    danger = false
  ) => (
    <TouchableOpacity
      style={[styles.actionItem, danger && styles.dangerAction]}
      onPress={onPress}
      disabled={saving}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={danger ? Colors.error[600] : Colors.text.secondary}
        style={styles.actionIcon}
      />
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Privacy & Security" showBackButton onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading settings</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Privacy & Security" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          {renderActionItem(
            "lock-closed",
            "Change Password",
            "Update your account password",
            handleChangePassword
          )}

          {renderSetting(
            "Two-Factor Authentication",
            "Add extra security to your account",
            settings.twoFactorEnabled,
            (value) => updateSettings({ twoFactorEnabled: value }),
            true // Disabled for now (future)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          {renderSelectSetting(
            "Profile Visibility",
            "Who can see your profile information",
            settings.profileVisibility,
            [
              { key: "public", label: "Public" },
              { key: "contacts_only", label: "Contacts Only" },
              { key: "private", label: "Private" },
            ],
            (value) => updateSettings({ profileVisibility: value as any })
          )}

          {renderSelectSetting(
            "Location Sharing",
            "Control when your location is shared",
            settings.locationSharing,
            [
              { key: "always", label: "Always" },
              { key: "contacts_only", label: "Contacts Only" },
              { key: "emergency_only", label: "Emergency Only" },
              { key: "never", label: "Never" },
            ],
            (value) => updateSettings({ locationSharing: value as any })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          {renderSelectSetting(
            "Data Retention",
            "How long we keep your data",
            settings.dataRetention.toString(),
            [
              { key: "30", label: "30 Days" },
              { key: "90", label: "90 Days" },
              { key: "365", label: "1 Year" },
              { key: "0", label: "Forever" },
            ],
            (value) => updateSettings({ dataRetention: parseInt(value) })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          {renderActionItem(
            "trash",
            "Delete Account",
            "Permanently delete your account and all data",
            handleDeleteAccount,
            true
          )}
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledSetting: {
    opacity: 0.6,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  optionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[300],
  },
  optionText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedOptionText: {
    color: Colors.primary[700],
  },
  actionItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerAction: {
    borderColor: Colors.error[200],
    backgroundColor: Colors.error[25],
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  dangerText: {
    color: Colors.error[600],
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  savingOverlay: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: "500",
  },
});
