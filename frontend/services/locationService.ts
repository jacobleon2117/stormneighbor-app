import * as Location from "expo-location";
import { Alert, Platform, Linking } from "react-native";
import { LocationPermissionsWithChoice, LocationPreferences } from "../types";
import { ErrorHandler } from "../utils/errorHandler";

export class LocationService {
  private static instance: LocationService;
  private currentLocation: Location.LocationObject | null = null;
  private watchSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestLocationPermissions(
    showRationale: boolean = true
  ): Promise<LocationPermissionsWithChoice> {
    try {
      const foregroundPermissions = await Location.getForegroundPermissionsAsync();

      const permissions: LocationPermissionsWithChoice = {
        foreground: foregroundPermissions.status,
        background: "denied",
        lastUpdated: new Date().toISOString(),
        userChoice: "never",
      };

      if (foregroundPermissions.status === "granted") {
        const backgroundPermissions = await Location.getBackgroundPermissionsAsync();
        permissions.background = backgroundPermissions.status;
        permissions.userChoice =
          backgroundPermissions.status === "granted" ? "always" : "while-using";
        permissions.lastUpdated = new Date().toISOString();
        return permissions;
      }

      if (showRationale) {
        const choice = await this.showPermissionChoice();
        if (choice === "never" || choice === "cancelled") {
          permissions.userChoice = choice;
          return permissions;
        }

        if (choice === "always") {
          const alwaysPermissions = await this.requestAlwaysPermissions();
          return { ...permissions, ...alwaysPermissions, userChoice: "always" };
        } else {
          const whileUsingPermissions = await this.requestWhileUsingPermissions();
          return {
            ...permissions,
            ...whileUsingPermissions,
            userChoice: "while-using",
          };
        }
      }

      const whileUsingPermissions = await this.requestWhileUsingPermissions();
      return {
        ...permissions,
        ...whileUsingPermissions,
        userChoice: "while-using",
      };
    } catch (error) {
      ErrorHandler.silent(error as Error, "Request Location Permissions");
      return {
        foreground: "denied",
        background: "denied",
        lastUpdated: new Date().toISOString(),
        userChoice: "never",
      };
    }
  }

  private async showPermissionChoice(): Promise<"always" | "while-using" | "never" | "cancelled"> {
    return new Promise((resolve) => {
      Alert.alert(
        "Location Access",
        "StormNeighbor can provide better weather alerts and emergency notifications with location access. Choose your preference:",
        [
          {
            text: "Never",
            style: "destructive",
            onPress: () => resolve("never"),
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve("cancelled"),
          },
          {
            text: "While Using App",
            onPress: () => resolve("while-using"),
          },
          {
            text: "Always",
            onPress: () => resolve("always"),
          },
        ],
        { cancelable: false }
      );
    });
  }

  private async requestWhileUsingPermissions() {
    const result = await Location.requestForegroundPermissionsAsync();
    return {
      foreground: result.status,
      background: "denied" as Location.PermissionStatus,
      userChoice: "while-using" as const,
    };
  }

  private async requestAlwaysPermissions() {
    const foregroundResult = await Location.requestForegroundPermissionsAsync();

    if (foregroundResult.status !== "granted") {
      return {
        foreground: foregroundResult.status,
        background: "denied" as Location.PermissionStatus,
        userChoice: "while-using" as const,
      };
    }

    const backgroundResult = await Location.requestBackgroundPermissionsAsync();

    return {
      foreground: foregroundResult.status,
      background: backgroundResult.status,
      userChoice: (backgroundResult.status === "granted" ? "always" : "while-using") as
        | "always"
        | "while-using"
        | "never"
        | "cancelled",
    };
  }

  async getCurrentLocation(
    accuracy: Location.Accuracy = Location.Accuracy.Balanced
  ): Promise<Location.LocationObject | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy,
        mayShowUserSettingsDialog: true,
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      ErrorHandler.silent(error as Error, "Get Current Location");
      return null;
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<Location.LocationGeocodedAddress | null> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      return result[0] || null;
    } catch (error) {
      ErrorHandler.silent(error as Error, "Reverse Geocoding");
      return null;
    }
  }

  async forwardGeocode(address: string): Promise<Location.LocationGeocodedLocation | null> {
    try {
      const result = await Location.geocodeAsync(address);
      return result[0] || null;
    } catch (error) {
      ErrorHandler.silent(error as Error, "Forward Geocoding");
      return null;
    }
  }

  async startLocationWatching(
    callback: (location: Location.LocationObject) => void,
    accuracy: Location.Accuracy = Location.Accuracy.Balanced
  ): Promise<boolean> {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();

      if (status !== "granted") {
        ErrorHandler.silent(
          new Error("Background location permission not granted"),
          "Start Location Watching"
        );
        return false;
      }

      if (this.watchSubscription) {
        this.watchSubscription.remove();
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: 60000,
          distanceInterval: 100,
        },
        (location) => {
          this.currentLocation = location;
          callback(location);
        }
      );

      return true;
    } catch (error) {
      ErrorHandler.silent(error as Error, "Start Location Watching");
      return false;
    }
  }

  stopLocationWatching(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  async canUseLocationFor(purpose: "weather" | "alerts" | "posts"): Promise<boolean> {
    const permissions = await Location.getForegroundPermissionsAsync();

    switch (purpose) {
      case "weather":
        return permissions.status === "granted";
      case "alerts":
        const backgroundPermissions = await Location.getBackgroundPermissionsAsync();
        return permissions.status === "granted" || backgroundPermissions.status === "granted";
      case "posts":
        return permissions.status === "granted";
      default:
        return false;
    }
  }

  async showPermissionDeniedAlert(purpose: string): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        "Location Access Required",
        `To provide accurate ${purpose}, StormNeighbor needs location access. You can enable this in your device settings.`,
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => resolve(),
          },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
              resolve();
            },
          },
        ]
      );
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getBestLocationFor(
    purpose: "weather" | "community" | "alerts",
    homeLocation?: { latitude: number; longitude: number },
    preferences?: LocationPreferences
  ): {
    latitude: number;
    longitude: number;
    source: "current" | "home" | "none";
  } | null {
    switch (purpose) {
      case "weather":
        if (this.currentLocation && preferences?.useCurrentLocationForWeather !== false) {
          return {
            latitude: this.currentLocation.coords.latitude,
            longitude: this.currentLocation.coords.longitude,
            source: "current",
          };
        }
        if (homeLocation) {
          return {
            ...homeLocation,
            source: "home",
          };
        }
        return null;

      case "community":
        if (homeLocation) {
          return {
            ...homeLocation,
            source: "home",
          };
        }
        if (this.currentLocation) {
          return {
            latitude: this.currentLocation.coords.latitude,
            longitude: this.currentLocation.coords.longitude,
            source: "current",
          };
        }
        return null;

      case "alerts":
        if (this.currentLocation && preferences?.useCurrentLocationForAlerts !== false) {
          return {
            latitude: this.currentLocation.coords.latitude,
            longitude: this.currentLocation.coords.longitude,
            source: "current",
          };
        }
        if (homeLocation) {
          return {
            ...homeLocation,
            source: "home",
          };
        }
        return null;

      default:
        return null;
    }
  }

  getCachedLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }
}

export const locationService = LocationService.getInstance();
