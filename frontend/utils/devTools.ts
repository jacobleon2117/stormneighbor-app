import { apiService } from "../services/api";
import * as SecureStore from "expo-secure-store";

export class DevTools {
  static async clearLocalData(): Promise<void> {
    try {
      console.log("WORKING: Clearing local app data");

      await SecureStore.deleteItemAsync("access_token").catch(() => {});
      await SecureStore.deleteItemAsync("refresh_token").catch(() => {});

      console.log("SUCCESS: Local data cleared successfully");
    } catch (error) {
      console.error("ERROR: Error clearing local data:", error);
    }
  }

  static async forceLogout(): Promise<void> {
    try {
      console.log("WORKING: Force logging out");
      await apiService.clearTokens();
      console.log("SUCCESS: Force logout complete");
    } catch (error) {
      console.error("ERROR: Error during force logout:", error);
    }
  }

  static async debugUserInfo(): Promise<void> {
    try {
      const token = await apiService.getAccessToken();
      console.log("INFO: Debug Info:");
      console.log("Has token:", !!token);

      if (token) {
        try {
          const profile = await apiService.getProfile();
          console.log("User profile:", {
            id: profile.data.id,
            email: profile.data.email,
            firstName: profile.data.firstName,
            locationCity: profile.data.locationCity,
            latitude: profile.data.latitude,
          });
        } catch (error) {
          console.log("ERROR: Failed to get profile:", error);
        }
      }
    } catch (error) {
      console.error("ERROR: Error getting debug info:", error);
    }
  }

  static async completeReset(): Promise<void> {
    console.log("WORKING: Starting complete app reset");

    await this.forceLogout();
    await this.clearLocalData();

    console.log(
      "SUCESS: Complete reset finished - app should restart to welcome screen"
    );
    console.log(
      "INFO: Backend data (posts, users) must be cleared separately on the server"
    );
  }
}

if (__DEV__) {
  (global as any).DevTools = DevTools;
  console.log(
    "SUCCESS: DevTools available globally. Use DevTools.completeReset() to clear all data"
  );
}
