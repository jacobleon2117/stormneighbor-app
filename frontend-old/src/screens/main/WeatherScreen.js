// File: frontend/src/screens/main/WeatherScreen.js
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import MapView, { UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import {
  MapPin,
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
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import apiService from "@services/api";

const { width, height } = Dimensions.get("window");

const WeatherScreen = ({ user }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 36.1539,
    longitude: -95.9928,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  });
  const [selectedLayer, setSelectedLayer] = useState("precipitation");

  useEffect(() => {
    initializeWeather();
  }, [user]);

  const initializeWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const userLocationParams = apiService.getUserLocationParams(user);

      if (userLocationParams) {
        console.log("Using user profile location:", userLocationParams);
        setMapRegion({
          latitude: userLocationParams.latitude,
          longitude: userLocationParams.longitude,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        });
        await fetchWeatherData(
          userLocationParams.latitude,
          userLocationParams.longitude
        );
      } else {
        console.log("Getting device location...");
        await getCurrentLocationAndWeather();
      }
    } catch (error) {
      console.error("Error initializing weather:", error);
      setError("Failed to get location. Please check your settings.");
      setLoading(false);
    }
  };

  const getCurrentLocationAndWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission is required for weather data");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = currentLocation.coords;
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 1.0,
        longitudeDelta: 1.0,
      });

      await fetchWeatherData(latitude, longitude);
    } catch (error) {
      console.error("Error getting current location:", error);
      setError("Failed to get current location");
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      console.log(`Fetching weather for ${lat}, ${lon}`);

      const tempUser = {
        location: {
          coordinates: { latitude: lat, longitude: lon },
        },
      };

      const result = await apiService.getCurrentWeather(tempUser);

      if (result.success) {
        console.log("Weather data loaded successfully");
        setWeatherData(result.data);
        setError(null);
      } else {
        console.error("Weather API error:", result.error);
        setError(result.error || "Failed to load weather data");
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
      setError("Failed to load weather data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mapRegion) {
      await fetchWeatherData(mapRegion.latitude, mapRegion.longitude);
    } else {
      await initializeWeather();
    }
    setRefreshing(false);
  }, [mapRegion]);

  const getWeatherIcon = (iconUrl, description, size = 32) => {
    if (!description) return <Cloud size={size} color={colors.text.primary} />;

    const desc = description.toLowerCase();

    if (desc.includes("sun") || desc.includes("clear"))
      return <Sun size={size} color={colors.warning} />;
    if (desc.includes("rain"))
      return <CloudRain size={size} color={colors.primary} />;
    if (desc.includes("snow"))
      return <CloudSnow size={size} color={colors.text.muted} />;
    if (desc.includes("drizzle"))
      return <CloudDrizzle size={size} color={colors.primary} />;
    if (desc.includes("thunder") || desc.includes("storm"))
      return <Zap size={size} color={colors.warning} />;

    return <Cloud size={size} color={colors.text.primary} />;
  };

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return "0°F";
    }
    return `${Math.round(temp)}°F`;
  };

  const handleLocationPress = async () => {
    try {
      setLoading(true);
      await initializeWeather();
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
    }
  };

  const handleFilterChange = (filterId) => {
    setSelectedLayer(filterId);
  };

  const toggleCardSize = () => {
    setIsCardMinimized(!isCardMinimized);
  };

  const renderWeatherCard = () => (
    <View
      style={[
        styles.weatherCard,
        isCardMinimized && styles.weatherCardMinimized,
      ]}
    >
      {loading ? (
        <View style={globalStyles.emptyContainer}>
          <AlertTriangle size={32} color={colors.error} />
          <Text style={globalStyles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "medium"),
              { marginTop: spacing.lg },
            ]}
            onPress={initializeWeather}
          >
            <Text style={globalStyles.buttonPrimaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : weatherData ? (
        <View>
          <View style={styles.locationHeader}>
            <Text style={styles.locationText}>
              {weatherData.location.name || "Current Location"}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={onRefresh}
                disabled={refreshing}
                style={styles.actionButton}
              >
                <RefreshCw
                  size={16}
                  color={colors.text.muted}
                  style={refreshing ? styles.spinning : {}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleCardSize}
                style={styles.actionButton}
              >
                {isCardMinimized ? (
                  <Maximize2 size={16} color={colors.text.muted} />
                ) : (
                  <Minimize2 size={16} color={colors.text.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!isCardMinimized && (
            <>
              <View style={styles.tempRow}>
                <Text style={styles.temperatureText}>
                  {formatTemperature(weatherData.current.temperature)}
                </Text>
                <View style={styles.weatherIconContainer}>
                  {getWeatherIcon(
                    weatherData.current.icon,
                    weatherData.current.shortForecast,
                    48
                  )}
                </View>
              </View>

              <Text style={styles.conditionsText}>
                {weatherData.current.shortForecast || "Clear"}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Thermometer size={12} color={colors.text.muted} />
                  <Text style={styles.detailLabel}>Feels like</Text>
                  <Text style={styles.detailValue}>
                    {formatTemperature(weatherData.current.feelsLike)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Droplets size={12} color={colors.text.muted} />
                  <Text style={styles.detailLabel}>Humidity</Text>
                  <Text style={styles.detailValue}>
                    {weatherData.current.humidity || 0}%
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Wind size={12} color={colors.text.muted} />
                  <Text style={styles.detailLabel}>Wind</Text>
                  <Text style={styles.detailValue}>
                    {weatherData.current.windSpeed || "0 mph"}
                  </Text>
                </View>
              </View>

              <Text style={styles.sourceText}>
                Source: {weatherData.source} • Updated:{" "}
                {new Date(weatherData.lastUpdated).toLocaleTimeString()}
              </Text>
            </>
          )}

          {isCardMinimized && (
            <View style={styles.minimizedContent}>
              <Text style={styles.minimizedTemp}>
                {formatTemperature(weatherData.current.temperature)}
              </Text>
              <Text style={styles.minimizedCondition}>
                {weatherData.current.shortForecast || "Clear"}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyText}>No weather data available</Text>
        </View>
      )}
    </View>
  );

  const renderFilters = () => {
    const filters = [
      {
        id: "precipitation",
        name: "Rain",
        icon: Droplets,
        color: colors.primary,
      },
      {
        id: "temperature",
        name: "Temp",
        icon: Thermometer,
        color: colors.error,
      },
      { id: "wind", name: "Wind", icon: Wind, color: colors.success },
      { id: "clouds", name: "Clouds", icon: Cloud, color: colors.text.muted },
    ];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
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
                  color={isActive ? colors.text.inverse : filter.color}
                />
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
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

  const renderMapControls = () => (
    <View style={styles.mapControls}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleLocationPress}
        disabled={loading}
      >
        <MapPin size={20} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout
      title="Weather"
      scrollable={false}
      contentPadding={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
        />

        {renderWeatherCard()}
        {renderMapControls()}
        {renderFilters()}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  weatherCard: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  weatherCardMinimized: {
    paddingVertical: spacing.md,
  },

  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
  },

  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  actionButton: {
    padding: spacing.xs,
  },

  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  temperatureText: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -2,
  },

  weatherIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },

  conditionsText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    textTransform: "capitalize",
    marginBottom: spacing.md,
    fontWeight: "500",
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },

  detailItem: {
    alignItems: "center",
    gap: 2,
  },

  detailLabel: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: "500",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },

  sourceText: {
    fontSize: 10,
    color: colors.text.muted,
    textAlign: "center",
    marginTop: spacing.xs,
    fontStyle: "italic",
  },

  minimizedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  minimizedTemp: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },

  minimizedCondition: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: "capitalize",
    fontWeight: "500",
  },

  mapControls: {
    position: "absolute",
    bottom: spacing.xl * 4,
    right: spacing.lg,
  },

  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },

  filtersContainer: {
    position: "absolute",
    bottom: spacing.xl,
    left: 0,
    right: 0,
  },

  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.primary,
  },

  filterTextActive: {
    color: colors.text.inverse,
    fontWeight: "600",
  },

  spinning: {
    transform: [{ rotate: "360deg" }],
  },
});

export default WeatherScreen;
