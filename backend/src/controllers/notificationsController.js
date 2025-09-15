const { pool } = require("../config/database");
const { validationResult } = require("express-validator");
const { registerDevice, sendNotificationToUsers } = require("../services/pushNotificationService");
const logger = require("../utils/logger");

const registerUserDevice = async (req, res) => {
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
    const { deviceToken, deviceType, deviceName, appVersion } = req.body;

    const result = await registerDevice(userId, deviceToken, deviceType, deviceName, appVersion);

    if (result.success) {
      res.json({
        success: true,
        message: "Device registered for push notifications",
        data: { deviceId: result.deviceId },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to register device",
        error: result.error,
      });
    }
  } catch (error) {
    logger.error("Register device error:", error);
    res.status(500).json({
      success: false,
      message: "Server error registering device",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          n.id, n.title, n.message, n.notification_type,
          n.is_read, n.read_at, n.clicked, n.clicked_at,
          n.related_post_id, n.related_comment_id, n.related_alert_id, n.related_user_id,
          n.metadata, n.created_at,
          
          -- Related post info
          p.title as post_title,
          p.content as post_content,
          
          -- Related user info (for messages, follows, etc.)
          ru.first_name as related_user_first_name,
          ru.last_name as related_user_last_name,
          ru.profile_image_url as related_user_image,
          
          -- Related alert info
          wa.title as alert_title,
          wa.severity as alert_severity
          
        FROM notifications n
        LEFT JOIN posts p ON n.related_post_id = p.id
        LEFT JOIN users ru ON n.related_user_id = ru.id
        LEFT JOIN weather_alerts wa ON n.related_alert_id = wa.id
        WHERE n.user_id = $1
      `;

      const params = [userId];
      const paramIndex = 2;

      if (unreadOnly === "true") {
        query += " AND n.is_read = false";
      }

      query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const notifications = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.notification_type,
        isRead: row.is_read,
        readAt: row.read_at,
        clicked: row.clicked,
        clickedAt: row.clicked_at,
        createdAt: row.created_at,
        metadata: row.metadata || {},

        relatedPost: row.related_post_id
          ? {
              id: row.related_post_id,
              title: row.post_title,
              content: row.post_content?.substring(0, 100) + "...",
            }
          : null,

        relatedUser: row.related_user_id
          ? {
              id: row.related_user_id,
              firstName: row.related_user_first_name,
              lastName: row.related_user_last_name,
              profileImageUrl: row.related_user_image,
            }
          : null,

        relatedAlert: row.related_alert_id
          ? {
              id: row.related_alert_id,
              title: row.alert_title,
              severity: row.alert_severity,
            }
          : null,
      }));

      const unreadResult = await client.query(
        "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false",
        [userId]
      );

      res.json({
        success: true,
        message: "Notifications retrieved successfully",
        data: {
          notifications,
          unreadCount: parseInt(unreadResult.rows[0].unread_count),
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            count: notifications.length,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND is_read = false
        RETURNING id
      `,
        [userId]
      );

      res.json({
        success: true,
        message: `${result.rows.length} notifications marked as read`,
        data: { updatedCount: result.rows.length },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const trackNotificationClick = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        UPDATE notifications 
        SET clicked = true, clicked_at = NOW(), is_read = true, read_at = COALESCE(read_at, NOW())
        WHERE id = $1 AND user_id = $2
        RETURNING id, metadata
      `,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification click tracked",
        data: { metadata: result.rows[0].metadata },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Track notification click error:", error);
    res.status(500).json({
      success: false,
      message: "Server error tracking click",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT * FROM notification_preferences WHERE user_id = $1
      `,
        [userId]
      );

      let preferences;
      if (result.rows.length === 0) {
        const defaultResult = await client.query(
          `
          INSERT INTO notification_preferences (user_id)
          VALUES ($1)
          RETURNING *
        `,
          [userId]
        );
        preferences = defaultResult.rows[0];
      } else {
        preferences = result.rows[0];
      }

      const mappedPreferences = {
        emailNotifications: preferences.email_enabled ?? false,
        pushNotifications: preferences.push_enabled ?? false,
        emergencyAlerts: preferences.emergency_alerts ?? false,
        weatherAlerts: preferences.weather_alerts ?? false,
        communityUpdates: preferences.community_updates ?? false,
        postReactions: preferences.post_reactions ?? false,
        comments: preferences.post_comments ?? false,
        quietHoursEnabled: preferences.quiet_hours_enabled ?? false,
      };

      res.json({
        success: true,
        message: "Notification preferences retrieved successfully",
        data: { preferences: mappedPreferences },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching preferences",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    const client = await pool.connect();

    try {
      const allowedFields = [
        "push_enabled",
        "emergency_alerts",
        "new_messages",
        "post_comments",
        "post_reactions",
        "neighborhood_posts",
        "weather_alerts",
        "community_updates",
        "quiet_hours_enabled",
        "quiet_hours_start",
        "quiet_hours_end",
        "timezone",
        "digest_frequency",
        "max_notifications_per_hour",
      ];

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(preferences).forEach((key) => {
        if (allowedFields.includes(key) && preferences[key] !== undefined) {
          updateFields.push(`${key} = ${paramIndex}`);
          values.push(preferences[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid preference fields provided",
        });
      }

      updateFields.push("updated_at = NOW()");
      values.push(userId);

      const query = `
        INSERT INTO notification_preferences (user_id) VALUES (${paramIndex})
        ON CONFLICT (user_id) 
        DO UPDATE SET ${updateFields.join(", ")}
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedPreferences = result.rows[0];

      delete updatedPreferences.id;
      delete updatedPreferences.user_id;
      delete updatedPreferences.created_at;
      delete updatedPreferences.updated_at;

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
        data: { preferences: updatedPreferences },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Update notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating preferences",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const sendTestNotification = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Test notifications not allowed in production",
      });
    }

    const userId = req.user.userId;
    const { title, message, type = "test" } = req.body;

    const result = await sendNotificationToUsers([userId], {
      title: title || "Test Notification",
      message: message || "This is a test notification from StormNeighbor",
      type: type,
      priority: "normal",
    });

    res.json({
      success: true,
      message: "Test notification sent",
      data: result,
    });
  } catch (error) {
    logger.error("Send test notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending test notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const client = await pool.connect();

    try {
      const statsQuery = `
        SELECT 
          notification_type,
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE push_sent = true) as push_sent_count,
          COUNT(*) FILTER (WHERE is_read = true) as read_count,
          COUNT(*) FILTER (WHERE clicked = true) as clicked_count,
          AVG(EXTRACT(EPOCH FROM (read_at - created_at))/60) as avg_read_time_minutes
        FROM notifications 
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY notification_type
        ORDER BY total_count DESC
      `;

      const statsResult = await client.query(statsQuery);

      const dailyQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE push_sent = true) as push_notifications,
          COUNT(DISTINCT user_id) as unique_users
        FROM notifications 
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const dailyResult = await client.query(dailyQuery);

      const deviceQuery = `
        SELECT 
          device_type,
          COUNT(*) as total_devices,
          COUNT(*) FILTER (WHERE is_active = true) as active_devices,
          COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '30 days') as recent_devices
        FROM user_devices
        GROUP BY device_type
      `;

      const deviceResult = await client.query(deviceQuery);

      res.json({
        success: true,
        message: "Notification statistics retrieved successfully",
        data: {
          period: `${days} days`,
          byType: statsResult.rows,
          daily: dailyResult.rows,
          devices: deviceResult.rows,
          generatedAt: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get notification stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  registerUserDevice,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  trackNotificationClick,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getNotificationStats,
};
