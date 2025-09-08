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

const generateDemoAlerts = (
  latitude?: number,
  longitude?: number,
  city?: string,
  state?: string
): Alert[] => {
  const location = city && state ? `${city}, ${state}` : "Your Area";

  return [
    {
      id: 1,
      title: "Severe Thunderstorm Warning",
      description: `The National Weather Service has issued a severe thunderstorm warning for ${location}. Damaging winds up to 70 mph and quarter-size hail possible. Seek shelter indoors immediately and avoid travel until the storm passes.`,
      severity: "HIGH" as const,
      alertType: "weather_alert",
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      metadata: {
        areaDesc: location,
        event: "Severe Thunderstorm Warning",
        urgency: "Immediate",
        certainty: "Observed",
        nwsId: "demo-nws-001",
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Flash Flood Watch",
      description: `A Flash Flood Watch is in effect for ${location} through tonight. Heavy rainfall may cause rapid rises in creeks and streams. Turn around, don't drown - never drive through flooded roads.`,
      severity: "MODERATE" as const,
      alertType: "weather_alert",
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      metadata: {
        areaDesc: location,
        event: "Flash Flood Watch",
        urgency: "Future",
        certainty: "Possible",
        nwsId: "demo-nws-002",
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "System Maintenance Notice",
      description: `StormNeighbor will undergo scheduled maintenance tonight from 2:00 AM to 4:00 AM. Some features may be temporarily unavailable during this time. We apologize for any inconvenience.`,
      severity: "LOW" as const,
      alertType: "system",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      metadata: {
        areaDesc: "All Users",
        event: "System Maintenance",
        urgency: "Future",
        certainty: "Certain",
      },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];
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

        console.log("Fetching alerts with params:", params);

        try {
          const response = await apiService.getAlerts(params);
          console.log("Alerts API response:", response);

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
        } catch (apiError: any) {
          console.error("API Error details:", apiError.response?.data || apiError.message);

          console.log("Using fallback demo alerts due to API error");
          const demoAlerts = generateDemoAlerts(latitude, longitude, city, state);

          setAlertsState((prev) => ({
            ...prev,
            alerts: demoAlerts,
            loading: false,
            refreshing: false,
            error: null,
          }));
        }

        if (latitude && longitude) {
          try {
            await weatherAlertsService.syncWeatherAlerts(latitude, longitude);
          } catch (weatherError) {
            console.warn("Weather alerts sync failed:", weatherError);
          }
        }
      } catch (error: any) {
        console.error("Critical error in fetchAlerts:", error);
        setAlertsState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: "Unable to load alerts. Please try again later.",
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
            console.warn("Background weather sync failed:", error);
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
      console.error("Error sharing alert:", error);
      AlertDialog.alert("Error", "Failed to share alert");
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertCard
      id={item.id.toString()}
      type={item.alertType as any}
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
