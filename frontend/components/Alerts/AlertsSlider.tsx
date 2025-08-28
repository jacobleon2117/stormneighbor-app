import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { ALERT_COLORS } from "../../constants/AlertColors";

const { width: screenWidth } = Dimensions.get('window');
const PILL_WIDTH = 100;
const PILL_MARGIN = 12;
const LEFT_PADDING = 20;

interface AlertFilter {
  id: string;
  name: string;
  color: string;
}

interface AlertsSliderProps {
  onFilterChange: (filterId: string) => void;
  activeFilter: string;
}

export default function AlertsSlider({
  onFilterChange,
  activeFilter,
}: AlertsSliderProps) {
  const filters: AlertFilter[] = [
    {
      id: "all",
      name: "All",
      color: Colors.primary[600],
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
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderFilter = (filter: AlertFilter) => {
    const isActive = activeFilter === filter.id;
    const lightBorderColor = getLighterColor(filter.color, 0.4);

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
            !isActive && { color: filter.color },
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
    minHeight: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: LEFT_PADDING,
    paddingRight: LEFT_PADDING,
    alignItems: 'center',
  },
  filterPill: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: PILL_MARGIN,
    minWidth: PILL_WIDTH,
    borderWidth: 2,
    shadowColor: Colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'center',
  },
  filterTextActive: {
    color: Colors.text.inverse,
  },
});