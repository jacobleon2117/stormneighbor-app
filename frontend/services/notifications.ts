import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiService } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Failed to get push token for push notification!");
          return false;
        }

        return true;
      } else {
        console.warn("Must use physical device for Push Notifications");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Replace with actual project ID
      });

      console.log("Expo Push Token:", token.data);

      try {
        await apiService.registerPushToken(token.data);
      } catch (error) {
        console.error("Failed to register push token with backend:", error);
      }

      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  static async showNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      await this.scheduleLocalNotification(title, body, data);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  }

  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error("Error getting badge count:", error);
      return 0;
    }
  }

  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Error setting badge count:", error);
    }
  }

  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  static removeNotificationSubscription(
    subscription: Notifications.Subscription
  ): void {
    subscription.remove();
  }
}

export default NotificationService;
