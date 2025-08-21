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
import { Ionicons } from "@expo/vector-icons";
import { Search, MessageSquare, MoreHorizontal } from "lucide-react-native";
import * as Location from "expo-location";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { WeatherData, Alert as WeatherAlert } from "../../types";
import { useAuth } from "../../hooks/useAuth";

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

      if (user?.latitude && user?.longitude) {
        setLocation({
          latitude: user.latitude,
          longitude: user.longitude,
          city: user.locationCity || "Your City",
          state: user.addressState || "State",
        });
        return;
      }

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
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: address?.city || "Unknown City",
          state: address?.region || "Unknown State",
        });
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
      const weatherResponse = await apiService.getCurrentWeather(lat, lng);

      if (weatherResponse.success && weatherResponse.data) {
        setWeather(weatherResponse.data);
      }
    } catch (error: any) {
      console.error("Error fetching weather:", error);
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
    if (!location) return;

    try {
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

  useEffect(() => {
    getCurrentLocation();
  }, []);

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

  const getAlertIcon = (severity: string) => {
    if (!severity) return "notifications";
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "warning";
      case "HIGH":
        return "alert";
      case "MODERATE":
        return "information-circle";
      case "LOW":
        return "notifications";
      default:
        return "notifications";
    }
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°F`;
  };

  const renderWeatherCard = () => {
    if (!weather) return null;

    return (
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={Colors.text.secondary} />
            <Text style={styles.locationText}>
              {location?.city}, {location?.state}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLocationRefresh}
            disabled={locationLoading}
            style={styles.refreshButton}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={Colors.primary[600]} />
            ) : (
              <Ionicons name="refresh" size={16} color={Colors.primary[600]} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.weatherContent}>
          <View style={styles.mainWeather}>
            <Ionicons
              name={getWeatherIcon(weather.condition) as any}
              size={64}
              color={
                Colors.weather[
                  getWeatherIcon(
                    weather.condition
                  ) as keyof typeof Colors.weather
                ] || Colors.primary[600]
              }
            />
            <View style={styles.temperatureInfo}>
              <Text style={styles.temperature}>
                {formatTemperature(weather.temperature)}
              </Text>
              <Text style={styles.condition}>{weather.condition}</Text>
              <Text style={styles.description}>{weather.description}</Text>
            </View>
          </View>

          <View style={styles.weatherDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="water" size={16} color={Colors.primary[600]} />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="speedometer"
                  size={16}
                  color={Colors.primary[600]}
                />
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{weather.windSpeed} mph</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="eye" size={16} color={Colors.primary[600]} />
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>{weather.visibility} mi</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="thermometer"
                  size={16}
                  color={Colors.primary[600]}
                />
                <Text style={styles.detailLabel}>Pressure</Text>
                <Text style={styles.detailValue}>{weather.pressure} mb</Text>
              </View>
            </View>
          </View>
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
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={Colors.success[600]}
            />
            <Text style={styles.noAlertsText}>No active weather alerts</Text>
            <Text style={styles.noAlertsSubtext}>
              We'll notify you if any alerts are issued for your area
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Ionicons
                  name={getAlertIcon(alert.severity) as any}
                  size={20}
                  color={getAlertColor(alert.severity)}
                />
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
          ))
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
          <Ionicons
            name="cloud-offline"
            size={64}
            color={Colors.neutral[400]}
          />
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
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Weather</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TODO: Implement search functionality
                console.log("Search pressed");
              }}
            >
              <Search size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TODO: Implement messages functionality
                console.log("Messages pressed");
              }}
            >
              <MessageSquare size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TODO: Implement more options functionality
                console.log("More options pressed");
              }}
            >
              <MoreHorizontal size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
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
          {renderAlertsSection()}
        </ScrollView>
      </SafeAreaView>
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
  contentContainer: {
    paddingBottom: 100,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
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
});
