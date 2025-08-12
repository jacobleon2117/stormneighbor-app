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

router.use(auth);
router.use(adminAuth);

router.get("/dashboard", requireAnalytics, async (req, res) => {
  const client = await pool.connect();

  try {
    const today = new Date().toISOString().split("T")[0];

    const stats = await client.query(
      `
      SELECT 
        total_users,
        new_users,
        active_users,
        total_posts,
        new_posts,
        emergency_posts,
        total_comments,
        new_comments,
        total_reports,
        new_reports
      FROM daily_analytics 
      WHERE date = $1
    `,
      [today]
    );

    const recentActivity = await client.query(`
      SELECT 
        action_type,
        target_type,
        created_at,
        success
      FROM admin_actions 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    const moderationStats = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
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

    let whereClause = "";
    const params = [limit, offset];
    let paramCount = 2;

    if (search) {
      paramCount++;
      whereClause += ` AND (CONCAT(first_name, ' ', last_name) ILIKE ${paramCount} OR email ILIKE ${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(status === "active");
    }

    const users = await client.query(
      `
      SELECT 
        id,
        CONCAT(first_name, ' ', last_name) as full_name,
        email,
        first_name,
        last_name,
        is_active,
        email_verified,
        created_at,
        (SELECT MAX(last_used_at) FROM user_sessions WHERE user_id = users.id) as last_login_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count
      FROM users 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
      params
    );

    const totalUsers = await client.query(
      `
      SELECT COUNT(*) as total 
      FROM users 
      WHERE 1=1 ${whereClause}
    `,
      params.slice(2)
    );

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalUsers.rows[0].total),
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

router.patch("/users/:userId/status", requirePermission("users", "write"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;
    const { is_active, reason } = req.body;

    await client.query(
      `
      UPDATE users 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
    `,
      [is_active, userId]
    );

    await logAdminAction(
      req.admin.userId,
      is_active ? "user_activated" : "user_deactivated",
      "user",
      parseInt(userId),
      { reason },
      req.ip,
      req.get("User-Agent")
    );

    res.json({
      success: true,
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
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
});

router.get("/moderation", requireModerator, async (req, res) => {
  const client = await pool.connect();

  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const queue = await client.query(
      `
      SELECT 
        mq.*,
        CONCAT(u_reporter.first_name, ' ', u_reporter.last_name) as reporter_name,
        CONCAT(u_moderator.first_name, ' ', u_moderator.last_name) as moderator_name
      FROM moderation_queue mq
      LEFT JOIN users u_reporter ON mq.reporter_id = u_reporter.id
      LEFT JOIN users u_moderator ON mq.moderator_id = u_moderator.id
      WHERE mq.status = $1
      ORDER BY 
        CASE WHEN mq.priority = 'high' THEN 1
             WHEN mq.priority = 'normal' THEN 2
             ELSE 3 END,
        mq.created_at ASC
      LIMIT $2 OFFSET $3
    `,
      [status, limit, offset]
    );

    res.json({
      success: true,
      data: queue.rows,
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
});

router.patch("/moderation/:queueId", requireModerator, async (req, res) => {
  const client = await pool.connect();

  try {
    const { queueId } = req.params;
    const { status, action_taken, moderator_notes } = req.body;

    await client.query(
      `
      UPDATE moderation_queue 
      SET 
        status = $1,
        action_taken = $2,
        moderator_notes = $3,
        moderator_id = $4,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
    `,
      [status, action_taken, moderator_notes, req.admin.userId, queueId]
    );

    await logAdminAction(
      req.admin.userId,
      "moderation_action",
      "moderation_queue",
      parseInt(queueId),
      { status, action_taken, moderator_notes },
      req.ip,
      req.get("User-Agent")
    );

    res.json({
      success: true,
      message: "Moderation action completed",
    });
  } catch (error) {
    console.error("Moderation action error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing moderation action",
    });
  } finally {
    client.release();
  }
});

router.get("/settings", requirePermission("system", "read"), async (req, res) => {
  const client = await pool.connect();

  try {
    const settings = await client.query(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        display_name,
        description,
        is_public
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
});

router.patch("/settings/:settingKey", requirePermission("system", "write"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { settingKey } = req.params;
    const { setting_value } = req.body;

    await client.query(
      `
      UPDATE system_settings 
      SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = NOW()
      WHERE setting_key = $3
    `,
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
});

router.get("/analytics", requireAnalytics, async (req, res) => {
  const client = await pool.connect();

  try {
    const { start_date, end_date } = req.query;

    const analytics = await client.query(
      `
      SELECT *
      FROM daily_analytics 
      WHERE date BETWEEN $1 AND $2
      ORDER BY date DESC
    `,
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

    await client.query(
      `
      INSERT INTO user_admin_roles (user_id, role_id, assigned_by, expires_at, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, role_id) 
      DO UPDATE SET 
        is_active = true,
        assigned_by = $3,
        expires_at = $4,
        notes = $5,
        assigned_at = NOW()
    `,
      [userId, role_id, req.admin.userId, expires_at, notes]
    );

    await logAdminAction(
      req.admin.userId,
      "admin_role_assigned",
      "user",
      parseInt(userId),
      { role_id, expires_at, notes },
      req.ip,
      req.get("User-Agent")
    );

    res.json({
      success: true,
      message: "Admin role assigned successfully",
    });
  } catch (error) {
    console.error("Role assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning admin role",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
