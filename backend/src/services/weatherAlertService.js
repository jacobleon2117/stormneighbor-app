// File: backend/src/services/weatherAlertService.js
const axios = require("axios");
const { pool } = require("../config/database");
const pushNotificationService = require("./pushNotificationService");

const NOAA_API_BASE = process.env.NOAA_API_BASE_URL || "https://api.weather.gov";

class WeatherAlertService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.fetchInterval = 5 * 60 * 1000;
  }

  async start() {
    if (this.isRunning) {
      console.log("Weather alert service is already running");
      return;
    }

    console.log("Starting automated weather alert service...");
    this.isRunning = true;

    await this.fetchAndStoreAlerts();

    this.intervalId = setInterval(async () => {
      try {
        await this.fetchAndStoreAlerts();
      } catch (error) {
        console.error("Weather alert service error:", error.message);
      }
    }, this.fetchInterval);

    console.log(
      `Weather alert service started - checking every ${this.fetchInterval / 1000 / 60} minutes`
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Weather alert service stopped");
  }

  async fetchAndStoreAlerts() {
    console.log("Fetching weather alerts from NOAA...");

    try {
      const client = await pool.connect();

      try {
        const locations = await client.query(`
          SELECT DISTINCT location_city, address_state as location_state, 
                 latitude, longitude, COUNT(*) as user_count
          FROM users 
          WHERE location_city IS NOT NULL 
            AND address_state IS NOT NULL
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND is_active = TRUE
          GROUP BY location_city, address_state, latitude, longitude
          HAVING COUNT(*) > 0
          ORDER BY user_count DESC
          LIMIT 50
        `);

        console.log(`Found ${locations.rows.length} locations with active users`);

        let totalNewAlerts = 0;
        let totalUpdatedAlerts = 0;

        for (const location of locations.rows) {
          try {
            const { newAlerts, updatedAlerts } = await this.fetchAlertsForLocation(
              location.latitude,
              location.longitude,
              location.location_city,
              location.location_state,
              client
            );

            totalNewAlerts += newAlerts;
            totalUpdatedAlerts += updatedAlerts;

            await this.delay(100);
          } catch (locationError) {
            console.error(
              `Error fetching alerts for ${location.location_city}, ${location.location_state}:`,
              locationError.message
            );
          }
        }

        console.log(
          `Weather alert fetch completed: ${totalNewAlerts} new, ${totalUpdatedAlerts} updated`
        );

        await this.cleanupOldAlerts(client);

        return { newAlerts: totalNewAlerts, updatedAlerts: totalUpdatedAlerts };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Weather alert service error:", error);
      throw error;
    }
  }

  async fetchAlertsForLocation(latitude, longitude, city, state, client) {
    try {
      const response = await axios.get(
        `${NOAA_API_BASE}/alerts/active?point=${latitude},${longitude}`,
        {
          headers: {
            "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
          },
          timeout: 10000,
        }
      );

      if (!response.data || !response.data.features) {
        return { newAlerts: 0, updatedAlerts: 0 };
      }

      let newAlerts = 0;
      let updatedAlerts = 0;

      for (const alert of response.data.features) {
        try {
          const alertData = {
            alert_id: alert.id,
            title: alert.properties.headline || "Weather Alert",
            description: alert.properties.description || "",
            severity: this.normalizeSeverity(alert.properties.severity),
            alert_type: alert.properties.event || "Weather Alert",
            source: "NOAA",
            location_city: city,
            location_state: state,
            start_time: alert.properties.onset || new Date().toISOString(),
            end_time: alert.properties.expires,
            metadata: {
              urgency: alert.properties.urgency,
              certainty: alert.properties.certainty,
              areas: alert.properties.areaDesc,
              instruction: alert.properties.instruction,
              noaa_id: alert.id,
            },
          };

          const result = await this.upsertAlert(alertData, client);

          if (result.isNew) {
            newAlerts++;
            if (alertData.severity === "CRITICAL" || alertData.severity === "HIGH") {
              await this.sendAlertNotifications(alertData, city, state);
            }
          } else if (result.isUpdated) {
            updatedAlerts++;
          }
        } catch (alertError) {
          console.error(`Error processing individual alert ${alert.id}:`, alertError.message);
        }
      }

      return { newAlerts, updatedAlerts };
    } catch (error) {
      console.error(`NOAA API error for ${city}, ${state}:`, error.message);
      return { newAlerts: 0, updatedAlerts: 0 };
    }
  }

  async upsertAlert(alertData, client) {
    try {
      const existing = await client.query(
        "SELECT id, updated_at, end_time FROM weather_alerts WHERE alert_id = $1",
        [alertData.alert_id]
      );

      if (existing.rows.length > 0) {
        const existingAlert = existing.rows[0];

        const shouldUpdate =
          existingAlert.end_time !== alertData.end_time ||
          new Date(alertData.start_time) > new Date(existingAlert.updated_at);

        if (shouldUpdate) {
          await client.query(
            `UPDATE weather_alerts 
             SET title = $1, description = $2, severity = $3, alert_type = $4,
                 start_time = $5, end_time = $6, metadata = $7, updated_at = NOW()
             WHERE alert_id = $8`,
            [
              alertData.title,
              alertData.description,
              alertData.severity,
              alertData.alert_type,
              alertData.start_time,
              alertData.end_time,
              JSON.stringify(alertData.metadata),
              alertData.alert_id,
            ]
          );
          return { isNew: false, isUpdated: true };
        }

        return { isNew: false, isUpdated: false };
      } else {
        await client.query(
          `INSERT INTO weather_alerts 
           (alert_id, title, description, severity, alert_type, source,
            location_city, location_state, start_time, end_time, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            alertData.alert_id,
            alertData.title,
            alertData.description,
            alertData.severity,
            alertData.alert_type,
            alertData.source,
            alertData.location_city,
            alertData.location_state,
            alertData.start_time,
            alertData.end_time,
            JSON.stringify(alertData.metadata),
          ]
        );
        return { isNew: true, isUpdated: false };
      }
    } catch (error) {
      console.error("Error upserting alert:", error);
      throw error;
    }
  }

  async sendAlertNotifications(alertData, city, state) {
    try {
      await pushNotificationService.sendWeatherAlert({
        title: alertData.title,
        description: alertData.description,
        severity: alertData.severity,
        alertType: alertData.alert_type,
        city,
        state,
      });
    } catch (error) {
      console.error("Error sending alert notifications:", error);
    }
  }

  async cleanupOldAlerts(client) {
    try {
      const result = await client.query(
        `UPDATE weather_alerts 
         SET is_active = FALSE 
         WHERE is_active = TRUE 
           AND end_time IS NOT NULL 
           AND end_time < NOW()
         RETURNING id, title`
      );

      if (result.rows.length > 0) {
        console.log(`Deactivated ${result.rows.length} expired weather alerts`);
      }

      const deleteResult = await client.query(
        `DELETE FROM weather_alerts 
         WHERE created_at < NOW() - INTERVAL '30 days'
           AND is_active = FALSE`
      );

      if (deleteResult.rowCount > 0) {
        console.log(`Deleted ${deleteResult.rowCount} old weather alerts`);
      }
    } catch (error) {
      console.error("Error cleaning up old alerts:", error);
    }
  }

  normalizeSeverity(severity) {
    if (!severity) return "MODERATE";

    const severityMap = {
      extreme: "CRITICAL",
      severe: "HIGH",
      moderate: "MODERATE",
      minor: "LOW",
      unknown: "MODERATE",
    };

    return severityMap[severity.toLowerCase()] || "MODERATE";
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      fetchInterval: this.fetchInterval,
      nextFetch: this.intervalId ? new Date(Date.now() + this.fetchInterval) : null,
    };
  }
}

const weatherAlertService = new WeatherAlertService();

if (process.env.NODE_ENV === "production") {
  weatherAlertService.start().catch((error) => {
    console.error("Failed to start weather alert service:", error);
  });
}

module.exports = weatherAlertService;
