// File: frontend/src/screens/main/AlertsScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  AlertTriangle,
  Zap,
  MapPin,
  Share,
  Construction,
  Cloud,
  Users,
  Droplets,
  Wind,
  Eye,
} from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import apiService from "@services/api";

const AlertsScreen = ({ user, alertCounts }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.neighborhoodId) {
      loadAlerts();
    } else {
      setLoading(false);
    }
  }, [user?.neighborhoodId]);

  const loadAlerts = useCallback(async () => {
    if (!user?.neighborhoodId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await apiService.getAlerts(user.neighborhoodId);

      if (result.success) {
        const alertsData = result.data.alerts || [];

        // Sort alerts by severity and timestamp
        alertsData.sort((a, b) => {
          const severityOrder = {
            CRITICAL: 4,
            HIGH: 3,
            WATCH: 2,
            COMMUNITY: 1,
          };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[b.severity] - severityOrder[a.severity];
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setAlerts(alertsData);
      } else {
        setError(result.error || "Failed to load alerts");
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setError("Failed to load alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.neighborhoodId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  const getFilteredAlerts = () => {
    if (selectedFilter === "All") return alerts;

    return alerts.filter((alert) => {
      switch (selectedFilter) {
        case "Critical":
          return alert.severity === "CRITICAL";
        case "High":
          return alert.severity === "HIGH";
        case "Watch":
          return alert.severity === "WATCH";
        case "Weather":
          return alert.source === "NOAA" || alert.category === "weather";
        case "Safety":
          return alert.category === "safety";
        case "Community":
          return alert.source === "USER" || alert.category === "community";
        default:
          return true;
      }
    });
  };

  const getAlertIcon = (alert) => {
    if (alert.category === "weather") {
      if (alert.title?.toLowerCase().includes("tornado")) return AlertTriangle;
      if (alert.title?.toLowerCase().includes("thunder")) return Zap;
      if (alert.title?.toLowerCase().includes("flood")) return Droplets;
      if (alert.title?.toLowerCase().includes("wind")) return Wind;
      return Cloud;
    }

    if (alert.category === "safety") return AlertTriangle;
    if (alert.category === "community") return Users;
    return Construction;
  };

  const getAlertColors = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          background: colors.alert.critical.bg,
          border: colors.alert.critical.border,
          text: colors.alert.critical.text,
        };
      case "HIGH":
        return {
          background: colors.alert.warning.bg,
          border: colors.alert.warning.border,
          text: colors.alert.warning.text,
        };
      case "WATCH":
        return {
          background: colors.alert.warning.bg,
          border: colors.alert.warning.border,
          text: colors.alert.warning.text,
        };
      default:
        return {
          background: colors.alert.info.bg,
          border: colors.alert.info.border,
          text: colors.alert.info.text,
        };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleAlertPress = (alert) => {
    Alert.alert(
      alert.title,
      `${alert.description}\n\nLocation: ${
        alert.location || "Local area"
      }\nTime: ${formatTimeAgo(alert.createdAt)}`,
      [
        { text: "OK" },
        {
          text: "View Details",
          onPress: () => console.log("View alert details:", alert.id),
        },
      ]
    );
  };

  const handleShareAlert = (alert) => {
    Alert.alert("Share Alert", `Share "${alert.title}" with neighbors?`);
  };

  const filters = [
    { id: "All", label: "All" },
    { id: "Critical", label: "Critical" },
    { id: "High", label: "High" },
    { id: "Watch", label: "Watch" },
    { id: "Weather", label: "Weather" },
    { id: "Safety", label: "Safety" },
    { id: "Community", label: "Community" },
  ];

  const filteredAlerts = getFilteredAlerts();
  const activeAlerts = filteredAlerts.filter((alert) => alert.isActive);
  const recentAlerts = filteredAlerts.filter((alert) => !alert.isActive);

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterChip,
            selectedFilter === filter.id && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter(filter.id)}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === filter.id && styles.filterTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAlertCard = (alert, isActive = true) => {
    const alertColors = getAlertColors(alert.severity);
    const IconComponent = getAlertIcon(alert);

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          {
            backgroundColor: alertColors.background,
            borderColor: alertColors.border,
          },
        ]}
        onPress={() => handleAlertPress(alert)}
        activeOpacity={0.7}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <IconComponent size={20} color={alertColors.text} />
            <Text style={[styles.alertTitle, { color: alertColors.text }]}>
              {alert.title}
            </Text>
          </View>
          <View
            style={[styles.alertBadge, { backgroundColor: alertColors.text }]}
          >
            <Text style={styles.alertBadgeText}>{alert.severity}</Text>
          </View>
        </View>

        <Text style={styles.alertDescription}>{alert.description}</Text>

        <View style={styles.alertFooter}>
          <View style={styles.alertLocation}>
            <MapPin size={14} color={colors.text.muted} />
            <Text style={styles.alertLocationText}>
              {alert.location || "Local area"}
            </Text>
          </View>
          <Text style={styles.alertTime}>{formatTimeAgo(alert.createdAt)}</Text>
        </View>

        {isActive && (
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => console.log("View details:", alert.id)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShareAlert(alert)}
            >
              <Share size={16} color={colors.text.secondary} />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Loading alerts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={globalStyles.emptyContainer}>
          <AlertTriangle size={64} color={colors.error} />
          <Text style={globalStyles.emptyTitle}>Failed to Load Alerts</Text>
          <Text style={globalStyles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={[globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
            onPress={loadAlerts}
          >
            <Text style={globalStyles.buttonPrimaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!user?.neighborhoodId) {
      return (
        <View style={globalStyles.emptyContainer}>
          <AlertTriangle size={64} color={colors.text.muted} />
          <Text style={globalStyles.emptyTitle}>No Neighborhood Set</Text>
          <Text style={globalStyles.emptyText}>
            Complete your profile setup to receive local alerts
          </Text>
        </View>
      );
    }

    if (filteredAlerts.length === 0) {
      return (
        <View style={globalStyles.emptyContainer}>
          <Eye size={64} color={colors.text.muted} />
          <Text style={globalStyles.emptyTitle}>
            No {selectedFilter.toLowerCase()} alerts
          </Text>
          <Text style={globalStyles.emptyText}>
            {selectedFilter === "All"
              ? "No alerts in your area right now"
              : `No ${selectedFilter.toLowerCase()} alerts at this time`}
          </Text>
        </View>
      );
    }

    return (
      <>
        {renderFilterChips()}

        <ScrollView
          style={styles.alertsContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeAlerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Active Alerts{" "}
                {selectedFilter !== "All" && `(${selectedFilter})`}
              </Text>
              {activeAlerts.map((alert) => renderAlertCard(alert, true))}
            </View>
          )}

          {recentAlerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Recent Alerts{" "}
                {selectedFilter !== "All" && `(${selectedFilter})`}
              </Text>
              {recentAlerts.map((alert) => renderAlertCard(alert, false))}
            </View>
          )}

          <View style={{ height: spacing.xxxxl }} />
        </ScrollView>
      </>
    );
  };

  return (
    <ScreenLayout title="Alerts" refreshing={refreshing} onRefresh={onRefresh}>
      {renderContent()}
    </ScreenLayout>
  );
};

const styles = {
  filtersContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },

  filterTextActive: {
    color: colors.text.inverse,
    fontWeight: "600",
  },

  alertsContainer: {
    flex: 1,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  alertCard: {
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...globalStyles.card,
  },

  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },

  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },

  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },

  alertBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },

  alertBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.inverse,
  },

  alertDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  alertLocation: {
    flexDirection: "row",
    alignItems: "center",
  },

  alertLocationText: {
    fontSize: 13,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },

  alertTime: {
    fontSize: 13,
    color: colors.text.muted,
  },

  alertActions: {
    flexDirection: "row",
    gap: spacing.md,
  },

  viewDetailsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },

  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.inverse,
  },

  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },

  shareText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
};

export default AlertsScreen;
