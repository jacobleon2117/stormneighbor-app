import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  CloudRain,
  Wind,
  Cloud,
  Thermometer,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";

interface WeatherLayer {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  enabled: boolean;
  description: string;
}

interface WeatherLegendProps {
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}

export default function WeatherLegend({
  onLayerToggle,
  visible,
  onToggleVisibility,
}: WeatherLegendProps) {
  const [layers, setLayers] = useState<WeatherLayer[]>([
    {
      id: "precipitation",
      name: "Rain & Snow",
      icon: CloudRain,
      color: "#3b82f6",
      enabled: false,
      description: "Current precipitation and forecasted rain/snow",
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      icon: Cloud,
      color: "#6b7280",
      enabled: false,
      description: "Current cloud coverage and visibility",
    },
    {
      id: "wind",
      name: "Wind Speed",
      icon: Wind,
      color: "#10b981",
      enabled: false,
      description: "Wind speed and direction indicators",
    },
    {
      id: "temperature",
      name: "Temperature",
      icon: Thermometer,
      color: "#f59e0b",
      enabled: false,
      description: "Temperature gradient overlay",
    },
    {
      id: "alerts",
      name: "Weather Alerts",
      icon: AlertTriangle,
      color: "#dc2626",
      enabled: true,
      description: "Active weather warnings and watches",
    },
  ]);

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );

    const layer = layers.find((l) => l.id === layerId);
    if (layer) {
      onLayerToggle(layerId, !layer.enabled);
    }
  };

  const renderLayer = (layer: WeatherLayer) => {
    const IconComponent = layer.icon;

    return (
      <TouchableOpacity
        key={layer.id}
        style={[styles.layerItem, layer.enabled && styles.layerItemActive]}
        onPress={() => toggleLayer(layer.id)}
      >
        <View style={styles.layerIcon}>
          <IconComponent
            size={18}
            color={layer.enabled ? layer.color : Colors.text.disabled}
          />
        </View>
        <View style={styles.layerContent}>
          <Text
            style={[styles.layerName, layer.enabled && styles.layerNameActive]}
          >
            {layer.name}
          </Text>
          <Text style={styles.layerDescription}>{layer.description}</Text>
        </View>
        <View
          style={[
            styles.layerToggle,
            layer.enabled && { backgroundColor: layer.color },
          ]}
        >
          {layer.enabled && <View style={styles.toggleIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, visible && styles.containerVisible]}>
      <TouchableOpacity style={styles.header} onPress={onToggleVisibility}>
        <Text style={styles.headerTitle}>Weather Layers</Text>
        {visible ? (
          <ChevronDown size={20} color={Colors.text.secondary} />
        ) : (
          <ChevronUp size={20} color={Colors.text.secondary} />
        )}
      </TouchableOpacity>

      {visible && (
        <ScrollView
          style={styles.layersContainer}
          showsVerticalScrollIndicator={false}
        >
          {layers.map(renderLayer)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 108,
    left: 32,
    right: 32,
    backgroundColor: Colors.background,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
    maxHeight: 60,
    overflow: "hidden",
  },
  containerVisible: {
    maxHeight: 300,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  layersContainer: {
    maxHeight: 240,
  },
  layerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  layerItemActive: {
    backgroundColor: Colors.neutral[50],
  },
  layerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  layerContent: {
    flex: 1,
  },
  layerName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  layerNameActive: {
    color: Colors.text.primary,
  },
  layerDescription: {
    fontSize: 12,
    color: Colors.text.disabled,
    lineHeight: 16,
  },
  layerToggle: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.neutral[200],
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  toggleIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.background,
  },
});
