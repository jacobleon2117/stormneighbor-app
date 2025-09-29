import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiService } from "./api";
import { PUSH_CONFIG } from "../constants/config";
import { ErrorHandler } from "../utils/errorHandler";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          ErrorHandler.silent(
            new Error("Failed to get push token for push notification!"),
            "Request Permissions"
          );
          return false;
        }

        return true;
      } else {
        ErrorHandler.silent(
          new Error("Must use physical device for Push Notifications"),
          "Request Permissions"
        );
        return false;
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Request Notification Permissions");
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
        projectId: PUSH_CONFIG.projectId,
      });

      try {
        await apiService.registerPushToken(token.data);
      } catch (error) {
        ErrorHandler.silent(error as Error, "Register Push Token with Backend");
      }

      return token.data;
    } catch (error) {
      ErrorHandler.silent(error as Error, "Get Push Token");
      return null;
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
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
      ErrorHandler.silent(error as Error, "Schedule Notification");
      throw error;
    }
  }

  static async showNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.scheduleLocalNotification(title, body, data);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Show Notification");
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Cancel Notification");
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      ErrorHandler.silent(error as Error, "Cancel All Notifications");
    }
  }

  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      ErrorHandler.silent(error as Error, "Get Badge Count");
      return 0;
    }
  }

  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Set Badge Count");
    }
  }

  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  static removeNotificationSubscription(subscription: Notifications.EventSubscription): void {
    subscription.remove();
  }
}

export default NotificationService;
