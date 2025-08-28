import Constants from "expo-constants";
import { Platform } from "react-native";

export const ENV = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
} as const;

const getDevBaseUrl = () => {
  // Try to detect LAN IP from Metro bundler
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;

  let lanIp: string | null = null;

  if (debuggerHost) {
    // e.g. "192.168.1.89:19000"
    lanIp = debuggerHost.split(":")[0];
  }

  if (Platform.OS === "ios" && Constants.appOwnership !== "expo") {
    // iOS simulator → localhost works
    return "http://127.0.0.1:3000/api/v1";
  }

  // Default to LAN IP if available, else fallback
  return lanIp
    ? `http://${lanIp}:3000/api/v1`
    : "http://127.0.0.1:3000/api/v1"; // safe fallback
};

export const API_CONFIG = {
  BASE_URL: ENV.isDevelopment
    ? "https://stormneighbor-api.onrender.com/api/v1"  // Temporarily force production URL for testing
    : "https://stormneighbor-api.onrender.com/api/v1",
  TIMEOUT: 30000,
} as const;

export const APP_CONFIG = {
  name: "StormNeighbor",
  version: "1.0.0",
  bundleId: "com.stormneighbor.app",
} as const;

export const PUSH_CONFIG = {
  projectId: Constants.expoConfig?.extra?.eas?.projectId || "stormneighbor-app",
} as const;

export const FEATURES = {
  enablePushNotifications: true,
  enableLocationServices: true,
  enableImageUploads: true,
  enableRealTimeUpdates: true,
} as const;

export const WEATHER_CONFIG = {
  OPENWEATHER_API_KEY:
    Constants.expoConfig?.extra?.openWeatherApiKey ||
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ||
    "",
} as const;

export const URL_CONFIG = {
  baseUrl: ENV.isDevelopment
    ? "https://dev.stormneighbor.app"
    : "https://stormneighbor.app",
  appUrl: "stormneighbor://",
} as const;
