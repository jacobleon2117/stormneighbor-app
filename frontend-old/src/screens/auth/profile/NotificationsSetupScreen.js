// File: frontend/src/screens/auth/profile/NotificationsSetupScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Bell, ArrowRight } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const NotificationsSetupScreen = ({
  onNext,
  onBack,
  onComplete,
  initialData = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notificationPreferences: {
      weatherAlerts:
        initialData.weatherAlerts !== undefined
          ? initialData.weatherAlerts
          : true,
      communityPosts:
        initialData.communityPosts !== undefined
          ? initialData.communityPosts
          : true,
      emergencyAlerts:
        initialData.emergencyAlerts !== undefined
          ? initialData.emergencyAlerts
          : true,
    },
  });

  const updateNestedField = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (onComplete) {
        await onComplete(formData);
      } else if (onNext) {
        onNext(formData);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (onComplete) {
        await onComplete({});
      } else if (onNext) {
        onNext({});
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const renderToggleItem = (key, title, subtitle, value) => (
    <TouchableOpacity
      key={key}
      style={[globalStyles.card, styles.toggleCard]}
      onPress={() => updateNestedField("notificationPreferences", key, !value)}
    >
      <View style={[globalStyles.row, globalStyles.alignCenter]}>
        <View style={globalStyles.flex1}>
          <Text style={[globalStyles.body, { fontWeight: "600" }]}>
            {title}
          </Text>
          <Text style={[globalStyles.caption, { marginTop: spacing.xs }]}>
            {subtitle}
          </Text>
        </View>

        <View
          style={[
            styles.toggleContainer,
            value && styles.toggleContainerActive,
          ]}
        >
          <View style={[styles.toggleDot, value && styles.toggleDotActive]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout
      title="Notifications"
      showHeader={true}
      headerActions={[]}
      showDefaultActions={false}
      scrollable={true}
      backgroundColor={colors.background}
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Bell size={32} color={colors.primary} />
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Choose what updates you'd like to receive. You can change these
            anytime in settings
          </Text>
        </View>

        <View style={styles.toggleSection}>
          {renderToggleItem(
            "weatherAlerts",
            "Weather Alerts",
            "Severe weather warnings and updates",
            formData.notificationPreferences.weatherAlerts
          )}

          {renderToggleItem(
            "communityPosts",
            "Community Posts",
            "New posts and updates from neighbors",
            formData.notificationPreferences.communityPosts
          )}

          {renderToggleItem(
            "emergencyAlerts",
            "Emergency Alerts",
            "Critical emergency notifications",
            formData.notificationPreferences.emergencyAlerts
          )}
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "large"),
              loading && globalStyles.buttonDisabled,
            ]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <View style={globalStyles.buttonContent}>
                <Text style={globalStyles.buttonPrimaryText}>
                  Complete Setup
                </Text>
                <ArrowRight size={20} color={colors.text.inverse} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[createButtonStyle("secondary", "large"), styles.skipButton]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={globalStyles.buttonSecondaryText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={[globalStyles.link, { textAlign: "center" }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },

  headerSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  title: {
    ...globalStyles.title,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  subtitle: {
    ...globalStyles.bodySecondary,
    textAlign: "center",
  },

  toggleSection: {
    marginBottom: spacing.xl,
  },

  toggleCard: {
    marginBottom: spacing.lg,
  },

  buttonSection: {
    marginBottom: spacing.xl,
  },

  skipButton: {
    marginTop: spacing.md,
  },

  backButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },

  toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  toggleContainerActive: {
    backgroundColor: colors.primary,
  },

  toggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
});

export default NotificationsSetupScreen;
