// File path: frontend/src/screens/auth/profile/NotificationsSetupScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Bell, ArrowRight, ArrowLeft } from "lucide-react-native";

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wrapper}>
          {/* Back Button */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.stepContainer}>
              <View style={styles.stepContent}>
                <View style={styles.header}>
                  <Bell size={32} color="#3B82F6" />
                  <Text style={styles.title}>Notifications</Text>
                  <Text style={styles.subtitle}>
                    Choose what updates you'd like to receive
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  <TouchableOpacity
                    style={styles.preferenceItem}
                    onPress={() =>
                      updateNestedField(
                        "notificationPreferences",
                        "weatherAlerts",
                        !formData.notificationPreferences.weatherAlerts
                      )
                    }
                  >
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>Weather Alerts</Text>
                      <Text style={styles.preferenceSubtitle}>
                        Severe weather warnings and updates
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.toggle,
                        formData.notificationPreferences.weatherAlerts
                          ? styles.toggleActive
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleDot,
                          formData.notificationPreferences.weatherAlerts
                            ? styles.toggleDotActive
                            : null,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.preferenceItem}
                    onPress={() =>
                      updateNestedField(
                        "notificationPreferences",
                        "communityPosts",
                        !formData.notificationPreferences.communityPosts
                      )
                    }
                  >
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>
                        Community Posts
                      </Text>
                      <Text style={styles.preferenceSubtitle}>
                        New posts and updates from neighbors
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.toggle,
                        formData.notificationPreferences.communityPosts
                          ? styles.toggleActive
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleDot,
                          formData.notificationPreferences.communityPosts
                            ? styles.toggleDotActive
                            : null,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.preferenceItem}
                    onPress={() =>
                      updateNestedField(
                        "notificationPreferences",
                        "emergencyAlerts",
                        !formData.notificationPreferences.emergencyAlerts
                      )
                    }
                  >
                    <View style={styles.preferenceContent}>
                      <Text style={styles.preferenceTitle}>
                        Emergency Alerts
                      </Text>
                      <Text style={styles.preferenceSubtitle}>
                        Critical emergency notifications
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.toggle,
                        formData.notificationPreferences.emergencyAlerts
                          ? styles.toggleActive
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleDot,
                          formData.notificationPreferences.emergencyAlerts
                            ? styles.toggleDotActive
                            : null,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Navigation */}
            <View style={styles.navigation}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Complete Setup</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  wrapper: {
    flex: 1,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 40,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepContent: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
  formContainer: {
    width: "100%",
    gap: 20,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    marginBottom: 16,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#3B82F6",
  },
  toggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  navigation: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Inter",
  },
});

export default NotificationsSetupScreen;
