const axios = require("axios");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");

const NOAA_API_BASE =
  process.env.NOAA_API_BASE_URL || "https://api.weather.gov";

const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    try {
      const pointResponse = await axios.get(
        `${NOAA_API_BASE}/points/${lat},${lng}`,
        {
          headers: {
            "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
          },
          timeout: 10000,
        }
      );

      if (!pointResponse.data || !pointResponse.data.properties) {
        throw new Error("Invalid response from weather service");
      }

      const { gridId, gridX, gridY } = pointResponse.data.properties;

      const forecastResponse = await axios.get(
        `${NOAA_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
        {
          headers: {
            "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
          },
          timeout: 10000,
        }
      );

      const forecastData = forecastResponse.data.properties.periods[0];

      const weatherData = {
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
        current: {
          temperature: forecastData.temperature,
          temperatureUnit: forecastData.temperatureUnit,
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          shortForecast: forecastData.shortForecast,
          detailedForecast: forecastData.detailedForecast,
          icon: forecastData.icon,
          isDaytime: forecastData.isDaytime,
        },
        forecast: forecastResponse.data.properties.periods.slice(0, 7),
        lastUpdated: new Date().toISOString(),
        source: "NOAA",
      };

      res.json(weatherData);
    } catch (apiError) {
      console.error("NOAA API Error:", apiError.message);

      const mockWeatherData = {
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
        current: {
          temperature: 72,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "SW",
          shortForecast: "Partly Cloudy",
          detailedForecast:
            "Partly cloudy skies with comfortable temperatures.",
          icon: "https://api.weather.gov/icons/land/day/few?size=medium",
          isDaytime: true,
        },
        forecast: [
          {
            name: "Today",
            temperature: 72,
            temperatureUnit: "F",
            shortForecast: "Partly Cloudy",
            windSpeed: "10 mph",
            windDirection: "SW",
          },
        ],
        lastUpdated: new Date().toISOString(),
        source: "MOCK_DATA",
        note: "Weather service temporarily unavailable. Showing sample data.",
      };

      res.json(mockWeatherData);
    }
  } catch (error) {
    console.error("Get weather error:", error);
    res.status(500).json({ message: "Server error fetching weather data" });
  }
};

const getAlerts = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    const userId = req.user?.userId;

    let userLat = latitude;
    let userLng = longitude;
    let searchRadius = radius || 25;

    if ((!userLat || !userLng) && userId) {
      const client = await pool.connect();
      try {
        const userResult = await client.query(
          `SELECT 
            ST_X(location::geometry) as longitude,
            ST_Y(location::geometry) as latitude,
            location_city,
            address_state as location_state
          FROM users WHERE id = $1`,
          [userId]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          userLat = user.latitude;
          userLng = user.longitude;
        }
      } finally {
        client.release();
      }
    }

    if (!userLat || !userLng) {
      return res.status(400).json({
        message: "Location coordinates are required",
      });
    }

    const client = await pool.connect();

    try {
      const alertsResult = await client.query(
        `SELECT * FROM get_weather_alerts_for_location($1, $2, $3)`,
        [userLat, userLng, searchRadius]
      );

      let noaaAlerts = [];
      try {
        const noaaResponse = await axios.get(
          `${NOAA_API_BASE}/alerts/active?point=${userLat},${userLng}`,
          {
            headers: {
              "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
            },
            timeout: 10000,
          }
        );

        if (noaaResponse.data && noaaResponse.data.features) {
          noaaAlerts = noaaResponse.data.features.map((alert) => ({
            id: `noaa-${alert.id}`,
            alertId: alert.id,
            title: alert.properties.headline,
            description: alert.properties.description,
            severity: alert.properties.severity?.toUpperCase() || "MODERATE",
            alertType: alert.properties.event,
            source: "NOAA",
            startTime: alert.properties.onset,
            endTime: alert.properties.expires,
            isActive: true,
            createdAt: alert.properties.sent,
            distanceMiles: 0,
            metadata: {
              urgency: alert.properties.urgency,
              certainty: alert.properties.certainty,
              areas: alert.properties.areaDesc,
            },
          }));
        }
      } catch (noaaError) {
        console.warn("Failed to fetch NOAA alerts:", noaaError.message);
      }

      const dbAlerts = alertsResult.rows.map((row) => ({
        id: row.id,
        alertId: row.alert_id,
        title: row.title,
        description: row.description,
        severity: row.severity,
        alertType: row.alert_type,
        source: row.source,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active,
        createdAt: row.created_at,
        distanceMiles: parseFloat(row.distance_miles || 0),
        metadata: {},
      }));

      const allAlerts = [...dbAlerts, ...noaaAlerts];

      allAlerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 1, HIGH: 2, MODERATE: 3, LOW: 4 };
        const aSeverity = severityOrder[a.severity] || 5;
        const bSeverity = severityOrder[b.severity] || 5;

        if (aSeverity !== bSeverity) {
          return aSeverity - bSeverity;
        }

        return (a.distanceMiles || 0) - (b.distanceMiles || 0);
      });

      res.json({
        alerts: allAlerts,
        location: {
          latitude: parseFloat(userLat),
          longitude: parseFloat(userLng),
          radiusMiles: parseFloat(searchRadius),
        },
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({ message: "Server error fetching alerts" });
  }
};

const createAlert = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const {
      title,
      description,
      severity,
      alertType,
      startTime,
      endTime,
      latitude,
      longitude,
      metadata = {},
    } = req.body;

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        `SELECT 
          location_city,
          address_state as location_state,
          location_county,
          ST_X(location::geometry) as user_longitude,
          ST_Y(location::geometry) as user_latitude
        FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];

      const alertLat = latitude || user.user_latitude;
      const alertLng = longitude || user.user_longitude;
      const alertCity = user.location_city;
      const alertState = user.location_state;
      const alertCounty = user.location_county;

      if (!alertLat || !alertLng) {
        return res.status(400).json({
          message: "Location required. Please complete your profile setup.",
        });
      }

      let locationQuery = "";
      let locationValue = null;
      const values = [
        title,
        description,
        severity,
        alertType,
        "USER",
        startTime,
        endTime,
        userId,
        alertCity,
        alertState,
        alertCounty,
        metadata,
      ];

      if (alertLat && alertLng) {
        locationQuery = ", affected_areas";
        locationValue = `ST_SetSRID(ST_GeomFromText('POINT(${alertLng} ${alertLat})'), 4326)`;
      }

      const insertQuery = `
        INSERT INTO weather_alerts (
          title, description, severity, alert_type, source,
          start_time, end_time, created_by, location_city, location_state, location_county, metadata
          ${locationQuery}
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          ${locationValue ? `, ${locationValue}` : ""}
        ) RETURNING id, created_at
      `;

      const result = await client.query(insertQuery, values);
      const newAlert = result.rows[0];

      if (req.io) {
        req.io.emit("emergency-alert", {
          alertId: newAlert.id,
          city: alertCity,
          state: alertState,
          title,
          severity,
          alertType,
          userId,
        });
      }

      res.status(201).json({
        message: "Alert created successfully",
        alert: {
          id: newAlert.id,
          createdAt: newAlert.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create alert error:", error);
    res.status(500).json({ message: "Server error creating alert" });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { isActive, endTime } = req.body;

    const client = await pool.connect();

    try {
      const alertCheck = await client.query(
        "SELECT created_by FROM weather_alerts WHERE id = $1",
        [id]
      );

      if (alertCheck.rows.length === 0) {
        return res.status(404).json({ message: "Alert not found" });
      }

      if (alertCheck.rows[0].created_by !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this alert" });
      }

      const updateQuery = `
        UPDATE weather_alerts 
        SET is_active = COALESCE($2, is_active),
            end_time = COALESCE($3, end_time),
            updated_at = NOW()
        WHERE id = $1
        RETURNING updated_at
      `;

      const result = await client.query(updateQuery, [id, isActive, endTime]);

      res.json({
        message: "Alert updated successfully",
        updatedAt: result.rows[0].updated_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update alert error:", error);
    res.status(500).json({ message: "Server error updating alert" });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const alertCheck = await client.query(
        "SELECT created_by FROM weather_alerts WHERE id = $1",
        [id]
      );

      if (alertCheck.rows.length === 0) {
        return res.status(404).json({ message: "Alert not found" });
      }

      if (alertCheck.rows[0].created_by !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this alert" });
      }

      await client.query("DELETE FROM weather_alerts WHERE id = $1", [id]);

      res.json({
        message: "Alert deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete alert error:", error);
    res.status(500).json({ message: "Server error deleting alert" });
  }
};

module.exports = {
  getCurrentWeather,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
};
