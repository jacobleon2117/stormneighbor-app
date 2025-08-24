import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Snowflake,
  Droplets,
  Wind,
  Eye,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Info,
  Bell,
  CloudOff,
  Navigation,
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { WeatherData, Alert as WeatherAlert } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../../components/UI/Header";
import WeatherLegend from "../../components/Weather/WeatherLegend";
import { router } from "expo-router";

export default function WeatherScreen() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<MapView>(null);
  const [legendVisible, setLegendVisible] = useState(false);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [weatherLayers, setWeatherLayers] = useState<Record<string, boolean>>({
    precipitation: false,
    clouds: false,
    wind: false,
    temperature: false,
    alerts: true,
  });

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please grant location access to get weather data for your area.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", "Failed to request location permission.");
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      console.log("Weather screen - user data:", {
        hasUser: !!user,
        lat: user?.latitude,
        lng: user?.longitude,
        city: user?.locationCity,
        state: user?.addressState,
      });

      if (user?.latitude && user?.longitude) {
        console.log("Using saved user location for weather");
        setLocation({
          latitude: user.latitude,
          longitude: user.longitude,
          city: user.locationCity || "Your City",
          state: user.addressState || "State",
        });
        return;
      }

      console.log("No saved location found, requesting GPS permission");

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: "New York",
          state: "NY",
        });
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const address = reverseGeocode[0];
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: address?.city || "Unknown City",
          state: address?.region || "Unknown State",
        };
        setLocation(newLocation);
        setMapRegion((prev) => ({
          ...prev,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        }));
      } catch (locationError) {
        console.error("Error getting current location:", locationError);
        setLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: "New York",
          state: "NY",
        });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      setLocation({
        latitude: 40.7128,
        longitude: -74.006,
        city: "New York",
        state: "NY",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      console.log(`Fetching weather data for coordinates: ${lat}, ${lng}`);
      const weatherResponse = await apiService.getCurrentWeather(lat, lng);

      console.log("Weather API response:", {
        success: weatherResponse.success,
        hasData: !!weatherResponse.data,
        dataKeys: weatherResponse.data
          ? Object.keys(weatherResponse.data)
          : null,
      });

      if (weatherResponse.success && weatherResponse.data) {
        console.log("Setting weather data:", weatherResponse.data);
        setWeather(weatherResponse.data);
      } else {
        console.log("Weather API response failed or no data");
      }
    } catch (error: any) {
      console.error("Error fetching weather:", error);
      console.error("Weather API error details:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
      throw error;
    }
  };

  const fetchAlerts = async (
    city?: string,
    state?: string,
    lat?: number,
    lng?: number
  ) => {
    try {
      const alertParams: any = {};

      if (city && state) {
        alertParams.city = city;
        alertParams.state = state;
      } else if (lat && lng) {
        alertParams.latitude = lat;
        alertParams.longitude = lng;
      }

      const alertsResponse = await apiService.getAlerts(alertParams);

      if (alertsResponse.success && alertsResponse.data) {
        const activeAlerts = (
          alertsResponse.data.alerts || alertsResponse.data
        ).filter((alert: WeatherAlert) => alert.isActive);
        setAlerts(activeAlerts);
      }
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
    }
  };

  const loadWeatherData = async (isRefresh = false) => {
    if (!location) {
      console.log("No location available for weather data");
      return;
    }

    const now = Date.now();
    if (!isRefresh && now - lastApiCall < 10000) {
      console.log("Throttling weather API call");
      return;
    }

    try {
      console.log("Loading weather data for location:", location);
      setLastApiCall(now);
      if (!isRefresh) setLoading(true);
      setError(null);

      await Promise.all([
        fetchWeatherData(location.latitude, location.longitude),
        fetchAlerts(
          location.city,
          location.state,
          location.latitude,
          location.longitude
        ),
      ]);
      console.log("Weather data loaded successfully");
    } catch (error: any) {
      console.error("Error loading weather data:", error);
      setError(error.response?.data?.message || "Failed to load weather data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeatherData(true);
  }, [location]);

  const handleLocationRefresh = () => {
    getCurrentLocation();
  };

  const handleSearchPress = () => {
    router.push("/(tabs)/search");
  };

  const handleMessagesPress = () => {
    router.push("/(tabs)/notifications");
  };

  const handleMorePress = () => {
    router.push("/(tabs)/profile");
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleMyLocation = () => {
    if (mapRef.current && location) {
      const userRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setMapRegion(userRegion);
      mapRef.current.animateToRegion(userRegion, 500);
    }
  };

  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    console.log(`Weather layer ${layerId} ${enabled ? "enabled" : "disabled"}`);
    setWeatherLayers(prev => ({
      ...prev,
      [layerId]: enabled,
    }));
  };

  const handleLegendToggle = () => {
    setLegendVisible(!legendVisible);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const userHasLocation = user?.latitude && user?.longitude;
    console.log("User profile changed, has location:", userHasLocation);
    if (userHasLocation) {
      getCurrentLocation();
    }
  }, [user?.latitude, user?.longitude]);

  useEffect(() => {
    if (location) {
      loadWeatherData();
    }
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    if (!condition) return "partly-sunny";
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) {
      return "sunny";
    } else if (lowerCondition.includes("cloud")) {
      return "cloudy";
    } else if (lowerCondition.includes("rain")) {
      return "rainy";
    } else if (lowerCondition.includes("storm")) {
      return "thunderstorm";
    } else if (lowerCondition.includes("snow")) {
      return "snow";
    }
    return "partly-sunny";
  };

  const getAlertColor = (severity: string) => {
    if (!severity) return Colors.neutral[500];
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return Colors.error[600];
      case "HIGH":
        return Colors.warning[600];
      case "MODERATE":
        return Colors.primary[600];
      case "LOW":
        return Colors.neutral[500];
      default:
        return Colors.neutral[500];
    }
  };

  const getAlertLucideIcon = (severity: string) => {
    if (!severity) return Bell;
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return AlertOctagon;
      case "HIGH":
        return AlertTriangle;
      case "MODERATE":
        return Info;
      case "LOW":
        return Bell;
      default:
        return Bell;
    }
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°F`;
  };

  const getWeatherLucideIcon = (condition: string) => {
    const lowerCondition = condition?.toLowerCase() || "";
    if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) {
      return Sun;
    } else if (lowerCondition.includes("cloud")) {
      return Cloud;
    } else if (lowerCondition.includes("rain")) {
      return CloudRain;
    } else if (lowerCondition.includes("storm")) {
      return Zap;
    } else if (lowerCondition.includes("snow")) {
      return Snowflake;
    }
    return Sun;
  };

  const renderWeatherCard = () => {
    if (!weather) return null;

    const WeatherIcon = getWeatherLucideIcon(
      weather.current?.shortForecast || weather.condition
    );

    return (
      <View style={styles.compactWeatherCard}>
        <View style={styles.cardHeader}>
          <View style={styles.locationInfo}>
            <MapPin size={14} color={Colors.text.secondary} />
            <Text style={styles.locationText}>
              {location?.city}, {location?.state}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {alerts.length > 0 && (
              <View style={styles.severeBadge}>
                <AlertTriangle size={12} color={Colors.error[600]} />
                <Text style={styles.badgeText}>
                  {alerts.length === 1
                    ? "Weather Alert"
                    : `${alerts.length} Alerts`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mainWeatherRow}>
          <WeatherIcon size={32} color={Colors.primary[600]} />
          <View style={styles.temperatureSection}>
            <Text style={styles.compactTemperature}>
              {formatTemperature(
                weather.current?.temperature || weather.temperature
              )}
            </Text>
            <Text style={styles.compactCondition}>
              {weather.current?.shortForecast || weather.condition}
            </Text>
          </View>
        </View>

        <View style={styles.weatherMetrics}>
          <View style={styles.metricItem}>
            <Wind size={16} color={Colors.text.secondary} />
            <Text style={styles.metricValue}>
              {weather.current?.windSpeed || weather.windSpeed || "N/A"}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Navigation size={16} color={Colors.text.secondary} />
            <Text style={styles.metricValue}>
              {weather.current?.windDirection || "N/A"}
            </Text>
          </View>
          {weather.humidity && (
            <View style={styles.metricItem}>
              <Droplets size={16} color={Colors.text.secondary} />
              <Text style={styles.metricValue}>{weather.humidity}%</Text>
            </View>
          )}
          {weather.visibility && (
            <View style={styles.metricItem}>
              <Eye size={16} color={Colors.text.secondary} />
              <Text style={styles.metricValue}>{weather.visibility} mi</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAlertsSection = () => {
    return (
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>
          Weather Alerts ({alerts.length})
        </Text>

        {alerts.length === 0 ? (
          <View style={styles.noAlertsContainer}>
            <CheckCircle size={32} color={Colors.success[600]} />
            <Text style={styles.noAlertsText}>No active weather alerts</Text>
            <Text style={styles.noAlertsSubtext}>
              We'll notify you if any alerts are issued for your area
            </Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const AlertIcon = getAlertLucideIcon(alert.severity);
            return (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <AlertIcon size={20} color={getAlertColor(alert.severity)} />
                  <Text
                    style={[
                      styles.alertSeverity,
                      { color: getAlertColor(alert.severity) },
                    ]}
                  >
                    {alert.severity} ALERT
                  </Text>
                </View>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription} numberOfLines={3}>
                  {alert.description}
                </Text>
                {alert.endTime && (
                  <Text style={styles.alertTime}>
                    Until {new Date(alert.endTime).toLocaleDateString()} at{" "}
                    {new Date(alert.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>
    );
  };

  if (loading && !weather) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !weather) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <CloudOff size={64} color={Colors.neutral[400]} />
          <Text style={styles.errorTitle}>Weather Unavailable</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadWeatherData()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Weather"
        showSearch={true}
        showNotifications={true}
        showMessages={true}
        onSearchPress={handleSearchPress}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onMessagesPress={() => router.push("/(tabs)/messages")}
      />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
          mapType="standard"
        />

        <SafeAreaView style={styles.overlayContent} pointerEvents="box-none">
          <View style={styles.topOverlay} pointerEvents="box-none">
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              pointerEvents="box-none"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Colors.primary[600]]}
                  tintColor={Colors.primary[600]}
                />
              }
            >
              {renderWeatherCard()}
            </ScrollView>
          </View>

          <View style={styles.zoomControls} pointerEvents="box-none">
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
              <Plus size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
              <Minus size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleMyLocation}
            >
              <Navigation size={20} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <WeatherLegend
            onLayerToggle={handleLayerToggle}
            visible={legendVisible}
            onToggleVisibility={handleLegendToggle}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollView: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingTop: 24,
  },
  weatherCard: {
    backgroundColor: Colors.background,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 4,
  },
  weatherContent: {
    gap: 24,
  },
  mainWeather: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  temperatureInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.text.primary,
    lineHeight: 56,
  },
  condition: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  weatherDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 24,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  alertsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  noAlertsContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 12,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[600],
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  compactWeatherCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[100],
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.error[600],
  },
  mainWeatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  temperatureSection: {
    flex: 1,
  },
  compactTemperature: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  compactCondition: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  weatherMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricItem: {
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  zoomControls: {
    position: "absolute",
    right: 20,
    top: 250,
    gap: 12,
    zIndex: 10,
    alignItems: "center",
  },
  zoomButton: {
    backgroundColor: Colors.background,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
