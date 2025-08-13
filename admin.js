// File: backend/src/routes/admin.js
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

router.use(auth);
router.use(adminAuth);

router.get("/dashboard", requireAnalytics, async (req, res) => {
  const client = await pool.connect();

  try {
    const today = new Date().toISOString().split("T")[0];

    const stats = await client.query(
      `SELECT 
         total_users, new_users, active_users,
         total_posts, new_posts, emergency_posts,
         total_comments, new_comments,
         total_reports, new_reports
       FROM daily_analytics 
       WHERE date = $1`,
      [today]
    );

    const recentActivity = await client.query(`
      SELECT action_type, target_type, created_at, success
      FROM admin_actions 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    const moderationStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM moderation_queue 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0] || {},
        recentActivity: recentActivity.rows,
        moderationStats: moderationStats.rows,
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
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
    });
  } finally {
    client.release();
  }
});

// USER MANAGEMENT ENDPOINTS

router.get(
  "/users",
  requirePermission("users", "read"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().trim().isLength({ max: 100 }),
    query("status").optional().isIn(["active", "inactive", "all"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { page = 1, limit = 50, search, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE 1=1";
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause += ` AND (CONCAT(first_name, ' ', last_name) ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (status && status !== "all") {
        paramCount++;
        whereClause += ` AND is_active = $${paramCount}`;
        params.push(status === "active");
      }

      params.push(limit, offset);

      const users = await client.query(
        `SELECT 
           id, CONCAT(first_name, ' ', last_name) as full_name,
           email, first_name, last_name, is_active, email_verified,
           created_at, last_login, profile_image_url
         FROM users 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        params
      );

      const countQuery = await client.query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params.slice(0, paramCount)
      );

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countQuery.rows[0].total),
            pages: Math.ceil(countQuery.rows[0].total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/users/:userId",
  requirePermission("users", "read"),
  [param("userId").isInt().withMessage("Valid user ID required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;

      const user = await client.query(
        `SELECT u.*, up.bio, up.city, up.state, up.latitude, up.longitude,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = true) as post_count,
           (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND is_active = true) as comment_count
         FROM users u 
         LEFT JOIN user_profiles up ON u.id = up.user_id 
         WHERE u.id = $1`,
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const adminRoles = await client.query(
        `SELECT ar.name, ar.display_name, uar.assigned_at, uar.expires_at
         FROM user_admin_roles uar
         JOIN admin_roles ar ON uar.role_id = ar.id
         WHERE uar.user_id = $1 AND uar.is_active = true`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          ...user.rows[0],
          admin_roles: adminRoles.rows,
        },
      });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user details",
      });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/users/:userId/status",
  requirePermission("users", "write"),
  [
    param("userId").isInt().withMessage("Valid user ID required"),
    body("is_active").isBoolean().withMessage("is_active must be boolean"),
    body("reason").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { is_active, reason } = req.body;

      if (parseInt(userId) === req.admin.userId && !is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate your own account",
        });
      }

      await client.query("UPDATE users SET is_active = $1 WHERE id = $2", [
        is_active,
        userId,
      ]);

      await logAdminAction(
        req.admin.userId,
        is_active ? "user_activated" : "user_suspended",
        "user",
        parseInt(userId),
        { reason },
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: `User ${is_active ? "activated" : "suspended"} successfully`,
      });
    } catch (error) {
      console.error("User status update error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user status",
      });
    } finally {
      client.release();
    }
  }
);

// CONTENT MODERATION ENDPOINTS

router.get(
  "/moderation/queue",
  requireModerator,
  [
    query("status")
      .optional()
      .isIn(["pending", "reviewed", "resolved", "dismissed"]),
    query("priority").optional().isIn(["low", "normal", "high", "urgent"]),
    query("content_type").optional().isIn(["post", "comment", "user"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        status = "pending",
        priority,
        content_type,
        page = 1,
        limit = 20,
      } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE status = $1";
      const params = [status];
      let paramCount = 1;

      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        params.push(priority);
      }

      if (content_type) {
        paramCount++;
        whereClause += ` AND content_type = $${paramCount}`;
        params.push(content_type);
      }

      params.push(limit, offset);

      const reports = await client.query(
        `SELECT mq.*, 
           u_reporter.email as reporter_email,
           u_moderator.email as moderator_email
         FROM moderation_queue mq
         LEFT JOIN users u_reporter ON mq.reporter_id = u_reporter.id
         LEFT JOIN users u_moderator ON mq.moderator_id = u_moderator.id
         ${whereClause}
         ORDER BY 
           CASE priority 
             WHEN 'urgent' THEN 1 
             WHEN 'high' THEN 2 
             WHEN 'normal' THEN 3 
             WHEN 'low' THEN 4 
           END,
           created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        params
      );

      res.json({
        success: true,
        data: reports.rows,
      });
    } catch (error) {
      console.error("Moderation queue error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching moderation queue",
      });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/moderation/reports/:reportId",
  requireModerator,
  [
    param("reportId").isInt().withMessage("Valid report ID required"),
    body("status").isIn(["reviewed", "resolved", "dismissed"]),
    body("action_taken").optional().trim().isLength({ max: 100 }),
    body("moderator_notes").optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { reportId } = req.params;
      const { status, action_taken, moderator_notes } = req.body;

      await client.query(
        `UPDATE moderation_queue 
         SET status = $1, action_taken = $2, moderator_notes = $3, 
             moderator_id = $4, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $5`,
        [status, action_taken, moderator_notes, req.admin.userId, reportId]
      );

      await logAdminAction(
        req.admin.userId,
        "moderation_action",
        "report",
        parseInt(reportId),
        { status, action_taken, moderator_notes },
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: "Report processed successfully",
      });
    } catch (error) {
      console.error("Moderation action error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing report",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/content/:contentType/:contentId",
  requireModerator,
  [
    param("contentType").isIn(["posts", "comments"]),
    param("contentId").isInt().withMessage("Valid content ID required"),
    body("reason")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Reason is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { contentType, contentId } = req.params;
      const { reason } = req.body;

      const table = contentType === "posts" ? "posts" : "comments";

      await client.query(
        `UPDATE ${table} SET is_active = false WHERE id = $1`,
        [contentId]
      );

      await logAdminAction(
        req.admin.userId,
        `${contentType.slice(0, -1)}_deleted`,
        contentType.slice(0, -1),
        parseInt(contentId),
        { reason },
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: `${contentType.slice(0, -1)} deleted successfully`,
      });
    } catch (error) {
      console.error("Content deletion error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting content",
      });
    } finally {
      client.release();
    }
  }
);

// SYSTEM SETTINGS ENDPOINTS

router.get(
  "/settings",
  requirePermission("system", "read"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const settings = await client.query(`
      SELECT setting_key, setting_value, setting_type, display_name, description, is_public
      FROM system_settings 
      ORDER BY setting_type, setting_key
    `);

      res.json({
        success: true,
        data: settings.rows,
      });
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching settings",
      });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/settings/:settingKey",
  requirePermission("system", "write"),
  [
    param("settingKey").trim().isLength({ min: 1, max: 100 }),
    body("setting_value").exists().withMessage("setting_value is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { settingKey } = req.params;
      const { setting_value } = req.body;

      await client.query(
        `UPDATE system_settings 
         SET setting_value = $1, updated_by = $2, updated_at = NOW()
         WHERE setting_key = $3`,
        [JSON.stringify(setting_value), req.admin.userId, settingKey]
      );

      await logAdminAction(
        req.admin.userId,
        "setting_update",
        "system_setting",
        null,
        { setting_key: settingKey, new_value: setting_value },
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: "Setting updated successfully",
      });
    } catch (error) {
      console.error("Setting update error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating setting",
      });
    } finally {
      client.release();
    }
  }
);

// ANALYTICS ENDPOINTS

router.get(
  "/analytics",
  requireAnalytics,
  [
    query("start_date").optional().isISO8601(),
    query("end_date").optional().isISO8601(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { start_date, end_date } = req.query;

      const analytics = await client.query(
        `SELECT * FROM daily_analytics 
         WHERE date BETWEEN $1 AND $2
         ORDER BY date DESC`,
        [
          start_date || "2024-01-01",
          end_date || new Date().toISOString().split("T")[0],
        ]
      );

      res.json({
        success: true,
        data: analytics.rows,
      });
    } catch (error) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching analytics",
      });
    } finally {
      client.release();
    }
  }
);

// ROLE MANAGEMENT ENDPOINTS

router.get("/roles", requireSuperAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const roles = await client.query(`
      SELECT * FROM admin_roles 
      WHERE is_active = true
      ORDER BY name
    `);

    res.json({
      success: true,
      data: roles.rows,
    });
  } catch (error) {
    console.error("Roles fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
    });
  } finally {
    client.release();
  }
});

router.post(
  "/users/:userId/roles",
  requireSuperAdmin,
  [
    param("userId").isInt().withMessage("Valid user ID required"),
    body("role_id").isInt().withMessage("Valid role ID required"),
    body("expires_at")
      .optional()
      .isISO8601()
      .withMessage("Invalid expiration date"),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { role_id, expires_at, notes } = req.body;

      if (parseInt(userId) === req.admin.userId) {
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

      if (targetUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Target user not found",
          code: "USER_NOT_FOUND",
        });
      }

      if (!targetUser.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign admin roles to inactive users",
          code: "USER_INACTIVE",
        });
      }

      const targetRole = await client.query(
        "SELECT id, name, permissions FROM admin_roles WHERE id = $1 AND is_active = true",
        [role_id]
      );

      if (targetRole.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Target role not found or inactive",
          code: "ROLE_NOT_FOUND",
        });
      }

      const roleBeingAssigned = targetRole.rows[0];

      if (roleBeingAssigned.name === "super_admin") {
        if (!req.admin.roles.includes("super_admin")) {
          return res.status(403).json({
            success: false,
            message: "Only super administrators can assign super admin role",
            code: "INSUFFICIENT_PRIVILEGES",
          });
        }
      }

      const existingAssignment = await client.query(
        `SELECT id, is_active, expires_at FROM user_admin_roles 
         WHERE user_id = $1 AND role_id = $2`,
        [userId, role_id]
      );

      if (
        existingAssignment.rows.length > 0 &&
        existingAssignment.rows[0].is_active
      ) {
        const existing = existingAssignment.rows[0];
        if (!existing.expires_at || existing.expires_at > new Date()) {
          return res.status(400).json({
            success: false,
            message: "User already has this role assigned",
            code: "ROLE_ALREADY_ASSIGNED",
            data: {
              expires_at: existing.expires_at,
            },
          });
        }
      }

      if (expires_at) {
        const expirationDate = new Date(expires_at);
        const now = new Date();

        if (expirationDate <= now) {
          return res.status(400).json({
            success: false,
            message: "Expiration date must be in the future",
            code: "INVALID_EXPIRATION",
          });
        }

        const oneYearFromNow = new Date(
          now.getTime() + 365 * 24 * 60 * 60 * 1000
        );
        if (expirationDate > oneYearFromNow) {
          return res.status(400).json({
            success: false,
            message: "Role assignment cannot exceed 1 year",
            code: "EXPIRATION_TOO_LONG",
          });
        }
      }

      const recentAssignments = await client.query(
        `SELECT COUNT(*) as count FROM admin_actions 
         WHERE admin_id = $1 
         AND action_type = 'admin_role_assigned' 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [req.admin.userId]
      );

      if (parseInt(recentAssignments.rows[0].count) >= 10) {
        return res.status(429).json({
          success: false,
          message: "Too many role assignments in the last hour. Please wait.",
          code: "RATE_LIMIT_EXCEEDED",
        });
      }

      const userExistingRoles = await client.query(
        `SELECT ar.name FROM user_admin_roles uar
         JOIN admin_roles ar ON uar.role_id = ar.id
         WHERE uar.user_id = $1 AND uar.is_active = true 
         AND (uar.expires_at IS NULL OR uar.expires_at > NOW())`,
        [userId]
      );

      const existingRoleNames = userExistingRoles.rows.map((r) => r.name);

      if (
        existingRoleNames.includes("super_admin") &&
        roleBeingAssigned.name !== "super_admin"
      ) {
        return res.status(400).json({
          success: false,
          message: "Super administrators don't need additional roles",
          code: "REDUNDANT_ROLE_ASSIGNMENT",
        });
      }

      await client.query("BEGIN");

      try {
        await client.query(
          `INSERT INTO user_admin_roles (user_id, role_id, assigned_by, expires_at, notes)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, role_id) 
           DO UPDATE SET 
             is_active = true, assigned_by = $3, expires_at = $4, 
             notes = $5, assigned_at = NOW()`,
          [userId, role_id, req.admin.userId, expires_at, notes]
        );

        await logAdminAction(
          req.admin.userId,
          "admin_role_assigned",
          "user",
          parseInt(userId),
          {
            role_id,
            role_name: roleBeingAssigned.name,
            target_user_email: targetUser.rows[0].email,
            expires_at,
            notes,
          },
          req.ip,
          req.get("User-Agent")
        );

        await client.query("COMMIT");

        res.json({
          success: true,
          message: "Admin role assigned successfully",
          data: {
            user_id: parseInt(userId),
            role_name: roleBeingAssigned.name,
            expires_at: expires_at,
            assigned_by: req.admin.userId,
          },
        });
      } catch (assignmentError) {
        await client.query("ROLLBACK");
        throw assignmentError;
      }
    } catch (error) {
      console.error("Role assignment error:", error);

      try {
        const { userId } = req.params;
        const { role_id } = req.body;

        await logAdminAction(
          req.admin?.userId || null,
          "admin_role_assignment_failed",
          "user",
          userId ? parseInt(userId) : null,
          {
            role_id: role_id || null,
            error: error.message || "Unknown error",
            attempted_target: userId || "unknown",
          },
          req.ip || null,
          req.get("User-Agent") || null,
          false
        );
      } catch (logError) {
        console.error("Failed to log admin action:", logError);
      }

      res.status(500).json({
        success: false,
        message: "Error assigning admin role",
        code: "ASSIGNMENT_ERROR",
      });
    } finally {
      client.release();
    }
  }
);
