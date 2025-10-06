import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert as AlertDialog,
  Share,
} from "react-native";
import { router } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Header } from "../../components/UI/Header";
import AlertsSlider from "../../components/Alerts/AlertsSlider";
import AlertCard from "../../components/Alerts/AlertCard";
import { apiService } from "../../services/api";
import { weatherAlertsService } from "../../services/weatherAlerts";
import { useAuth } from "../../hooks/useAuth";
import { Alert } from "../../types";
import { ErrorHandler } from "../../utils/errorHandler";

interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const ALERT_TYPE_MAP: Record<string, string> = {
  all: "all",
  weather: "weather_alert",
  community: "community_alert",
  safety: "safety_alert",
  emergency: "emergency",
  system: "system",
};

export default function AlertsScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [alertsState, setAlertsState] = useState<AlertsState>({
    alerts: [],
    loading: true,
    refreshing: false,
    error: null,
  });

  const fetchAlerts = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setAlertsState((prev) => ({ ...prev, loading: true, error: null }));
        } else {
          setAlertsState((prev) => ({ ...prev, refreshing: true, error: null }));
        }

        const params: any = {};
        const latitude = user?.latitude || user?.homeLatitude;
        const longitude = user?.longitude || user?.homeLongitude;

        if (latitude && longitude) {
          params.latitude = latitude;
          params.longitude = longitude;
        }

        const city = user?.homeCity || user?.locationCity;
        const state = user?.homeState || user?.addressState;
        if (city && state) {
          params.city = city;
          params.state = state;
        }

        // Require either lat/lng or city+state to fetch alerts. If not present,
        // set a user-friendly error rather than calling the backend which will
        // return a validation error.
        if (!params.latitude || !params.longitude) {
          if (!(params.city && params.state)) {
            throw new Error("City and state are required for alerts");
          }
        }

        const response = await apiService.getAlerts(params);

        if (response.success && response.data) {
          setAlertsState((prev) => ({
            ...prev,
            alerts: response.data.alerts || [],
            loading: false,
            refreshing: false,
            error: null,
          }));
        } else {
          throw new Error(response.message || "Failed to fetch alerts");
        }

        if (latitude && longitude) {
          try {
            await weatherAlertsService.syncWeatherAlerts(latitude, longitude);
          } catch (weatherError) {
            ErrorHandler.silent(weatherError as Error, "Weather Alerts Sync");
          }
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load alerts. Please try again later.";

        ErrorHandler.handleError(error, "Failed to Load Alerts");

        setAlertsState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: errorMessage,
        }));
      }
    },
    [user]
  );

  useEffect(() => {
    fetchAlerts();

    const alertsPollingInterval = setInterval(
      () => {
        fetchAlerts(true);
      },
      5 * 60 * 1000
    );

    const latitude = user?.latitude || user?.homeLatitude;
    const longitude = user?.longitude || user?.homeLongitude;

    let weatherSyncInterval: ReturnType<typeof setInterval>;
    if (latitude && longitude) {
      weatherSyncInterval = setInterval(
        async () => {
          try {
            await weatherAlertsService.syncWeatherAlerts(latitude, longitude);
          } catch (error) {
            ErrorHandler.silent(error as Error, "Background Weather Sync");
          }
        },
        15 * 60 * 1000
      );
    }

    return () => {
      clearInterval(alertsPollingInterval);
      if (weatherSyncInterval) {
        clearInterval(weatherSyncInterval);
      }
    };
  }, [fetchAlerts, user]);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const filteredAlerts = alertsState.alerts.filter((alert) => {
    if (activeFilter === "all") return true;
    const mappedType = ALERT_TYPE_MAP[activeFilter];
    return alert.alertType === mappedType;
  });

  const activeAlerts = filteredAlerts.filter((alert) => alert.isActive);
  const recentAlerts = filteredAlerts.filter((alert) => !alert.isActive);

  const handleRefresh = useCallback(() => {
    fetchAlerts(true);
  }, [fetchAlerts]);

  const handleAlertView = (alertId: number) => {
    router.push({
      pathname: "/alert/[id]" as any,
      params: { id: alertId.toString() },
    });
  };

  const handleAlertShare = async (alertId: number) => {
    try {
      const alert = alertsState.alerts.find((a) => a.id === alertId);
      if (!alert) return;

      const shareUrl = `https://stormneighbor.app/alert/${alertId}`;
      const shareMessage = `StormNeighbor Alert: ${alert.title}\n\n${alert.description}\n\nView details: ${shareUrl}`;

      await Share.share({
        message: shareMessage,
        url: shareUrl,
      });
    } catch (error) {
      ErrorHandler.silent(error as Error, "Share Alert");
      AlertDialog.alert("Error", "Failed to share alert");
    }
  };

  const mapAlertTypeToCardType = (alertType: string) => {
    switch (alertType) {
      case "weather_alert":
        return "weather_alerts";
      case "community_alert":
        return "community_alerts";
      case "safety_alert":
        return "safety_alerts";
      case "system":
        return "announcements";
      case "emergency":
        return "severe_weather";
      default:
        return "announcements";
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertCard
      id={item.id.toString()}
      type={mapAlertTypeToCardType(item.alertType) as any}
      title={item.title}
      description={item.description}
      timestamp={item.createdAt}
      locations={item.metadata?.areaDesc ? [item.metadata.areaDesc] : []}
      onView={() => handleAlertView(item.id)}
      onShare={() => handleAlertShare(item.id)}
    />
  );

  const renderSection = (title: string, data: Alert[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    );
  };

  if (alertsState.loading && !alertsState.refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Alerts"
          showSearch={true}
          showNotifications={true}
          showMessages={true}
          onSearchPress={() => router.push("/(tabs)/search")}
          onNotificationsPress={() => router.push("/(tabs)/notifications")}
          onMessagesPress={() => router.push("/(tabs)/messages")}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </View>
    );
  }

  if (alertsState.error) {
    return (
      <View style={styles.container}>
        <Header
          title="Alerts"
          showSearch={true}
          showNotifications={true}
          showMessages={true}
          onSearchPress={() => router.push("/(tabs)/search")}
          onNotificationsPress={() => router.push("/(tabs)/notifications")}
          onMessagesPress={() => router.push("/(tabs)/messages")}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={Colors.error[500]} />
          <Text style={styles.errorTitle}>Unable to load alerts</Text>
          <Text style={styles.errorMessage}>{alertsState.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchAlerts()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Alerts"
        showSearch={true}
        showNotifications={true}
        showMessages={true}
        onSearchPress={() => router.push("/(tabs)/search")}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onMessagesPress={() => router.push("/(tabs)/messages")}
      />

      <AlertsSlider onFilterChange={handleFilterChange} activeFilter={activeFilter} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={alertsState.refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {renderSection("Active Alerts", activeAlerts)}
        {renderSection("Recent Alerts", recentAlerts)}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              No {activeFilter !== "all" ? `${activeFilter.replace("_", " ")} ` : ""}alerts
            </Text>
            <Text style={styles.emptyMessage}>
              {activeFilter === "all"
                ? "No alerts at this time. Stay safe!"
                : `No ${activeFilter.replace(
                    "_",
                    " "
                  )} alerts found. Try selecting a different filter.`}
            </Text>
          </View>
        )}
      </ScrollView>
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
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
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
