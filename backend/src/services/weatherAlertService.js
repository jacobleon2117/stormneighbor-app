const axios = require("axios");
const { pool } = require("../config/database");
const pushNotificationService = require("./pushNotificationService");
const logger = require("../utils/logger");

const NOAA_API_BASE = process.env.NOAA_API_BASE_URL || "https://api.weather.gov";

class WeatherAlertService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.fetchInterval = 5 * 60 * 1000;
    this.maxConcurrentRequests = 5;
  }

  async start() {
    if (this.isRunning) return logger.info("Weather alert service already running");

    logger.info("Starting weather alert service...");
    this.isRunning = true;

    try {
      await this.fetchAndStoreAlerts();
    } catch (error) {
      logger.error("Initial fetch failed:", error.message);
    }

    this.intervalId = setInterval(async () => {
      try {
        await this.fetchAndStoreAlerts();
      } catch (error) {
        logger.error("Scheduled fetch failed:", error.message);
      }
    }, this.fetchInterval);

    logger.info(`Weather alert service running (interval: ${this.fetchInterval / 60000} min)`);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isRunning = false;
    logger.info("Weather alert service stopped");
  }

  async fetchAndStoreAlerts() {
    logger.info("Fetching locations with active users...");

    const locations = await pool.query(`
      SELECT DISTINCT location_city, address_state AS location_state, 
                      latitude, longitude, COUNT(*) AS user_count
      FROM users
      WHERE location_city IS NOT NULL AND address_state IS NOT NULL
        AND latitude IS NOT NULL AND longitude IS NOT NULL
        AND is_active = TRUE
      GROUP BY location_city, address_state, latitude, longitude
      ORDER BY user_count DESC
      LIMIT 50
    `);

    logger.info(`Found ${locations.rows.length} active locations`);

    let totalNew = 0;
    let totalUpdated = 0;

    const batches = this.createBatches(locations.rows, this.maxConcurrentRequests);

    for (const batch of batches) {
      const results = await Promise.all(batch.map((loc) => this.fetchAlertsForLocation(loc)));

      results.forEach((r) => {
        totalNew += r.newAlerts;
        totalUpdated += r.updatedAlerts;
      });
    }

    logger.info(`Fetch completed: ${totalNew} new, ${totalUpdated} updated alerts`);

    await this.cleanupOldAlerts();
    return { newAlerts: totalNew, updatedAlerts: totalUpdated };
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async fetchAlertsForLocation(location) {
    const { latitude, longitude, location_city: city, location_state: state } = location;

    try {
      const response = await axios.get(
        `${NOAA_API_BASE}/alerts/active?point=${latitude},${longitude}`,
        {
          headers: { "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)" },
          timeout: 10000,
        }
      );

      if (!response.data?.features?.length) return { newAlerts: 0, updatedAlerts: 0 };

      let newAlerts = 0;
      let updatedAlerts = 0;

      for (const alert of response.data.features) {
        const alertData = this.formatAlert(alert, city, state);
        const result = await this.upsertAlert(alertData);

        if (result.isNew) {
          newAlerts++;
          if (["CRITICAL", "HIGH"].includes(alertData.severity)) {
            await this.sendAlertNotifications(alertData);
          }
        } else if (result.isUpdated) updatedAlerts++;
      }

      return { newAlerts, updatedAlerts };
    } catch (error) {
      logger.error(`NOAA API error for ${city}, ${state}:`, error.message);
      return { newAlerts: 0, updatedAlerts: 0 };
    }
  }

  formatAlert(alert, city, state) {
    const props = alert.properties || {};
    return {
      alert_id: alert.id,
      title: props.headline || "Weather Alert",
      description: props.description || "",
      severity: this.normalizeSeverity(props.severity),
      alert_type: props.event || "Weather Alert",
      source: "NOAA",
      location_city: city,
      location_state: state,
      start_time: props.onset || new Date().toISOString(),
      end_time: props.expires,
      metadata: {
        urgency: props.urgency,
        certainty: props.certainty,
        areas: props.areaDesc,
        instruction: props.instruction,
        noaa_id: alert.id,
      },
    };
  }

  async upsertAlert(alertData) {
    const query = `
      INSERT INTO weather_alerts 
        (alert_id, title, description, severity, alert_type, source,
         location_city, location_state, start_time, end_time, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (alert_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        severity = EXCLUDED.severity,
        alert_type = EXCLUDED.alert_type,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING xmax = 0 AS isNew, xmax != 0 AS isUpdated
    `;

    const result = await pool.query(query, [
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
    ]);

    return result.rows[0];
  }

  async sendAlertNotifications(alertData) {
    try {
      await pushNotificationService.sendWeatherAlert(alertData);
    } catch (error) {
      logger.error("Push notification failed:", error.message);
    }
  }

  async cleanupOldAlerts() {
    try {
      const deactivate = await pool.query(`
        UPDATE weather_alerts
        SET is_active = FALSE
        WHERE is_active = TRUE AND end_time IS NOT NULL AND end_time < NOW()
        RETURNING id
      `);

      if (deactivate.rows.length)
        logger.info(`Deactivated ${deactivate.rows.length} expired alerts`);

      const deleted = await pool.query(`
        DELETE FROM weather_alerts
        WHERE created_at < NOW() - INTERVAL '30 days' AND is_active = FALSE
      `);

      if (deleted.rowCount) logger.info(`Deleted ${deleted.rowCount} old alerts`);
    } catch (error) {
      logger.error("Cleanup failed:", error.message);
    }
  }

  normalizeSeverity(severity) {
    if (!severity) return "MODERATE";

    const map = {
      extreme: "CRITICAL",
      severe: "HIGH",
      moderate: "MODERATE",
      minor: "LOW",
      unknown: "MODERATE",
    };
    return map[severity.toLowerCase()] || "MODERATE";
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
  weatherAlertService
    .start()
    .catch((error) => logger.error("Failed to start weather alert service:", error));
}

module.exports = weatherAlertService;
