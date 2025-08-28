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
  Modal,
  Dimensions,
} from "react-native";
import {
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
  CloudOff,
  Navigation,
  Info,
} from "lucide-react-native";
import MapView, { PROVIDER_DEFAULT, UrlTile, Polygon, Marker } from "react-native-maps";
import { Colors } from "../../constants/Colors";
import { WEATHER_CONFIG } from "../../constants/config";
import { apiService } from "../../services/api";
import { locationService } from "../../services/locationService";
import { WeatherData, Alert as WeatherAlert, Post } from "../../types";
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
    source: 'current' | 'home' | 'fallback';
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<MapView>(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [weatherLayers, setWeatherLayers] = useState<Record<string, boolean>>({
    precipitation: false,
    clouds: false,
    wind: false,
    temperature: false,
    severe_weather: false,
    weather_alerts: false,
    safety_alerts: false,
    community_alerts: false,
    help_needed: false,
  });
  const [rainTimestamp, setRainTimestamp] = useState<number>(Date.now());
  const [userLocationWeatherData, setUserLocationWeatherData] = useState<Array<{
    id: string;
    locationName: string;
    locationType: 'current' | 'home';
    latitude: number;
    longitude: number;
    temperature: number;
    windSpeed: string;
    condition: string;
  }>>([]);
  const [communityAlerts, setCommunityAlerts] = useState<Post[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | Post | null>(null);

  const requestLocationPermission = async () => {
    try {
      const canUse = await locationService.canUseLocationFor('weather');
      
      if (!canUse) {
        await locationService.showPermissionDeniedAlert('accurate weather data');
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", "Failed to request location permission.");
      return false;
    }
  };

  const getCurrentLocation = useCallback(async () => {
    try {

      console.log("Weather screen - determining best location for weather");


      const homeLocation = user?.homeLatitude && user?.homeLongitude 
        ? { latitude: user.homeLatitude, longitude: user.homeLongitude }
        : user?.latitude && user?.longitude 
        ? { latitude: user.latitude, longitude: user.longitude }
        : undefined;

      const bestLocation = locationService.getBestLocationFor(
        'weather',
        homeLocation,
        user?.locationPreferences
      );

      if (bestLocation && bestLocation.source === 'current') {
        console.log("Using current GPS location for weather");
        const address = await locationService.reverseGeocode(
          bestLocation.latitude,
          bestLocation.longitude
        );
        setLocation({
          latitude: bestLocation.latitude,
          longitude: bestLocation.longitude,
          city: address?.city || "Current Location",
          state: address?.region || "Unknown",
          source: 'current',
        });
        return;
      }

      if (bestLocation && bestLocation.source === 'home') {
        console.log("Using home address for weather");
        setLocation({
          latitude: bestLocation.latitude,
          longitude: bestLocation.longitude,
          city: user?.homeCity || user?.locationCity || "Your City",
          state: user?.homeState || user?.addressState || "State",
          source: 'home',
        });
        return;
      }

      console.log("No saved location found, requesting current GPS location");
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log("Location permission denied, using fallback location");
        setLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: "New York",
          state: "NY",
          source: 'fallback',
        });
        return;
      }

      try {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          const address = await locationService.reverseGeocode(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            city: address?.city || "Current Location",
            state: address?.region || "Unknown",
            source: 'current',
          });
        } else {
          throw new Error('Unable to get current location');
        }

        setMapRegion((prev) => ({
          ...prev,
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }));
      } catch (locationError) {
        console.error("Error getting current location:", locationError);
        setLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: "New York",
          state: "NY",
          source: 'fallback',
        });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      setLocation({
        latitude: 40.7128,
        longitude: -74.006,
        city: "New York",
        state: "NY",
        source: 'fallback',
      });
    }
  }, [user]);

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

  const fetchCommunityAlerts = async () => {
    try {
      const response = await apiService.getPosts({
        page: 1,
        limit: 20,
        postType: "safety_alert",
      });

      if (response.success && response.data) {
        const posts = response.data.posts || response.data;
        const recentAlerts = posts.filter((post: Post) => {
          const postDate = new Date(post.createdAt);
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          return (
            postDate > threeDaysAgo &&
            (post.isEmergency || post.priority === "urgent" || post.priority === "high")
          );
        });
        setCommunityAlerts(recentAlerts);
        console.log(`Found ${recentAlerts.length} recent community alerts`);
      }
    } catch (error: any) {
      console.error("Error fetching community alerts:", error);
    }
  };

  const loadWeatherData = useCallback(async (isRefresh = false) => {
    if (!location) {
      console.log("No location available for weather data");
      return;
    }

    const now = Date.now();
    if (!isRefresh && now - lastApiCall < 30000) {
      console.log("Throttling weather API call - waiting 30 seconds between calls");
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
        fetchCommunityAlerts(),
      ]);
      console.log("Weather data loaded successfully");
    } catch (error: any) {
      console.error("Error loading weather data:", error);
      setError(error.response?.data?.message || "Failed to load weather data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, lastApiCall]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeatherData(true);
  }, [location, loadWeatherData]);

  const handleSearchPress = () => {
    router.push("/(tabs)/search");
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
    console.log(`Weather layer ${layerId} ${enabled ? "ENABLED" : "DISABLED"}`);
    
    if (enabled) {
      console.log('WEATHER_CONFIG.OPENWEATHER_API_KEY available:', !!WEATHER_CONFIG.OPENWEATHER_API_KEY);
      if (WEATHER_CONFIG.OPENWEATHER_API_KEY) {
        console.log('API Key starts with:', WEATHER_CONFIG.OPENWEATHER_API_KEY.substring(0, 8) + '...');
      }
    }
    
    setWeatherLayers(prev => {
      let newLayers = { ...prev };
      
      if (enabled) {
        Object.keys(newLayers).forEach(layer => {
          newLayers[layer] = false;
        });
        newLayers[layerId] = true;
      } else {
        newLayers[layerId] = false;
      }
      
      console.log(`Updated weather layers (single selection):`, newLayers);
      return newLayers;
    });

    if (enabled) {
      const layerNames = {
        precipitation: 'Rain & Snow',
        clouds: 'Cloud Cover', 
        wind: 'Wind Patterns',
        temperature: 'Temperature',
        alerts: 'Weather Alerts'
      };
      
      const layerName = layerNames[layerId as keyof typeof layerNames] || layerId;
      
      if (layerId === 'clouds' || layerId === 'wind' || layerId === 'temperature') {
        if (!WEATHER_CONFIG.OPENWEATHER_API_KEY) {
          console.warn(`${layerName} overlay enabled but NO API KEY found - overlay will not display`);
        } else {
          console.log(`${layerName} overlay enabled with API key - should display`);
        }
      }
      
      if (layerId === 'precipitation') {
        const timestamp = Math.floor(rainTimestamp / 1000 / 600) * 600;
        console.log(`Precipitation overlay enabled - using timestamp: ${timestamp}`);
        console.log(`RainViewer URL pattern: https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/${timestamp}/1_1.png`);
        console.log(`Test URL for zoom 5: https://tilecache.rainviewer.com/v2/radar/5/122/80/${timestamp}/1_1.png`);
        
        fetch('https://tilecache.rainviewer.com/api/maps.json')
          .then(response => response.json())
          .then(data => {
            console.log('Latest RainViewer timestamps:', data.slice(-3));
            const latestTimestamp = data[data.length - 1];
            console.log(`Using latest timestamp: ${latestTimestamp}`);
            setRainTimestamp(latestTimestamp * 1000);
          })
          .catch(error => console.error('Failed to fetch RainViewer timestamps:', error));
      }
      
      if (layerId === 'alerts') {
        console.log(`Alerts overlay enabled - found ${alerts.length} active alerts`);
        if (alerts.length > 0) {
          alerts.forEach((alert, index) => {
            console.log(`Alert ${index + 1}: ${alert.severity} - ${alert.title}`);
            console.log(`  Area: ${alert.areaDesc || 'Unknown area'}`);
            console.log(`  Effective: ${alert.effective || 'Now'} until ${alert.expires || 'Unknown'}`);
          });
        } else {
          console.log('No active weather alerts in your area - all clear!');
          
          setTimeout(() => {
            Alert.alert(
              "No Weather Alerts",
              "Great news! There are currently no active weather alerts in your area.",
              [{ text: "OK" }]
            );
          }, 500);
        }
      }
    }
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

  useEffect(() => {
    fetchUserLocationWeatherData();
  }, [fetchUserLocationWeatherData]);



  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°F`;
  };

  const getAlertPolygonColors = (severity: string) => {
    const colors = {
      'CRITICAL': { stroke: '#DC2626', fill: '#DC262620' },
      'HIGH': { stroke: '#EA580C', fill: '#EA580C20' }, 
      'MODERATE': { stroke: '#CA8A04', fill: '#CA8A0420' },
      'LOW': { stroke: '#059669', fill: '#05966920' },
    };
    return colors[severity as keyof typeof colors] || colors.MODERATE;
  };

  const generateAlertPolygon = (alert: WeatherAlert) => {
    if (alert.coordinates && alert.coordinates.length > 0) {
      return alert.coordinates;
    }
    
    if (!location) return [];
    
    const baseCoords = {
      latitude: location.latitude,
      longitude: location.longitude
    };
    
    let offset = 0.05;
    
    const alertType = alert.title?.toLowerCase() || '';
    const severity = alert.severity?.toLowerCase() || '';
    
    if (alertType.includes('tornado')) {
      offset = 0.02;
    } else if (alertType.includes('flood') || alertType.includes('hurricane')) {
      offset = 0.15;
    } else if (alertType.includes('thunderstorm') || alertType.includes('severe weather')) {
      offset = 0.08;
    } else if (alertType.includes('winter') || alertType.includes('snow') || alertType.includes('ice')) {
      offset = 0.12;
    }
    
    const points = 8;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (2 * Math.PI * i) / points;
      const latOffset = offset * Math.cos(angle) * 0.8 + (Math.random() - 0.5) * offset * 0.2;
      const lngOffset = offset * Math.sin(angle) * 0.8 + (Math.random() - 0.5) * offset * 0.2;
      
      coordinates.push({
        latitude: baseCoords.latitude + latOffset,
        longitude: baseCoords.longitude + lngOffset
      });
    }
    
    return coordinates;
  };

  const fetchUserLocationWeatherData = useCallback(async () => {
    if (!WEATHER_CONFIG.OPENWEATHER_API_KEY) {
      console.log('No API key available for location weather data');
      return;
    }

    console.log('Fetching weather data for user locations...');
    
    const locations = [];

    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        const address = await locationService.reverseGeocode(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        locations.push({
          id: 'current',
          locationName: `${address?.city || 'Current'}, ${address?.region || ''}`.replace(', ', ', ').replace(', ,', ',').replace(/,$/, ''),
          locationType: 'current' as const,
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });
      }
    } catch (error) {
      console.log('Could not get current location for weather marker');
    }

    if (user?.homeLatitude && user?.homeLongitude) {
      locations.push({
        id: 'home',
        locationName: user?.homeCity && user?.homeState 
          ? `${user.homeCity}, ${user.homeState}`
          : 'Home',
        locationType: 'home' as const,
        latitude: user.homeLatitude,
        longitude: user.homeLongitude
      });
    } else if (user?.latitude && user?.longitude && !locations.find(loc => loc.id === 'current')) {
      locations.push({
        id: 'home',
        locationName: user?.locationCity && user?.addressState 
          ? `${user.locationCity}, ${user.addressState}`
          : 'Home',
        locationType: 'home' as const,
        latitude: user.latitude,
        longitude: user.longitude
      });
    }

    console.log(`Fetching weather for ${locations.length} user locations:`, locations.map(l => l.locationName));

    const weatherPromises = locations.map(async (location) => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${WEATHER_CONFIG.OPENWEATHER_API_KEY}&units=imperial`
        );
        const data = await response.json();
        
        return {
          ...location,
          temperature: Math.round(data.main.temp),
          windSpeed: `${Math.round(data.wind?.speed || 0)} mph`,
          condition: data.weather[0]?.main || 'Unknown'
        };
      } catch (error) {
        console.error(`Failed to fetch weather for ${location.locationName}:`, error);
        return null;
      }
    });

    const results = await Promise.all(weatherPromises);
    const validResults = results.filter(result => result !== null);
    
    console.log(`Successfully fetched weather data for ${validResults.length} user locations`);
    setUserLocationWeatherData(validResults);
  }, [user]);


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

  const isWeatherAlert = (alert: WeatherAlert | Post | null): alert is WeatherAlert => {
    return alert !== null && 'severity' in alert && 'title' in alert && 'description' in alert;
  };

  const isCommunityAlert = (alert: WeatherAlert | Post | null): alert is Post => {
    return alert !== null && 'content' in alert && 'firstName' in alert;
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - alertDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return alertDate.toLocaleDateString();
  };

  const renderAlertModal = () => {
    if (!selectedAlert) return null;

    return (
      <Modal
        visible={showAlertModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowAlertModal(false)}
            >
              <View style={styles.modalCloseIcon}>
                <Text style={styles.modalCloseText}>×</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isWeatherAlert(selectedAlert) ? 'Weather Alert' : 'Community Alert'}
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {isWeatherAlert(selectedAlert) && (
              <View style={styles.weatherAlertContent}>
                <View style={[styles.severityBadge, { backgroundColor: getAlertPolygonColors(selectedAlert.severity).stroke }]}>
                  <Text style={styles.severityText}>{selectedAlert.severity} ALERT</Text>
                </View>
                
                <Text style={styles.alertTitleModal}>{selectedAlert.title}</Text>
                
                <Text style={styles.alertDescriptionModal}>{selectedAlert.description}</Text>
                
                {selectedAlert.areaDesc && (
                  <View style={styles.alertMetaInfo}>
                    <Text style={styles.alertMetaLabel}>Area:</Text>
                    <Text style={styles.alertMetaValue}>{selectedAlert.areaDesc}</Text>
                  </View>
                )}
                
                {selectedAlert.effective && (
                  <View style={styles.alertMetaInfo}>
                    <Text style={styles.alertMetaLabel}>Effective:</Text>
                    <Text style={styles.alertMetaValue}>
                      {new Date(selectedAlert.effective).toLocaleDateString()} at{' '}
                      {new Date(selectedAlert.effective).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
                
                {selectedAlert.expires && (
                  <View style={styles.alertMetaInfo}>
                    <Text style={styles.alertMetaLabel}>Expires:</Text>
                    <Text style={styles.alertMetaValue}>
                      {new Date(selectedAlert.expires).toLocaleDateString()} at{' '}
                      {new Date(selectedAlert.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {isCommunityAlert(selectedAlert) && (
              <View style={styles.communityAlertContent}>
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyText}>
                    {selectedAlert.isEmergency ? 'EMERGENCY' : 'COMMUNITY ALERT'}
                  </Text>
                </View>
                
                <Text style={styles.alertTitleModal}>{selectedAlert.title || 'Community Alert'}</Text>
                
                <Text style={styles.alertDescriptionModal}>{selectedAlert.content}</Text>
                
                <View style={styles.alertAuthorInfo}>
                  <Text style={styles.alertAuthorLabel}>Reported by:</Text>
                  <Text style={styles.alertAuthorName}>
                    {selectedAlert.firstName} {selectedAlert.lastName}
                  </Text>
                </View>
                
                <View style={styles.alertMetaInfo}>
                  <Text style={styles.alertMetaLabel}>Posted:</Text>
                  <Text style={styles.alertMetaValue}>{formatTimeAgo(selectedAlert.createdAt)}</Text>
                </View>
                
                {selectedAlert.locationCity && selectedAlert.locationState && (
                  <View style={styles.alertMetaInfo}>
                    <Text style={styles.alertMetaLabel}>General Area:</Text>
                    <Text style={styles.alertMetaValue}>
                      {selectedAlert.locationCity}, {selectedAlert.locationState}
                    </Text>
                  </View>
                )}
                
                <View style={styles.privacyNotice}>
                  <View style={styles.privacyNoticeContent}>
                    <Info size={12} color={Colors.text.tertiary} />
                    <Text style={styles.privacyNoticeText}>
                      Location shown is approximate for privacy protection
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAlertModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              
              {isCommunityAlert(selectedAlert) && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setShowAlertModal(false);
                    router.push(`/post/${selectedAlert.id}`);
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    View Post
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderWeatherCard = () => {
    if (!weather) return null;

    const WeatherIcon = getWeatherLucideIcon(
      weather.current?.shortForecast || weather.condition
    );

    return (
      <View style={styles.compactWeatherCard}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {location?.city}, {location?.state}
              </Text>
            </View>
            <Text style={styles.compactTemperature}>
              {formatTemperature(
                weather.current?.temperature || weather.temperature
              )}
            </Text>
          </View>

          <View style={styles.topRight}>
            <WeatherIcon size={32} color={Colors.primary[600]} />
            <Text style={styles.compactCondition}>
              {weather.current?.shortForecast || weather.condition}
            </Text>
            <Text style={styles.highLowText}>
              H: {weather.current?.temperatureHigh || "N/A"}° L: {weather.current?.temperatureLow || "N/A"}°
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={styles.metricContent}>
                  <Wind size={14} color={Colors.text.secondary} />
                  <Text style={styles.metricValue}>
                    {weather.current?.windSpeed || weather.windSpeed || "N/A"}
                  </Text>
                </View>
                <Text style={styles.metricLabel}>Wind</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={styles.metricContent}>
                  <Droplets size={14} color={Colors.text.secondary} />
                  <Text style={styles.metricValue}>
                    {weather.humidity || "N/A"}%
                  </Text>
                </View>
                <Text style={styles.metricLabel}>Humidity</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRight}>
            <View style={styles.alertsContainer}>
              {alerts.length > 0 ? (
                <View style={styles.alertBox}>
                  <AlertTriangle size={18} color={Colors.error[600]} />
                  {alerts.length > 1 && (
                    <View style={styles.alertCounter}>
                      <Text style={styles.alertCounterText}>{alerts.length}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noAlertBox}>
                  <CheckCircle size={18} color={Colors.success[600]} />
                </View>
              )}
              <Text style={styles.alertLabel}>
                {alerts.length > 0 ? "Alerts" : "No Alerts"}
              </Text>
            </View>
          </View>
        </View>
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
          onMapReady={() => console.log('Map ready for overlays')}
        >
          {weatherLayers.precipitation && (
            <UrlTile
              urlTemplate={`https://tilecache.rainviewer.com/v2/radar/${Math.floor(rainTimestamp / 1000 / 600) * 600}/256/{z}/{x}/{y}/1/1_1.png`}
              shouldReplaceMapContent={false}
              maximumZ={15}
              minimumZ={1}
              flipY={false}
              zIndex={1}
              opacity={0.7}
              tileSize={256}
              onLoad={() => console.log('Precipitation overlay loaded successfully')}
              onError={(error) => console.error('Precipitation overlay error:', error)}
            />
          )}
          
          {weatherLayers.clouds && WEATHER_CONFIG.OPENWEATHER_API_KEY && (
            <UrlTile
              urlTemplate={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${WEATHER_CONFIG.OPENWEATHER_API_KEY}`}
              shouldReplaceMapContent={false}
              maximumZ={15}
              minimumZ={1}
              flipY={false}
              zIndex={2}
              opacity={0.5}
              tileSize={256}
              onLoad={() => console.log('Clouds overlay loaded successfully')}
              onError={(error) => console.error('Clouds overlay error:', error)}
            />
          )}
          
          {weatherLayers.wind && WEATHER_CONFIG.OPENWEATHER_API_KEY && (
            <UrlTile
              urlTemplate={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${WEATHER_CONFIG.OPENWEATHER_API_KEY}`}
              shouldReplaceMapContent={false}
              maximumZ={15}
              minimumZ={1}
              flipY={false}
              zIndex={3}
              opacity={0.5}
              tileSize={256}
              onLoad={() => console.log('Wind overlay loaded successfully')}
              onError={(error) => console.error('Wind overlay error:', error)}
            />
          )}
          
          {weatherLayers.temperature && WEATHER_CONFIG.OPENWEATHER_API_KEY && (
            <UrlTile
              urlTemplate={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${WEATHER_CONFIG.OPENWEATHER_API_KEY}`}
              shouldReplaceMapContent={false}
              maximumZ={15}
              minimumZ={1}
              flipY={false}
              zIndex={4}
              opacity={0.5}
              tileSize={256}
              onLoad={() => console.log('Temperature overlay loaded successfully')}
              onError={(error) => console.error('Temperature overlay error:', error)}
            />
          )}
          
          {(weatherLayers.severe_weather || weatherLayers.weather_alerts) && alerts.map((alert, index) => {
            const colors = getAlertPolygonColors(alert.severity);
            const coordinates = generateAlertPolygon(alert);
            
            return coordinates.length > 0 ? (
              <Polygon
                key={`alert-${alert.id || index}`}
                coordinates={coordinates}
                strokeColor={colors.stroke}
                fillColor={colors.fill}
                strokeWidth={2}
                onPress={() => {
                  console.log('Weather alert pressed:', alert.title);
                  setSelectedAlert(alert);
                  setShowAlertModal(true);
                }}
              />
            ) : null;
          })}
          
          {(weatherLayers.safety_alerts || weatherLayers.community_alerts || weatherLayers.help_needed) && communityAlerts.map((alert) => {
            if (!alert.latitude || !alert.longitude) return null;
            
            // Create a privacy-safe location by:
            // Rounding to ~2-3 decimal places (roughly 100m-1km accuracy)
            // Adding small random offset to avoid exact location
            // Different handling based on alert type
            
            const getPrivacySafeLocation = (lat: number, lng: number, alertType: string) => {
              let precision = 2;
              
              if (alert.isEmergency) {
                precision = 3;
              }
              
              if (alertType?.toLowerCase().includes('missing') || alertType?.toLowerCase().includes('lost')) {
                precision = 1;
              }
              
              const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);
              const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision);
              
              const randomOffset = 0.002;
              const randomLat = (Math.random() - 0.5) * randomOffset;
              const randomLng = (Math.random() - 0.5) * randomOffset;
              
              return {
                latitude: roundedLat + randomLat,
                longitude: roundedLng + randomLng
              };
            };
            
            const safeLocation = getPrivacySafeLocation(
              alert.latitude, 
              alert.longitude, 
              alert.postType || ''
            );
            
            return (
              <Marker
                key={`community-${alert.id}`}
                coordinate={safeLocation}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={999}
                onPress={() => {
                  console.log('Community alert pressed:', alert.title);
                  setSelectedAlert(alert);
                  setShowAlertModal(true);
                }}
              >
                <View style={styles.communityAlertMarker}>
                  <AlertTriangle size={16} color={Colors.error[600]} />
                  <Text style={styles.alertMarkerText}>
                    {alert.isEmergency ? 'EMERGENCY' : 'ALERT'}
                  </Text>
                </View>
              </Marker>
            );
          })}

          {(weatherLayers.temperature || weatherLayers.wind) && userLocationWeatherData.map((locationData) => (
            <Marker
              key={locationData.id}
              coordinate={{ latitude: locationData.latitude, longitude: locationData.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={1000}
              onPress={() => {
                Alert.alert(
                  `${locationData.locationName}`,
                  `Temperature: ${locationData.temperature}°F\nWind: ${locationData.windSpeed}\nCondition: ${locationData.condition}`,
                  [{ text: "OK" }]
                );
              }}
            >
              <View style={[
                styles.userLocationWeatherMarker,
                locationData.locationType === 'current' 
                  ? styles.currentLocationMarker 
                  : styles.homeLocationMarker
              ]}>
                {weatherLayers.temperature && (
                  <Text style={styles.weatherMarkerText}>{locationData.temperature}°</Text>
                )}
                {weatherLayers.wind && (
                  <Text style={styles.weatherMarkerText}>{locationData.windSpeed}</Text>
                )}
                <Text style={[
                  styles.locationNameText,
                  locationData.locationType === 'current' 
                    ? styles.currentLocationText 
                    : styles.homeLocationText
                ]}>
                  {locationData.locationType === 'current' ? 'Current' : 'Home'}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>

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
              <Plus size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
              <Minus size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleMyLocation}
            >
              <Navigation size={18} color="white" />
            </TouchableOpacity>
          </View>

          <WeatherLegend
            onLayerToggle={handleLayerToggle}
            weatherLayers={weatherLayers}
          />
        </SafeAreaView>
      </View>

      {renderAlertModal()}
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
    flex: 1,
  },
  locationBadge: {
    backgroundColor: Colors.success[100],
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.success[700],
  },
  homeBadge: {
    backgroundColor: Colors.primary[100],
  },
  homeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary[700],
  },
  fallbackBadge: {
    backgroundColor: Colors.neutral[200],
  },
  fallbackBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.neutral[600],
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  topLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  topRight: {
    alignItems: "flex-end",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomLeft: {
    flex: 1,
  },
  bottomRight: {
    alignItems: "center",
  },
  highLowText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  alertsContainer: {
    alignItems: "center",
  },
  alertBox: {
    position: "relative",
    backgroundColor: Colors.error[50],
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.error[100],
  },
  noAlertBox: {
    backgroundColor: Colors.success[50],
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.success[100],
  },
  alertCounter: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.error[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCounterText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: "600",
  },
  alertLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 4,
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
    top: 235,
    gap: 8,
    zIndex: 10,
    alignItems: "center",
  },
  zoomButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  weatherMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  weatherMarkerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  weatherMarkerTextSmall: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  userLocationWeatherMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
  currentLocationMarker: {
    borderColor: Colors.success[500],
  },
  homeLocationMarker: {
    borderColor: Colors.primary[500],
  },
  locationNameText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  currentLocationText: {
    color: Colors.success[700],
  },
  homeLocationText: {
    color: Colors.primary[700],
  },
  communityAlertMarker: {
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error[700],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  alertMarkerText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.text.inverse,
    textAlign: 'center',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalPlaceholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  weatherAlertContent: {
    gap: 16,
  },
  communityAlertContent: {
    gap: 16,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
    letterSpacing: 0.5,
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
    letterSpacing: 0.5,
  },
  alertTitleModal: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 28,
  },
  alertDescriptionModal: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  alertMetaInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  alertMetaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    minWidth: 60,
  },
  alertMetaValue: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  alertAuthorInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
  },
  alertAuthorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  alertAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary[600],
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modalButtonTextPrimary: {
    color: Colors.text.inverse,
  },
  privacyNotice: {
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[300],
  },
  privacyNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyNoticeText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    flex: 1,
  },
});
