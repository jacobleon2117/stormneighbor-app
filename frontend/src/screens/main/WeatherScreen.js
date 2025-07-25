// File: frontend/src/screens/main/WeatherScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import MapView, { UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import {
  MapPin,
  Play,
  Pause,
  X,
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
  Eye,
  Zap,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const OPENWEATHER_API_KEY = "";
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

const WeatherScreen = ({ user }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 36.1539,
    longitude: -95.9928,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  });
  const [selectedLayer, setSelectedLayer] = useState("precipitation");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLayerSelector, setShowLayerSelector] = useState(false);

  useEffect(() => {
    initializeWeather();
  }, []);

  const initializeWeather = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs location access to show weather for your area.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Try Again", onPress: initializeWeather },
          ]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = currentLocation.coords;
      console.log(`User location: ${latitude}, ${longitude}`);

      setLocation({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 1.0,
        longitudeDelta: 1.0,
      });

      await fetchWeatherData(latitude, longitude);
    } catch (error) {
      console.error("Error initializing weather:", error);
      Alert.alert(
        "Location Error",
        "Could not get your location. Please check your location settings and try again.",
        [
          { text: "Retry", onPress: initializeWeather },
          { text: "Cancel", style: "cancel" },
        ]
      );
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      console.log(`Fetching weather for: ${lat}, ${lon}`);

      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_API_KEY_HERE") {
        Alert.alert(
          "API Key Required",
          "Please add your OpenWeatherMap API key to get real weather data. Get one free at openweathermap.org/api"
        );
        setLoading(false);
        return;
      }

      const currentResponse = await fetch(
        `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error(
          `Weather API error: ${currentResponse.status} - ${errorText}`
        );
        throw new Error(`Weather API error: ${currentResponse.status}`);
      }

      const currentData = await currentResponse.json();
      console.log("Weather data received:", currentData);

      if (!currentData.main || !currentData.weather?.[0]) {
        throw new Error("Invalid weather data structure received");
      }

      setCurrentWeather(currentData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      Alert.alert(
        "Weather Data Error",
        "Could not fetch weather data. Please check your internet connection and try again.",
        [
          { text: "Retry", onPress: () => fetchWeatherData(lat, lon) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode, size = 32) => {
    if (!iconCode) return <Cloud size={size} color="#6B7280" />;

    const iconMap = {
      "01": Sun,
      "02": Cloud,
      "03": Cloud,
      "04": Cloud,
      "09": CloudDrizzle,
      10: CloudRain,
      11: Zap,
      13: CloudSnow,
      50: Eye,
    };

    const IconComponent = iconMap[iconCode.substring(0, 2)] || Cloud;
    return <IconComponent size={size} color="#6B7280" />;
  };

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return "0°";
    }
    return `${Math.round(temp)}°`;
  };

  const getTileUrl = () => {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_API_KEY_HERE") {
      return null;
    }

    const layerMap = {
      precipitation: "precipitation_new",
      temperature: "temp_new",
      wind: "wind_new",
      clouds: "clouds_new",
      lightning: "precipitation_new",
      air: "precipitation_new",
    };

    return `https://tile.openweathermap.org/map/${layerMap[selectedLayer]}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
  };

  const handleZoomIn = () => {
    setMapRegion((prev) => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 0.5,
      longitudeDelta: prev.longitudeDelta * 0.5,
    }));
  };

  const handleZoomOut = () => {
    setMapRegion((prev) => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  };

  const handleLocationPress = async () => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 1.0,
        longitudeDelta: 1.0,
      });
    } else {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = currentLocation.coords;

        setLocation({ latitude, longitude });
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        });

        await fetchWeatherData(latitude, longitude);
      } catch (error) {
        Alert.alert("Error", "Could not get current location");
      }
    }
  };

  const handleLayersPress = () => {
    setShowLayerSelector(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFilterChange = (filterId) => {
    setSelectedLayer(filterId);
  };

  const handleAlertPress = () => {
    Alert.alert(
      "Weather Alert",
      "Check local weather services for current alerts and warnings in your area.",
      [
        { text: "OK" },
        {
          text: "Open Weather App",
          onPress: () => console.log("Open native weather app"),
        },
      ]
    );
  };

  const handleLayerSelectorClose = () => {
    setShowLayerSelector(false);
  };

  const renderWeatherInfoCard = () => {
    if (!currentWeather || !currentWeather.main) {
      return (
        <View style={styles.weatherInfoContainer}>
          <View style={styles.weatherCard}>
            <Text style={styles.loadingText}>Loading weather...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.weatherInfoContainer}>
        <View style={styles.weatherCard}>
          <View style={styles.cardContent}>
            <View style={styles.leftSection}>
              <Text style={styles.locationText}>
                {currentWeather.name || "Current Location"}
              </Text>
              <Text style={styles.temperature}>
                {formatTemperature(currentWeather.main.temp)}
              </Text>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.conditionsContainer}>
                <View style={styles.weatherIcon}>
                  {getWeatherIcon(currentWeather.weather?.[0]?.icon, 28)}
                </View>
                <Text style={styles.weatherDescription}>
                  {currentWeather.weather?.[0]?.description || "Clear"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.alertButton}
                onPress={handleAlertPress}
                activeOpacity={0.7}
              >
                <AlertTriangle size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMapControls = () => (
    <View style={styles.mapControlsContainer}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleLocationPress}
      >
        <MapPin size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  );

  const renderWeatherFilters = () => {
    const filters = [
      {
        id: "precipitation",
        name: "Precipitation",
        icon: Droplets,
        color: "#3B82F6",
      },
      {
        id: "temperature",
        name: "Temperature",
        icon: Thermometer,
        color: "#EF4444",
      },
      { id: "wind", name: "Wind", icon: Wind, color: "#10B981" },
      { id: "clouds", name: "Clouds", icon: Cloud, color: "#6B7280" },
      { id: "lightning", name: "Lightning", icon: Zap, color: "#F59E0B" },
      { id: "air", name: "Air Quality", icon: Eye, color: "#8B5CF6" },
    ];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => {
            const isActive = selectedLayer === filter.id;
            const IconComponent = filter.icon;

            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  isActive && {
                    backgroundColor: filter.color,
                    borderColor: filter.color,
                  },
                ]}
                onPress={() => handleFilterChange(filter.id)}
              >
                <IconComponent
                  size={16}
                  color={isActive ? "#FFFFFF" : filter.color}
                />
                <Text
                  style={[
                    styles.filterText,
                    isActive && { color: "#FFFFFF", fontWeight: "600" },
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTimeControl = () => (
    <View style={styles.timeControlContainer}>
      <View style={styles.timeControl}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          {isPlaying ? (
            <Pause size={16} color="#FFFFFF" />
          ) : (
            <Play size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeLabel}>Current:</Text>
          <Text style={styles.timeText}>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderLayerSelector = () => {
    if (!showLayerSelector) return null;

    const layerLegends = {
      precipitation: {
        title: "Precipitation",
        items: [
          { label: "Light", color: "#93C5FD", intensity: "0-1 mm/h" },
          { label: "Moderate", color: "#3B82F6", intensity: "1-4 mm/h" },
          { label: "Heavy", color: "#1E40AF", intensity: "4+ mm/h" },
        ],
      },
      temperature: {
        title: "Temperature",
        items: [
          { label: "Cold", color: "#60A5FA", intensity: "< 0°C" },
          { label: "Cool", color: "#34D399", intensity: "0-15°C" },
          { label: "Warm", color: "#FBBF24", intensity: "15-25°C" },
          { label: "Hot", color: "#F87171", intensity: "> 25°C" },
        ],
      },
    };

    const currentLegend =
      layerLegends[selectedLayer] || layerLegends.precipitation;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{currentLegend.title}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleLayerSelectorClose}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.legendContainer}>
            {currentLegend.items.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: item.color },
                  ]}
                />
                <View style={styles.legendText}>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendIntensity}>{item.intensity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav title="Weather" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {location ? "Loading weather data..." : "Getting your location..."}
          </Text>
        </View>
      </View>
    );
  }

  if (!currentWeather) {
    return (
      <View style={styles.container}>
        <TopNav title="Weather" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Unable to load weather data</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeWeather}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {getTileUrl() && (
          <UrlTile
            urlTemplate={getTileUrl()}
            maximumZ={10}
            flipY={false}
            shouldReplaceMapContent={false}
            opacity={0.7}
          />
        )}
      </MapView>

      <TopNav title="Weather" />

      {renderWeatherInfoCard()}
      {renderMapControls()}
      {renderWeatherFilters()}
      {renderTimeControl()}
      {renderLayerSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    fontFamily: "Inter",
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  weatherInfoContainer: {
    position: "absolute",
    top: 76,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  weatherCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.8)",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "300",
    color: "#1F2937",
    lineHeight: 52,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 80,
  },
  conditionsContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  weatherIcon: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  weatherDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "capitalize",
    textAlign: "center",
  },
  alertButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  mapControlsContainer: {
    position: "absolute",
    top: 170,
    right: 16,
    zIndex: 15,
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 44,
    height: 44,
  },

  filtersContainer: {
    position: "absolute",
    bottom: 190,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.8)",
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  timeControlContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  timeControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  playButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 32,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  legendIntensity: {
    fontSize: 14,
    color: "#6B7280",
  },
});

export default WeatherScreen;
