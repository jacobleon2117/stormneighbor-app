import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert as AlertDialog,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Users,
  Megaphone,
  Calendar,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { ALERT_COLORS, getAlertColor } from "../../constants/AlertColors";
import { apiService } from "../../services/api";
import { Alert } from "../../types";
import { Button } from "../../components/UI/Button";

const ALERT_ICONS = {
  weather_alert: AlertTriangle,
  community_alert: Users,
  safety_alert: Shield,
  emergency: AlertTriangle,
  announcement: Megaphone,
  system: AlertTriangle,
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const alertId = parseInt(id || "0", 10);

  const fetchAlert = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAlert(alertId);

      if (response.success && response.data) {
        setAlert(response.data);
      } else {
        setError("Alert not found");
      }
    } catch (error: any) {
      console.error("Error fetching alert:", error);
      setError(error.response?.data?.message || "Failed to load alert");
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    if (alertId) {
      fetchAlert();
    } else {
      setError("Invalid alert ID");
      setLoading(false);
    }
  }, [alertId, fetchAlert]);

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - alertDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return alertDate.toLocaleDateString();
  };

  const handleShare = async () => {
    if (!alert) return;

    try {
      const shareUrl = `https://stormneighbor.app/alert/${alertId}`;
      const shareMessage = `StormNeighbor Alert: ${alert.title}\n\n${alert.description}\n\nView details: ${shareUrl}`;

      await Share.share({
        message: shareMessage,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Error sharing alert:", error);
      AlertDialog.alert("Error", "Failed to share alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return Colors.error[500];
      case "HIGH":
        return Colors.warning[500];
      case "MODERATE":
        return Colors.primary[500];
      case "LOW":
        return Colors.neutral[500];
      default:
        return Colors.primary[500];
    }
  };

  const getSeverityBadgeStyle = (severity: string) => {
    const color = getSeverityColor(severity);
    return {
      backgroundColor: color + "20",
      borderColor: color,
    };
  };

  const getSeverityTextStyle = (severity: string) => {
    return {
      color: getSeverityColor(severity),
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alert Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading alert...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !alert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alert Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={Colors.error[500]} />
          <Text style={styles.errorTitle}>Alert Not Found</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const IconComponent = ALERT_ICONS[alert.alertType as keyof typeof ALERT_ICONS] || AlertTriangle;
  const alertColor = getAlertColor(alert.alertType as keyof typeof ALERT_COLORS);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.alertHeader}>
          <View style={[styles.iconContainer, { backgroundColor: alertColor + "20" }]}>
            <IconComponent size={32} color={alertColor} />
          </View>

          <View style={styles.alertInfo}>
            <View style={styles.badges}>
              <View style={[styles.severityBadge, getSeverityBadgeStyle(alert.severity)]}>
                <Text style={[styles.severityText, getSeverityTextStyle(alert.severity)]}>
                  {alert.severity}
                </Text>
              </View>
              {alert.isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            <Text style={styles.alertTitle}>{alert.title}</Text>

            <View style={styles.metadata}>
              <View style={styles.metaItem}>
                <Clock size={16} color={Colors.text.secondary} />
                <Text style={styles.metaText}>{formatTimeAgo(alert.createdAt)}</Text>
              </View>

              {alert.metadata?.areaDesc && (
                <View style={styles.metaItem}>
                  <MapPin size={16} color={Colors.text.secondary} />
                  <Text style={styles.metaText}>{alert.metadata.areaDesc}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{alert.description}</Text>
        </View>

        {alert.startTime && (
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>Alert Period</Text>
            <View style={styles.timeItem}>
              <Calendar size={16} color={Colors.text.secondary} />
              <Text style={styles.timeText}>
                Starts: {new Date(alert.startTime).toLocaleString()}
              </Text>
            </View>
            {alert.endTime && (
              <View style={styles.timeItem}>
                <Calendar size={16} color={Colors.text.secondary} />
                <Text style={styles.timeText}>
                  Ends: {new Date(alert.endTime).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionSection}>
          <Button
            title="Share Alert"
            onPress={handleShare}
            variant="outline"
            style={styles.actionButton}
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
  shareButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alertInfo: {
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.success[100],
  },
  activeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success[700],
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
    lineHeight: 24,
  },
  metadata: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  descriptionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  timeSection: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  actionSection: {
    padding: 20,
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
});
