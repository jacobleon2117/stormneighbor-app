import Constants from "expo-constants";
import { Platform } from "react-native";

export const ENV = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
} as const;

const getDevBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;

  let lanIp: string | null = null;

  if (debuggerHost) {
    lanIp = debuggerHost.split(":")[0];
  }

  if (Platform.OS === "ios" && Constants.appOwnership !== "expo") {
    return "http://127.0.0.1:3000/api/v1";
  }

  return lanIp
    ? `http://${lanIp}:3000/api/v1`
    : "http://127.0.0.1:3000/api/v1";
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || (ENV.isDevelopment
    ? getDevBaseUrl()
    : "https://stormneighbor-api.onrender.com/api/v1"),
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),
} as const;

export const APP_CONFIG = {
  name: process.env.EXPO_PUBLIC_APP_NAME || "StormNeighbor",
  version: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
  bundleId: process.env.EXPO_PUBLIC_BUNDLE_ID || "com.stormneighbor.app",
} as const;

export const PUSH_CONFIG = {
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId || "stormneighbor-app",
} as const;

export const FEATURES = {
  enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === "true",
  enableLocationServices: process.env.EXPO_PUBLIC_ENABLE_LOCATION_SERVICES === "true",
  enableImageUploads: process.env.EXPO_PUBLIC_ENABLE_IMAGE_UPLOADS === "true",
  enableRealTimeUpdates: process.env.EXPO_PUBLIC_ENABLE_REAL_TIME_UPDATES === "true",
} as const;

export const WEATHER_CONFIG = {
  OPENWEATHER_API_KEY:
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ||
    Constants.expoConfig?.extra?.openWeatherApiKey ||
    "",
} as const;

export const URL_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_BASE_WEB_URL || (ENV.isDevelopment
    ? "https://dev.stormneighbor.app"
    : "https://stormneighbor.app"),
  appUrl: process.env.EXPO_PUBLIC_APP_URL_SCHEME || "stormneighbor://",
} as const;
