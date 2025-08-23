import Constants from "expo-constants";

export const ENV = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
} as const;

export const API_CONFIG = {
  BASE_URL: ENV.isDevelopment
    ? "http://localhost:3000/api/v1"
    : "https://api.stormneighbor.app/api/v1", // Have to replace with actual production URL
  TIMEOUT: 30000,
} as const;

export const APP_CONFIG = {
  name: "StormNeighbor",
  version: "1.0.0",
  bundleId: "com.stormneighbor.app",
} as const;

export const PUSH_CONFIG = {
  projectId: Constants.expoConfig?.extra?.eas?.projectId || "stormneighbor-app", // Need to replace with actual project ID
} as const;

export const FEATURES = {
  enablePushNotifications: true,
  enableLocationServices: true,
  enableImageUploads: true,
  enableRealTimeUpdates: true,
} as const;

export const URL_CONFIG = {
  baseUrl: ENV.isDevelopment
    ? "https://dev.stormneighbor.app"
    : "https://stormneighbor.app",
  appUrl: "stormneighbor://",
} as const;
