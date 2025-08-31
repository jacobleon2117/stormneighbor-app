import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { Colors } from "../../constants/Colors";

const { width: screenWidth } = Dimensions.get("window");
const PILL_WIDTH = 100;
const PILL_MARGIN = 12;
const LEFT_PADDING = 20;

interface AlertFilter {
  id: string;
  name: string;
  color: string;
}

interface AlertsFilterProps {
  onFilterChange: (filterId: string) => void;
  activeFilter: string;
}

export default function AlertsFilter({ onFilterChange, activeFilter }: AlertsFilterProps) {
  const filters: AlertFilter[] = [
    {
      id: "all",
      name: "All",
      color: Colors.primary[600],
    },
    {
      id: "severe_weather",
      name: "Severe Weather",
      color: Colors.error[600],
    },
    {
      id: "community_alerts",
      name: "Community Alerts",
      color: Colors.warning[600],
    },
    {
      id: "safety_alerts",
      name: "Safety Alerts",
      color: Colors.error[500],
    },
    {
      id: "help_needed",
      name: "Help Needed",
      color: Colors.primary[500],
    },
    {
      id: "events",
      name: "Events",
      color: Colors.success[600],
    },
    {
      id: "questions",
      name: "Questions",
      color: Colors.neutral[600],
    },
    {
      id: "announcements",
      name: "Announcements",
      color: Colors.purple[600],
    },
    {
      id: "weather_alerts",
      name: "Weather Alerts",
      color: Colors.weather.stormy,
    },
  ];

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
        onPress={() => onFilterChange(filter.id)}
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
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: LEFT_PADDING,
    paddingRight: LEFT_PADDING,
    alignItems: "center",
    height: 50,
  },
  filterPill: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: PILL_MARGIN,
    minWidth: PILL_WIDTH,
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
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.background,
  },
});
