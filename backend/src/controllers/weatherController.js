const axios = require("axios");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");
const weatherCache = require("../services/weatherCacheService");

const NOAA_API_BASE = process.env.NOAA_API_BASE_URL || "https://api.weather.gov";

const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const cachedWeather = weatherCache.getCachedWeather(lat, lng);
    if (cachedWeather) {
      return res.json({
        success: true,
        message: "Weather data retrieved from cache",
        data: cachedWeather,
      });
    }

    try {
      const pointResponse = await axios.get(`${NOAA_API_BASE}/points/${lat},${lng}`, {
        headers: {
          "User-Agent": "StormNeighbor/1.0 (contact@stormneighbor.com)",
        },
        timeout: 10000,
      });

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

      weatherCache.cacheWeatherData(lat, lng, weatherData);

      res.json({
        success: true,
        message: "Weather data retrieved successfully",
        data: weatherData,
      });
    } catch (apiError) {
      logger.error("NOAA API Error:", apiError.message);

      const fallbackWeatherData = weatherCache.generateFallbackWeather(lat, lng);

      const originalTimeout = weatherCache.cacheTimeout;
      weatherCache.cacheTimeout = 5 * 60 * 1000;
      weatherCache.cacheWeatherData(lat, lng, fallbackWeatherData);
      weatherCache.cacheTimeout = originalTimeout;

      res.json({
        success: true,
        message: "Weather data retrieved (using intelligent fallback)",
        data: fallbackWeatherData,
      });
    }
  } catch (error) {
    logger.error("Get weather error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching weather data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAlerts = async (req, res) => {
  try {
    const { latitude, longitude, city, state } = req.query;
    const userId = req.user?.userId;

    let userLat = latitude;
    let userLng = longitude;
    let userCity = city;
    let userState = state;

    if ((!userCity || !userState) && userId) {
      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT location_city, address_state, latitude, longitude FROM users WHERE id = $1",
          [userId]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          userCity = userCity || user.location_city;
          userState = userState || user.address_state;
          userLat = userLat || user.latitude;
          userLng = userLng || user.longitude;
        }
      } finally {
        client.release();
      }
    }

    if (!userCity || !userState) {
      return res.status(400).json({
        success: false,
        message: "City and state are required for alerts",
      });
    }

    const client = await pool.connect();

    try {
      const dbAlertsResult = await client.query("SELECT * FROM get_alerts_by_location($1, $2)", [
        userCity,
        userState,
      ]);

      const dbAlerts = dbAlertsResult.rows.map((row) => ({
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
        location: {
          city: userCity,
          state: userState,
        },
      }));

      let noaaAlerts = [];
      if (userLat && userLng) {
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
              location: {
                city: userCity,
                state: userState,
              },
              metadata: {
                urgency: alert.properties.urgency,
                certainty: alert.properties.certainty,
                areas: alert.properties.areaDesc,
              },
            }));
          }
        } catch (noaaError) {
          logger.warn("Failed to fetch NOAA alerts:", noaaError.message);
        }
      }

      const allAlerts = [...dbAlerts, ...noaaAlerts];

      allAlerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 1, HIGH: 2, MODERATE: 3, LOW: 4 };
        const aSeverity = severityOrder[a.severity] || 5;
        const bSeverity = severityOrder[b.severity] || 5;

        if (aSeverity !== bSeverity) {
          return aSeverity - bSeverity;
        }

        return new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime);
      });

      res.json({
        success: true,
        message: "Alerts retrieved successfully",
        data: {
          alerts: allAlerts,
          location: {
            city: userCity,
            state: userState,
            coordinates:
              userLat && userLng
                ? {
                    latitude: parseFloat(userLat),
                    longitude: parseFloat(userLng),
                  }
                : null,
          },
          lastUpdated: new Date().toISOString(),
          sources: {
            database: dbAlerts.length,
            noaa: noaaAlerts.length,
            total: allAlerts.length,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching alerts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createAlert = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { title, description, severity, alertType, startTime, endTime, metadata = {} } = req.body;

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT location_city, address_state, location_county FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userResult.rows[0];

      if (!user.location_city || !user.address_state) {
        return res.status(400).json({
          success: false,
          message: "Please complete your profile with city and state information to create alerts",
        });
      }

      const insertQuery = `
        INSERT INTO weather_alerts (
          title, description, severity, alert_type, source,
          start_time, end_time, created_by, location_city, location_state, location_county, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING id, created_at
      `;

      const values = [
        title,
        description,
        severity,
        alertType,
        "USER",
        startTime,
        endTime,
        userId,
        user.location_city,
        user.address_state,
        user.location_county,
        metadata,
      ];

      const result = await client.query(insertQuery, values);
      const newAlert = result.rows[0];

      res.status(201).json({
        success: true,
        message: "Alert created successfully",
        data: {
          alert: {
            id: newAlert.id,
            title,
            severity,
            alertType,
            location: {
              city: user.location_city,
              state: user.address_state,
            },
            createdAt: newAlert.created_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Create alert error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating alert",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { isActive, endTime } = req.body;

    const client = await pool.connect();

    try {
      const alertCheck = await client.query("SELECT created_by FROM weather_alerts WHERE id = $1", [
        id,
      ]);

      if (alertCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      if (alertCheck.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this alert",
        });
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
        success: true,
        message: "Alert updated successfully",
        data: {
          updatedAt: result.rows[0].updated_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Update alert error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating alert",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const alertCheck = await client.query("SELECT created_by FROM weather_alerts WHERE id = $1", [
        id,
      ]);

      if (alertCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      if (alertCheck.rows[0].created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this alert",
        });
      }

      await client.query("DELETE FROM weather_alerts WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Alert deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Delete alert error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting alert",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();

    try {
      const alertResult = await client.query(
        `SELECT
          id, title, description, severity, alert_type, source,
          start_time, end_time, is_active, location_city, location_state,
          metadata, created_at, updated_at
        FROM weather_alerts
        WHERE id = $1`,
        [id]
      );

      if (alertResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      const row = alertResult.rows[0];
      const alert = {
        id: row.id,
        title: row.title,
        description: row.description,
        severity: row.severity,
        alertType: row.alert_type,
        source: row.source,
        startTime: row.start_time,
        endTime: row.end_time,
        isActive: row.is_active,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        location: {
          city: row.location_city,
          state: row.location_state,
        },
      };

      res.json({
        success: true,
        message: "Alert retrieved successfully",
        data: alert,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get alert error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching alert",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getCacheStats = async (_req, res) => {
  try {
    const stats = weatherCache.getStats();
    weatherCache.cleanup();

    res.json({
      success: true,
      message: "Weather cache statistics",
      data: stats,
    });
  } catch (error) {
    logger.error("Get cache stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cache statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getCurrentWeather,
  getAlerts,
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  getCacheStats,
};
