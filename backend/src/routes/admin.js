// File: backend/src/routes/admin.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { auth } = require("../middleware/auth");
const {
  adminAuth,
  requirePermission,
  requireSuperAdmin,
  // requireModerator, unused need to add back.
  requireAnalytics,
} = require("../middleware/adminAuth");
const { logAdminAction } = require("../utils/adminLogger");

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

router.get("/users", requirePermission("users", "read"), async (req, res) => {
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
         created_at, profile_image_url
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.rows.length,
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
});

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

router.post("/users/:userId/roles", requireSuperAdmin, async (req, res) => {
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

    const targetUser = await client.query("SELECT id, email, is_active FROM users WHERE id = $1", [
      userId,
    ]);

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
        user_id: parseInt(userId),
        role_name: targetRole.rows[0].name,
        expires_at: expires_at,
        assigned_by: req.admin.userId,
      },
    });
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
  router.get("/analytics", requireAnalytics, async (req, res) => {
    const client = await pool.connect();

    try {
      const { start_date, end_date } = req.query;

      const analytics = await client.query(
        `SELECT * FROM daily_analytics 
       WHERE date BETWEEN $1 AND $2
       ORDER BY date DESC`,
        [start_date || "2024-01-01", end_date || new Date().toISOString().split("T")[0]]
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
  });
});

module.exports = router;
