const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { auth } = require("../middleware/auth");
const {
  adminAuth,
  requirePermission,
  requireSuperAdmin,
  requireModerator,
  requireAnalytics,
} = require("../middleware/adminAuth");
const { logAdminAction } = require("../utils/adminLogger");
const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validation");
const { getReports, reviewReport, getReportStats } = require("../controllers/reportsController");
const weatherAlertService = require("../services/weatherAlertService");
const logger = require("../utils/logger");

router.use(auth, adminAuth);

router.get("/dashboard", requireAnalytics, async (req, res) => {
  const client = await pool.connect();
  try {
    const today = new Date().toISOString().split("T")[0];

    const statsQuery = `SELECT total_users, new_users, active_users,
                               total_posts, new_posts, emergency_posts,
                               total_comments, new_comments,
                               total_reports, new_reports
                        FROM daily_analytics
                        WHERE date = $1`;
    const [statsResult, recentActivityResult, moderationStatsResult] = await Promise.all([
      client.query(statsQuery, [today]),
      client.query(`SELECT action_type, target_type, created_at, success
                    FROM admin_actions
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                    ORDER BY created_at DESC LIMIT 20`),
      client.query(`SELECT status, COUNT(*) AS count
                    FROM moderation_queue
                    WHERE created_at > NOW() - INTERVAL '7 days'
                    GROUP BY status`),
    ]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0] || {},
        recentActivity: recentActivityResult.rows,
        moderationStats: moderationStatsResult.rows,
      },
    });

    await logAdminAction(
      req.admin.userId,
      "dashboard_view",
      "analytics",
      null,
      {},
      req.ip,
      req.get("User-Agent")
    );
  } catch (error) {
    logger.error("Dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard data" });
  } finally {
    client.release();
  }
});

router.get("/users", requirePermission("users", "read"), async (req, res) => {
  const client = await pool.connect();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];
    let i = 1;

    if (search) {
      whereClause += ` AND (CONCAT(first_name, ' ', last_name) ILIKE $${i} OR email ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    if (status && status !== "all") {
      whereClause += ` AND is_active = $${i}`;
      params.push(status === "active");
      i++;
    }

    params.push(limit, offset);

    const users = await client.query(
      `SELECT id, CONCAT(first_name, ' ', last_name) AS full_name,
              email, first_name, last_name, is_active, email_verified,
              created_at, profile_image_url
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: { page, limit, total: users.rows.length },
      },
    });
  } catch (error) {
    logger.error("Users fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  } finally {
    client.release();
  }
});

router.get("/roles", requireSuperAdmin, async (_req, res) => {
  const client = await pool.connect();
  try {
    const roles = await client.query(
      `SELECT * FROM admin_roles WHERE is_active = true ORDER BY name`
    );
    res.json({ success: true, data: roles.rows });
  } catch (error) {
    logger.error("Roles fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching roles" });
  } finally {
    client.release();
  }
});

router.post(
  "/users/:userId/roles",
  requireSuperAdmin,
  [
    param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    body("role_id").isInt({ min: 1 }).withMessage("Valid role ID is required"),
    body("expires_at").optional().isISO8601().toDate(),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = parseInt(req.params.userId);
      const { role_id, expires_at, notes } = req.body;

      if (userId === req.admin.userId) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign admin roles to yourself",
          code: "SELF_ASSIGNMENT_FORBIDDEN",
        });
      }

      const targetUser = await client.query(
        "SELECT id, email, is_active FROM users WHERE id = $1",
        [userId]
      );
      if (!targetUser.rows.length)
        return res
          .status(404)
          .json({ success: false, message: "User not found", code: "USER_NOT_FOUND" });
      if (!targetUser.rows[0].is_active)
        return res.status(400).json({
          success: false,
          message: "Cannot assign roles to inactive users",
          code: "USER_INACTIVE",
        });

      const targetRole = await client.query(
        "SELECT id, name FROM admin_roles WHERE id = $1 AND is_active = true",
        [role_id]
      );
      if (!targetRole.rows.length)
        return res
          .status(404)
          .json({ success: false, message: "Role not found", code: "ROLE_NOT_FOUND" });

      await client.query(
        `INSERT INTO user_admin_roles (user_id, role_id, assigned_by, expires_at, notes)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, role_id) DO UPDATE
           SET is_active = true, assigned_by = $3, expires_at = $4, notes = $5, assigned_at = NOW()`,
        [userId, role_id, req.admin.userId, expires_at, notes]
      );

      await logAdminAction(
        req.admin.userId,
        "admin_role_assigned",
        "user",
        userId,
        {
          role_id,
          role_name: targetRole.rows[0].name,
          target_user_email: targetUser.rows[0].email,
          expires_at,
          notes,
        },
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: "Admin role assigned successfully",
        data: {
          user_id: userId,
          role_name: targetRole.rows[0].name,
          expires_at,
          assigned_by: req.admin.userId,
        },
      });
    } catch (error) {
      logger.error("Role assignment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error assigning role", code: "ASSIGNMENT_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.get("/analytics", requireAnalytics, async (req, res) => {
  const client = await pool.connect();
  try {
    const start_date = req.query.start_date || "2024-01-01";
    const end_date = req.query.end_date || new Date().toISOString().split("T")[0];

    const analytics = await client.query(
      `SELECT * FROM daily_analytics WHERE date BETWEEN $1 AND $2 ORDER BY date DESC`,
      [start_date, end_date]
    );

    res.json({ success: true, data: analytics.rows });
  } catch (error) {
    logger.error("Analytics fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching analytics" });
  } finally {
    client.release();
  }
});

router.get(
  "/reports",
  requireModerator,
  [
    query("status").optional().isIn(["pending", "approved", "rejected"]),
    query("type").optional().isIn(["post", "comment"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  getReports
);

router.put(
  "/reports/:id",
  requireModerator,
  [
    param("id").isInt({ min: 1 }),
    body("action").isIn(["approved", "rejected", "pending"]),
    body("reason").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  reviewReport
);

router.get("/reports/stats", requirePermission("reports", "read"), getReportStats);

router.post("/weather/fetch-alerts", requirePermission("weather", "manage"), async (req, res) => {
  try {
    const result = await weatherAlertService.fetchAndStoreAlerts();
    await logAdminAction(
      req.user.userId,
      "manual_weather_fetch",
      "weather_alerts",
      null,
      `Fetched ${result.newAlerts} new, ${result.updatedAlerts} updated alerts`
    );
    res.json({ success: true, message: "Weather alerts fetched", data: result });
  } catch (error) {
    logger.error("Weather fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/weather/service-status", requirePermission("weather", "read"), async (_req, res) => {
  try {
    res.json({ success: true, data: weatherAlertService.getStatus() });
  } catch (error) {
    logger.error("Weather status error:", error);
    res.status(500).json({ success: false, message: "Failed to get service status" });
  }
});

router.post("/weather/service/start", requireSuperAdmin, async (req, res) => {
  try {
    await weatherAlertService.start();
    await logAdminAction(
      req.user.userId,
      "start_weather_service",
      "weather_service",
      null,
      "Started weather service"
    );
    res.json({
      success: true,
      message: "Weather service started",
      data: weatherAlertService.getStatus(),
    });
  } catch (error) {
    logger.error("Start weather service error:", error);
    res.status(500).json({ success: false, message: "Failed to start service" });
  }
});

router.post("/weather/service/stop", requireSuperAdmin, async (req, res) => {
  try {
    weatherAlertService.stop();
    await logAdminAction(
      req.user.userId,
      "stop_weather_service",
      "weather_service",
      null,
      "Stopped weather service"
    );
    res.json({
      success: true,
      message: "Weather service stopped",
      data: weatherAlertService.getStatus(),
    });
  } catch (error) {
    logger.error("Stop weather service error:", error);
    res.status(500).json({ success: false, message: "Failed to stop service" });
  }
});

module.exports = router;
