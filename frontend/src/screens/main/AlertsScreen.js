// File: frontend/src/screens/main/AlertsScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  AlertTriangle,
  Zap,
  Eye,
  MapPin,
  Share,
  Construction,
  Cloud,
  Users,
  Droplets,
  Wind,
} from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const OPENWEATHER_API_KEY = "";
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

const ALERT_COLORS = {
  CRITICAL: {
    background: "#FEE2E2",
    border: "#EF4444",
    text: "#EF4444",
    badge: "#EF4444",
  },
  HIGH: {
    background: "#FEF3C7",
    border: "#F59E0B",
    text: "#F59E0B",
    badge: "#F59E0B",
  },
  WATCH: {
    background: "#FEF3C7",
    border: "#FBBF24",
    text: "#FBBF24",
    badge: "#FBBF24",
  },
  COMMUNITY: {
    background: "#DBEAFE",
    border: "#3B82F6",
    text: "#3B82F6",
    badge: "#3B82F6",
  },
};

const AlertsScreen = ({ user, alertCounts }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const [weatherAlerts, communityAlerts] = await Promise.all([
        fetchWeatherAlerts(),
        fetchCommunityAlerts(),
      ]);

      const allAlerts = [...weatherAlerts, ...communityAlerts];

      allAlerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, WATCH: 2, COMMUNITY: 1 };
        if (severityOrder[a.type] !== severityOrder[b.type]) {
          return severityOrder[b.type] - severityOrder[a.type];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(allAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherAlerts = async () => {
    try {
      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_API_KEY_HERE") {
        return getMockWeatherAlerts();
      }

      const lat = 36.1539;
      const lon = -95.9928;

      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        console.log("Using mock weather alerts - API not available");
        return getMockWeatherAlerts();
      }

      const data = await response.json();

      const weatherAlerts = (data.alerts || []).map((alert, index) => ({
        id: `weather_${index}`,
        type: getAlertSeverity(alert.event),
        title: alert.event,
        description: alert.description,
        location: `${data.timezone}`,
        timeAgo: getTimeAgo(alert.start),
        timestamp: new Date(alert.start * 1000),
        icon: getWeatherIcon(alert.event),
        category: "weather",
        isActive: alert.end > Date.now() / 1000,
        source: "National Weather Service",
      }));

      return weatherAlerts.length > 0 ? weatherAlerts : getMockWeatherAlerts();
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      return getMockWeatherAlerts();
    }
  };

  const getMockWeatherAlerts = () => [
    {
      id: "weather_1",
      type: "CRITICAL",
      title: "Tornado Warning",
      description:
        "Tornado spotted 3 miles southwest of downtown. Take shelter immediately in interior room on lowest floor.",
      location: "Tulsa, Rogers Counties",
      timeAgo: "5 min ago",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      icon: AlertTriangle,
      category: "weather",
      isActive: true,
      source: "National Weather Service",
    },
    {
      id: "weather_2",
      type: "HIGH",
      title: "Severe Thunderstorm Warning",
      description:
        "Severe thunderstorm with 70 mph winds and quarter-size hail moving northeast at 35 mph.",
      location: "Tulsa, Rogers Counties",
      timeAgo: "12 min ago",
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      icon: Zap,
      category: "weather",
      isActive: true,
      source: "National Weather Service",
    },
  ];

  const fetchCommunityAlerts = async () => {
    try {
      return [
        {
          id: "community_1",
          type: "COMMUNITY",
          title: "Road Closure Update",
          description:
            "Main Street closed between 1st and 3rd due to water main break. Expected to reopen by 6 PM.",
          location: "Tulsa, Rogers Counties",
          timeAgo: "2 hours ago",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: Construction,
          category: "community",
          isActive: false,
          source: "Community Member",
          author: "City Manager",
        },
        {
          id: "community_2",
          type: "COMMUNITY",
          title: "Neighborhood Watch Alert",
          description:
            "Suspicious activity reported on Oak Street. Residents advised to keep doors locked and report any unusual activity.",
          location: "Oak Street Area",
          timeAgo: "4 hours ago",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          icon: Users,
          category: "safety",
          isActive: false,
          source: "Community Member",
          author: "Neighborhood Watch",
        },
      ];
    } catch (error) {
      console.error("Error fetching community alerts:", error);
      return [];
    }
  };

  const getAlertSeverity = (event) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes("tornado") || eventLower.includes("emergency"))
      return "CRITICAL";
    if (eventLower.includes("severe") || eventLower.includes("warning"))
      return "HIGH";
    if (eventLower.includes("watch") || eventLower.includes("advisory"))
      return "WATCH";
    return "COMMUNITY";
  };

  const getWeatherIcon = (event) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes("tornado")) return AlertTriangle;
    if (eventLower.includes("thunderstorm") || eventLower.includes("lightning"))
      return Zap;
    if (eventLower.includes("flood") || eventLower.includes("rain"))
      return Droplets;
    if (eventLower.includes("wind")) return Wind;
    return Cloud;
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getFilteredAlerts = () => {
    if (selectedFilter === "All") return alerts;

    return alerts.filter((alert) => {
      switch (selectedFilter) {
        case "Critical":
          return alert.type === "CRITICAL";
        case "High":
          return alert.type === "HIGH";
        case "Low":
        case "Watch":
          return alert.type === "WATCH";
        case "Weather":
          return alert.category === "weather";
        case "Safety":
          return alert.category === "safety";
        case "Community":
          return alert.category === "community" || alert.type === "COMMUNITY";
        default:
          return true;
      }
    });
  };

  const filteredAlerts = getFilteredAlerts();
  const activeAlerts = filteredAlerts.filter((alert) => alert.isActive);
  const recentAlerts = filteredAlerts.filter((alert) => !alert.isActive);

  const filters = [
    { id: "All", label: "All" },
    { id: "Critical", label: "Critical" },
    { id: "High", label: "High" },
    { id: "Watch", label: "Watch" },
    { id: "Weather", label: "Weather" },
    { id: "Safety", label: "Safety" },
    { id: "Community", label: "Community" },
  ];

  const handleFilterPress = (filterId) => {
    setSelectedFilter(filterId);
  };

  const handleAlertPress = (alert) => {
    Alert.alert(
      alert.title,
      `${alert.description}\n\nLocation: ${alert.location}\nTime: ${alert.timeAgo}`,
      [
        { text: "OK" },
        {
          text: "View Details",
          onPress: () => console.log("View alert details"),
        },
      ]
    );
  };

  const handleShareAlert = (alert) => {
    Alert.alert("Share Alert", `Share "${alert.title}" with neighbors?`);
  };

  const handleViewDetails = (alert) => {
    console.log("View details for:", alert.title);
  };

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
          onPress={() => handleFilterPress(filter.id)}
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
    const colors = ALERT_COLORS[alert.type];
    const IconComponent = alert.icon;

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
        onPress={() => handleAlertPress(alert)}
        activeOpacity={0.7}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <IconComponent size={20} color={colors.text} />
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alert.title}
            </Text>
          </View>
          <View style={[styles.alertBadge, { backgroundColor: colors.badge }]}>
            <Text style={styles.alertBadgeText}>{alert.type}</Text>
          </View>
        </View>

        <Text style={styles.alertDescription}>{alert.description}</Text>

        <View style={styles.alertFooter}>
          <View style={styles.alertLocation}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.alertLocationText}>{alert.location}</Text>
          </View>
          <Text style={styles.alertTime}>{alert.timeAgo}</Text>
        </View>

        {isActive && (
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => handleViewDetails(alert)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShareAlert(alert)}
            >
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav title="Alerts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav title="Alerts" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderFilterChips()}

        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              No {selectedFilter.toLowerCase()} alerts
            </Text>
            <Text style={styles.emptyText}>
              {selectedFilter === "All"
                ? "No alerts in your area right now"
                : `No ${selectedFilter.toLowerCase()} alerts at this time`}
            </Text>
          </View>
        ) : (
          <>
            {activeAlerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Active Alerts{" "}
                  {selectedFilter !== "All" && `(${selectedFilter})`}
                </Text>
                <View style={styles.alertsList}>
                  {activeAlerts.map((alert) => renderAlertCard(alert, true))}
                </View>
              </View>
            )}

            {recentAlerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Recent Alerts{" "}
                  {selectedFilter !== "All" && `(${selectedFilter})`}
                </Text>
                <View style={styles.alertsList}>
                  {recentAlerts.map((alert) => renderAlertCard(alert, false))}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  content: {
    flex: 1,
  },

  filtersContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  alertsList: {
    gap: 12,
  },

  alertCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  alertDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alertLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertLocationText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 4,
  },
  alertTime: {
    fontSize: 13,
    color: "#6B7280",
  },

  alertActions: {
    flexDirection: "row",
    gap: 12,
  },
  viewDetailsButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shareButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  shareText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },

  bottomSpacing: {
    height: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default AlertsScreen;
