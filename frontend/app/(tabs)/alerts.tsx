import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Header } from "../../components/UI/Header";
import AlertsSlider from "../../components/Alerts/AlertsSlider";
import AlertCard from "../../components/Alerts/AlertCard";

interface Alert {
  id: string;
  type: "severe_weather" | "community_alerts" | "safety_alerts" | "help_needed" | "events" | "questions" | "announcements" | "weather_alerts";
  title: string;
  description: string;
  timestamp: string;
  locations: string[];
  isActive: boolean;
}

export default function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState("all");

  const sampleAlerts: Alert[] = [
    {
      id: "1",
      type: "severe_weather",
      title: "Tornado Warning",
      description: "A tornado warning has been issued for the area. Seek shelter immediately in a sturdy building away from windows.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      locations: ["Owasso, OK", "Claremore, OK", "Catoosa, OK"],
      isActive: true,
    },
    {
      id: "2", 
      type: "community_alerts",
      title: "Neighborhood Watch Meeting",
      description: "Monthly neighborhood watch meeting to discuss recent activities and safety concerns in our area.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      locations: ["Owasso, OK"],
      isActive: false,
    },
    {
      id: "3",
      type: "safety_alerts", 
      title: "Road Closure Due to Accident",
      description: "Highway 169 northbound is closed due to a multi-vehicle accident. Please use alternate routes.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      locations: ["Highway 169, Owasso"],
      isActive: true,
    },
    {
      id: "4",
      type: "help_needed",
      title: "Lost Pet - Golden Retriever",
      description: "Max, a 3-year-old golden retriever, went missing from the park area. Please contact if you see him.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      locations: ["Redbud Valley Nature Preserve", "Owasso, OK"],
      isActive: false,
    },
  ];

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const filteredAlerts = sampleAlerts.filter(alert => {
    if (activeFilter === "all") return true;
    return alert.type === activeFilter;
  });

  const activeAlerts = filteredAlerts.filter(alert => alert.isActive);
  const recentAlerts = filteredAlerts.filter(alert => !alert.isActive);

  const handleAlertView = (alertId: string) => {
    console.log(`Viewing alert: ${alertId}`);
  };

  const handleAlertShare = (alertId: string) => {
    console.log(`Sharing alert: ${alertId}`);
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertCard
      id={item.id}
      type={item.type}
      title={item.title}
      description={item.description}
      timestamp={item.timestamp}
      locations={item.locations}
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
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

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

      <AlertsSlider
        onFilterChange={handleFilterChange}
        activeFilter={activeFilter}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                : `No ${activeFilter.replace("_", " ")} alerts found. Try selecting a different filter.`}
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
