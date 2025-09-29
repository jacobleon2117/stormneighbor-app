import { apiService } from "./api";
import { ErrorHandler } from "../utils/errorHandler";

interface NWSAlert {
  id: string;
  properties: {
    headline: string;
    description: string;
    severity: string;
    certainty: string;
    urgency: string;
    event: string;
    areaDesc: string;
    effective: string;
    expires: string;
    onset: string;
    ends: string;
    status: string;
    messageType: string;
    category: string;
    geocode: {
      SAME: string[];
      UGC: string[];
    };
  };
}

interface NWSAlertsResponse {
  features: NWSAlert[];
}

class WeatherAlertsService {
  private readonly NWS_BASE_URL = "https://api.weather.gov";

  async getActiveWeatherAlerts(latitude: number, longitude: number): Promise<NWSAlert[]> {
    try {
      const pointResponse = await fetch(`${this.NWS_BASE_URL}/points/${latitude},${longitude}`, {
        headers: {
          "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
        },
      });

      if (!pointResponse.ok) {
        throw new Error("Failed to fetch NWS point data");
      }

      const pointData = await pointResponse.json();
      const { county, forecastZone } = pointData.properties;

      let alertsUrl = `${this.NWS_BASE_URL}/alerts/active?`;

      if (county) {
        const countyCode = county.split("/").pop();
        alertsUrl += `zone=${countyCode}&`;
      }

      if (forecastZone) {
        const zoneCode = forecastZone.split("/").pop();
        alertsUrl += `zone=${zoneCode}&`;
      }

      alertsUrl = alertsUrl.replace(/[&?]$/, "");

      const alertsResponse = await fetch(alertsUrl, {
        headers: {
          "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
        },
      });

      if (!alertsResponse.ok) {
        throw new Error("Failed to fetch NWS alerts");
      }

      const alertsData: NWSAlertsResponse = await alertsResponse.json();

      return alertsData.features.filter((alert) => {
        const props = alert.properties;
        return (
          props.status === "Actual" &&
          props.messageType !== "Cancel" &&
          (props.severity === "Severe" ||
            props.severity === "Extreme" ||
            props.severity === "Moderate") &&
          new Date(props.expires) > new Date()
        );
      });
    } catch (error) {
      ErrorHandler.silent(error as Error, "Fetch NWS Weather Alerts");
      return [];
    }
  }

  private convertNWSToInternalAlert(nwsAlert: NWSAlert) {
    const props = nwsAlert.properties;

    let severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE";
    switch (props.severity) {
      case "Extreme":
        severity = "CRITICAL";
        break;
      case "Severe":
        severity = "HIGH";
        break;
      case "Moderate":
        severity = "MODERATE";
        break;
      case "Minor":
        severity = "LOW";
        break;
    }

    return {
      title: props.headline || props.event,
      description: props.description,
      severity,
      alertType: "weather_alert",
      startTime: props.effective || props.onset,
      endTime: props.expires || props.ends,
      metadata: {
        areaDesc: props.areaDesc,
        nwsId: nwsAlert.id,
        event: props.event,
        urgency: props.urgency,
        certainty: props.certainty,
        category: props.category,
        geocode: props.geocode,
      },
    };
  }

  async syncWeatherAlerts(latitude: number, longitude: number): Promise<void> {
    try {
      const nwsAlerts = await this.getActiveWeatherAlerts(latitude, longitude);

      for (const nwsAlert of nwsAlerts) {
        const internalAlert = this.convertNWSToInternalAlert(nwsAlert);

        try {
          const existingAlertsResponse = await apiService.getAlerts({
            latitude,
            longitude,
          });

          const existsAlready = existingAlertsResponse.data?.alerts?.some(
            (alert: any) => alert.metadata?.nwsId === nwsAlert.id
          );

          if (!existsAlready) {
            await apiService.createAlert(internalAlert);
          }
        } catch (createError) {
          ErrorHandler.silent(createError as Error, "Create Weather Alert");
        }
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Sync Weather Alerts");
      throw error;
    }
  }

  async getWeatherAlertsSummary(
    latitude: number,
    longitude: number
  ): Promise<{
    activeCount: number;
    highestSeverity: string | null;
    alerts: Array<{
      title: string;
      severity: string;
      event: string;
      expires: string;
    }>;
  }> {
    try {
      const alerts = await this.getActiveWeatherAlerts(latitude, longitude);

      let highestSeverity: string | null = null;
      const severityOrder = ["Minor", "Moderate", "Severe", "Extreme"];

      alerts.forEach((alert) => {
        const currentSeverityIndex = severityOrder.indexOf(alert.properties.severity);
        const highestSeverityIndex = highestSeverity ? severityOrder.indexOf(highestSeverity) : -1;

        if (currentSeverityIndex > highestSeverityIndex) {
          highestSeverity = alert.properties.severity;
        }
      });

      return {
        activeCount: alerts.length,
        highestSeverity,
        alerts: alerts.map((alert) => ({
          title: alert.properties.headline || alert.properties.event,
          severity: alert.properties.severity,
          event: alert.properties.event,
          expires: alert.properties.expires,
        })),
      };
    } catch (error) {
      ErrorHandler.silent(error as Error, "Get Weather Alerts Summary");
      return {
        activeCount: 0,
        highestSeverity: null,
        alerts: [],
      };
    }
  }

  async scheduleWeatherAlertsSync(latitude: number, longitude: number): Promise<void> {
    await this.syncWeatherAlerts(latitude, longitude);

    const syncInterval = 15 * 60 * 1000;

    setInterval(async () => {
      try {
        await this.syncWeatherAlerts(latitude, longitude);
      } catch (error) {
        ErrorHandler.silent(error as Error, "Scheduled Weather Alerts Sync");
      }
    }, syncInterval);
  }
}

export const weatherAlertsService = new WeatherAlertsService();
