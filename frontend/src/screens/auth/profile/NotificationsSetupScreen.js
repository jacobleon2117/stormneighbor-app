// File: frontend/src/screens/auth/profile/NotificationsSetupScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Bell, ArrowRight } from "lucide-react-native";

import AuthLayout, { AuthHeader, AuthButtons } from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

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

  const renderToggleItem = (key, title, subtitle, value) => (
    <TouchableOpacity
      key={key}
      style={[authStyles.card, authStyles.marginBottom16]}
      onPress={() => updateNestedField("notificationPreferences", key, !value)}
    >
      <View style={[authStyles.row, authStyles.alignCenter]}>
        <View style={authStyles.flex1}>
          <Text style={[authStyles.bodyText, { fontWeight: "600" }]}>
            {title}
          </Text>
          <Text style={[authStyles.smallText, authStyles.marginTop8]}>
            {subtitle}
          </Text>
        </View>

        {/* Custom Toggle */}
        <View
          style={[
            toggleStyles.container,
            value && toggleStyles.containerActive,
          ]}
        >
          <View style={[toggleStyles.dot, value && toggleStyles.dotActive]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<Bell size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Notifications</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            Choose what updates you'd like to receive. You can change these
            anytime in settings
          </Text>
        }
      />

      {/* Notification Preferences */}
      <View style={authStyles.marginBottom24}>
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

      {/* Complete Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <Text style={authStyles.primaryButtonText}>Complete Setup</Text>
              <ArrowRight size={20} color={colors.text.inverse} />
            </View>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={authStyles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </AuthButtons>
    </AuthLayout>
  );
};

// Custom toggle styles
const toggleStyles = {
  container: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  containerActive: {
    backgroundColor: colors.primary,
  },
  dot: {
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
  dotActive: {
    transform: [{ translateX: 20 }],
  },
};

export default NotificationsSetupScreen;
