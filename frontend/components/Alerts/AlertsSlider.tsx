import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Colors } from "../../constants/Colors";
import { ALERT_COLORS } from "../../constants/AlertColors";

const PILL_WIDTH = 80;
const PILL_MARGIN = 12;
const LEFT_PADDING = 32;
const RIGHT_PADDING = 20;

interface AlertFilter {
  id: string;
  name: string;
  color: string;
}

interface AlertsSliderProps {
  onFilterChange: (filterId: string) => void;
  activeFilter: string;
}

export default function AlertsSlider({ onFilterChange, activeFilter }: AlertsSliderProps) {
  const filters: AlertFilter[] = [
    {
      id: "all",
      name: "All",
      color: Colors.primary[600],
    },
    {
      id: "precipitation",
      name: "Rain",
      color: "#3b82f6",
    },
    {
      id: "clouds",
      name: "Clouds",
      color: "#6b7280",
    },
    {
      id: "wind",
      name: "Wind",
      color: "#10b981",
    },
    {
      id: "temperature",
      name: "Temp",
      color: "#f59e0b",
    },
    {
      id: "severe_weather",
      name: "Severe Weather",
      color: ALERT_COLORS.severe_weather,
    },
    {
      id: "weather_alerts",
      name: "Weather",
      color: ALERT_COLORS.weather_alerts,
    },
    {
      id: "safety_alerts",
      name: "Safety",
      color: ALERT_COLORS.safety_alerts,
    },
    {
      id: "community_alerts",
      name: "Community",
      color: ALERT_COLORS.community_alerts,
    },
    {
      id: "help_needed",
      name: "Help",
      color: ALERT_COLORS.help_needed,
    },
    {
      id: "events",
      name: "Events",
      color: ALERT_COLORS.events,
    },
    {
      id: "questions",
      name: "Questions",
      color: ALERT_COLORS.questions,
    },
    {
      id: "announcements",
      name: "News",
      color: ALERT_COLORS.announcements,
    },
  ];

  const handleFilterPress = (filterId: string) => {
    onFilterChange(filterId);
  };

  const getLighterColor = (color: string, opacity: number = 0.3) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderFilter = (filter: AlertFilter) => {
    const isActive = activeFilter === filter.id;
    const lightBorderColor = getLighterColor(filter.color, 0.4);
    const mediumBorderColor = getLighterColor(filter.color, 0.7);

    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterPill,
          { borderColor: isActive ? filter.color : lightBorderColor },
          isActive && [styles.filterPillActive, { backgroundColor: filter.color }],
        ]}
        onPress={() => handleFilterPress(filter.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterText,
            !isActive && { color: mediumBorderColor },
            isActive && styles.filterTextActive,
          ]}
        >
          {filter.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
      >
        {filters.map(renderFilter)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    height: 88,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: LEFT_PADDING,
    paddingRight: RIGHT_PADDING,
    alignItems: "center",
    height: 56,
  },
  filterPill: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: PILL_MARGIN,
    minWidth: PILL_WIDTH,
    minHeight: 36,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.background,
  },
});
