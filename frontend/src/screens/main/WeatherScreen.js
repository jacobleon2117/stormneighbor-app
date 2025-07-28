// File: frontend/src/screens/main/WeatherScreen.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import MapView, { UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import {
  MapPin,
  Play,
  Pause,
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

const OPENWEATHER_API_KEY = "2a8fe08c288abdad20a5f3fa9a21d8bd";

const WeatherScreen = ({ user }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 36.1539,
    longitude: -95.9928,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  });
  const [selectedLayer, setSelectedLayer] = useState("precipitation");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initializeWeather();
  }, []);

  const initializeWeather = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError("Failed to get location. Please check your settings.");
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      if (!OPENWEATHER_API_KEY) {
        // Mock data for testing - need to update this
        setCurrentWeather({
          name: "Owasso",
          main: { temp: 72 },
          weather: [{ description: "Partly cloudy", icon: "02d" }],
        });
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      setCurrentWeather(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setError("Failed to load weather data");
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode, size = 32) => {
    if (!iconCode) return <Cloud size={size} color={colors.text.primary} />;

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
    return <IconComponent size={size} color={colors.text.primary} />;
  };

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return "0°F";
    }
    return `${Math.round(temp)}°F`;
  };

  const getTileUrl = () => {
    if (!OPENWEATHER_API_KEY) {
      return null;
    }

    const layerMap = {
      precipitation: "precipitation_new",
      temperature: "temp_new",
      wind: "wind_new",
      clouds: "clouds_new",
    };

    return `https://tile.openweathermap.org/map/${layerMap[selectedLayer]}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
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
      await initializeWeather();
    }
  };

  const handleFilterChange = (filterId) => {
    setSelectedLayer(filterId);
  };

  const renderWeatherCard = () => (
    <View style={styles.weatherCard}>
      {loading ? (
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              globalStyles.caption,
              { marginTop: spacing.sm, color: colors.text.primary },
            ]}
          >
            Loading weather...
          </Text>
        </View>
      ) : error ? (
        <View style={globalStyles.center}>
          <AlertTriangle size={32} color={colors.error} />
          <Text
            style={[
              globalStyles.body,
              {
                textAlign: "center",
                marginTop: spacing.sm,
                color: colors.text.primary,
              },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[globalStyles.buttonPrimary, { marginTop: spacing.md }]}
            onPress={initializeWeather}
          >
            <Text style={globalStyles.buttonPrimaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : currentWeather ? (
        <View>
          <Text style={styles.locationText}>
            {currentWeather.name || "Current Location"}
          </Text>

          <View style={styles.tempRow}>
            <Text style={styles.temperatureText}>
              {formatTemperature(currentWeather.main.temp)}
            </Text>
            <View style={styles.weatherIconContainer}>
              {getWeatherIcon(currentWeather.weather?.[0]?.icon, 48)}
            </View>
          </View>

          <Text style={styles.conditionsText}>
            {currentWeather.weather?.[0]?.description || "Clear"}
          </Text>
        </View>
      ) : (
        <View style={globalStyles.center}>
          <Text style={[globalStyles.body, { color: colors.text.primary }]}>
            No weather data available
          </Text>
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
                    isActive && {
                      color: colors.text.inverse,
                      fontWeight: "600",
                    },
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
      >
        <MapPin size={20} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );

  if (!OPENWEATHER_API_KEY) {
    return (
      <ScreenLayout title="Weather">
        <View style={globalStyles.emptyContainer}>
          <Cloud size={64} color={colors.text.muted} />
          <Text style={globalStyles.emptyTitle}>
            Weather API Setup Required
          </Text>
          <Text style={globalStyles.emptyText}>
            Add your OpenWeatherMap API key to view weather data. Get a free API
            key at openweathermap.org
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Weather" scrollable={false} contentPadding={false}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
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
    padding: spacing.lg,
    borderRadius: 16,
    ...globalStyles.card,
  },

  locationText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
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
  },

  weatherIconContainer: {
    alignItems: "center",
  },

  conditionsText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    textTransform: "capitalize",
  },

  filtersContainer: {
    position: "absolute",
    bottom: spacing.xxxxl + 80,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },

  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: spacing.xs,
    ...globalStyles.card,
  },

  filterText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
  },

  mapControls: {
    position: "absolute",
    bottom: spacing.xxxxl + 140,
    right: spacing.lg,
  },

  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: spacing.md,
    ...globalStyles.card,
  },
});

export default WeatherScreen;
