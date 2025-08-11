// File: backend/src/routes/notifications.js
const express = require("express");
const { body, param, query } = require("express-validator");
const auth = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  registerUserDevice,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  trackNotificationClick,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getNotificationStats,
} = require("../controllers/notificationsController");

const router = express.Router();

const registerDeviceValidation = [
  body("deviceToken").trim().isLength({ min: 10 }).withMessage("Valid device token is required"),
  body("deviceType")
    .isIn(["ios", "android", "web"])
    .withMessage("Device type must be ios, android, or web"),
  body("deviceName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Device name must be less than 100 characters"),
  body("appVersion")
    .optional()
    .trim()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage("App version must be in format x.x.x"),
];

const updatePreferencesValidation = [
  body("push_enabled").optional().isBoolean(),
  body("emergency_alerts").optional().isBoolean(),
  body("new_messages").optional().isBoolean(),
  body("post_comments").optional().isBoolean(),
  body("post_reactions").optional().isBoolean(),
  body("neighborhood_posts").optional().isBoolean(),
  body("weather_alerts").optional().isBoolean(),
  body("community_updates").optional().isBoolean(),
  body("quiet_hours_enabled").optional().isBoolean(),
  body("quiet_hours_start")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body("quiet_hours_end")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body("timezone").optional().isLength({ max: 50 }),
  body("digest_frequency").optional().isIn(["immediate", "hourly", "daily", "weekly"]),
  body("max_notifications_per_hour").optional().isInt({ min: 0, max: 100 }),
];

const testNotificationValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Title must be less than 255 characters"),
  body("message")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Message must be less than 500 characters"),
  body("type")
    .optional()
    .isIn(["test", "emergency_alert", "weather_alert", "new_message", "post_comment"])
    .withMessage("Invalid notification type"),
];

router.post(
  "/devices/register",
  auth,
  registerDeviceValidation,
  handleValidationErrors,
  registerUserDevice
);

router.get(
  "/",
  auth,
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be non-negative"),
    query("unreadOnly").optional().isBoolean().withMessage("unreadOnly must be a boolean"),
  ],
  handleValidationErrors,
  getUserNotifications
);

router.put(
  "/:id/read",
  auth,
  [param("id").isInt().withMessage("Valid notification ID is required")],
  handleValidationErrors,
  markNotificationRead
);

router.put("/read-all", auth, markAllNotificationsRead);

router.post(
  "/:id/click",
  auth,
  [param("id").isInt().withMessage("Valid notification ID is required")],
  handleValidationErrors,
  trackNotificationClick
);

router.get("/preferences", auth, getNotificationPreferences);

router.put(
  "/preferences",
  auth,
  updatePreferencesValidation,
  handleValidationErrors,
  updateNotificationPreferences
);

router.post(
  "/test",
  auth,
  testNotificationValidation,
  handleValidationErrors,
  sendTestNotification
);

// TODO: Add admin middleware
router.get(
  "/stats",
  auth,
  [
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ],
  handleValidationErrors,
  getNotificationStats
);

router.get("/test-system", auth, async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('notifications', 'user_devices', 'notification_preferences', 'notification_templates')
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map((row) => row.table_name);

      const templatesResult = await client.query(`
        SELECT COUNT(*) as template_count FROM notification_templates WHERE is_active = true
      `);

      const devicesResult = await client.query(
        `
        SELECT COUNT(*) as device_count FROM user_devices WHERE user_id = $1 AND is_active = true
      `,
        [req.user.userId]
      );

      const notificationsResult = await client.query(
        `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE is_read = false) as unread_notifications
        FROM notifications WHERE user_id = $1
      `,
        [req.user.userId]
      );

      res.json({
        success: true,
        message: "Notifications system is working!",
        data: {
          tables: {
            found: tables,
            expected: [
              "notifications",
              "user_devices",
              "notification_preferences",
              "notification_templates",
            ],
            allPresent: tables.length === 4,
          },
          templates: {
            active: parseInt(templatesResult.rows[0].template_count),
          },
          userDevices: {
            active: parseInt(devicesResult.rows[0].device_count),
          },
          userNotifications: {
            total: parseInt(notificationsResult.rows[0].total_notifications),
            unread: parseInt(notificationsResult.rows[0].unread_notifications),
          },
          firebase: {
            configured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY),
            projectId: process.env.FIREBASE_PROJECT_ID || "not_configured",
          },
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Notifications test error:", error);
    res.status(500).json({
      success: false,
      message: "Notifications system test failed",
      error: error.message,
    });
  }
});

module.exports = router;
