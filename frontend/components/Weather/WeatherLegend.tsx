import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Colors } from "../../constants/Colors";
import { ALERT_COLORS } from "../../constants/AlertColors";

const PILL_WIDTH = 80;
const PILL_MARGIN = 12;
const LEFT_PADDING = 32;
const RIGHT_PADDING = 32;

interface WeatherLayer {
  id: string;
  name: string;
  color: string;
}

interface WeatherLegendProps {
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  weatherLayers: Record<string, boolean>;
}

export default function WeatherLegend({ onLayerToggle, weatherLayers }: WeatherLegendProps) {
  const layers: WeatherLayer[] = [
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
  ];

  const toggleLayer = (layerId: string) => {
    const currentState = weatherLayers[layerId] || false;
    console.log(`WeatherLegend: Toggling ${layerId} from ${currentState} to ${!currentState}`);
    onLayerToggle(layerId, !currentState);
  };

  const getLighterColor = (color: string, opacity: number = 0.3) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderLayer = (layer: WeatherLayer) => {
    const isEnabled = weatherLayers[layer.id] || false;
    const lightBorderColor = getLighterColor(layer.color, 0.4);
    const mediumBorderColor = getLighterColor(layer.color, 0.7);

    return (
      <TouchableOpacity
        key={layer.id}
        style={[
          styles.layerPill,
          { borderColor: isEnabled ? layer.color : lightBorderColor },
          isEnabled && [styles.layerPillActive, { backgroundColor: layer.color }],
        ]}
        onPress={() => toggleLayer(layer.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.layerText,
            !isEnabled && { color: mediumBorderColor },
            isEnabled && styles.layerTextActive,
          ]}
        >
          {layer.name}
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
        {layers.map((layer) => renderLayer(layer))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: "transparent",
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
  layerPill: {
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
  layerPillActive: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
  },
  layerText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  layerTextActive: {
    color: Colors.background,
  },
});
