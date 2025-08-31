import * as Notifications from "expo-notifications";
export class TempNotificationService {
  
  static async sendLocalAlert(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
      
      console.log(`Local notification sent: ${title}`);
      return true;
    } catch (error) {
      console.error("Failed to send local notification:", error);
      return false;
    }
  }

  static async sendTestNotification() {
    return await this.sendLocalAlert(
      "Test Storm Alert", 
      "This is a test notification from StormNeighbor! Emergency alerts will appear just like this.",
      { type: "test", timestamp: Date.now() }
    );
  }

  static async sendWeatherAlert(severity: string, description: string) {
    const severityPrefixes = {
      severe: "SEVERE",
      critical: "CRITICAL", 
      moderate: "MODERATE",
      low: "INFO"
    };
    
    return await this.sendLocalAlert(
      `${severityPrefixes[severity as keyof typeof severityPrefixes]} Weather Alert`,
      description,
      { type: "weather", severity, timestamp: Date.now() }
    );
  }

  static async sendCommunityAlert(title: string, description: string) {
    return await this.sendLocalAlert(
      `Community Alert: ${title}`,
      description,
      { type: "community", timestamp: Date.now() }
    );
  }
}

export default TempNotificationService;