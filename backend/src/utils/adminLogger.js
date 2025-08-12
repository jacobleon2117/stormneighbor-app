// File: backend/src/utils/adminLogger.js
const { pool } = require("../config/database");

/**
 * Log admin actions for audit trail
 * @param {number} adminId
 * @param {string} actionType
 * @param {string} targetType
 * @param {number|null} targetId
 * @param {object} details
 * @param {string} ipAddress
 * @param {string} userAgent
 * @param {boolean} success
 * @param {string|null} errorMessage
 */
const logAdminAction = async (
  adminId,
  actionType,
  targetType,
  targetId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  success = true,
  errorMessage = null
) => {
  const client = await pool.connect();

  try {
    await client.query(
      `
      INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent,
        success,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        adminId,
        actionType,
        targetType,
        targetId,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        success,
        errorMessage,
      ]
    );
  } catch (error) {
    console.error("Error logging admin action:", error);
  } finally {
    client.release();
  }
};

/**
 * Get admin action history for a specific admin or target
 * @param {object} filters
 * @param {number} filters.adminId
 * @param {string} filters.targetType
 * @param {number} filters.targetId
 * @param {string} filters.actionType
 * @param {Date} filters.startDate
 * @param {Date} filters.endDate
 * @param {number} filters.limit
 * @param {number} filters.offset
 */
const getAdminActionHistory = async (filters = {}) => {
  const client = await pool.connect();

  try {
    let whereClause = "";
    const params = [];
    let paramCount = 0;

    if (filters.adminId) {
      paramCount++;
      whereClause += ` AND admin_id = $${paramCount}`;
      params.push(filters.adminId);
    }

    if (filters.targetType) {
      paramCount++;
      whereClause += ` AND target_type = $${paramCount}`;
      params.push(filters.targetType);
    }

    if (filters.targetId) {
      paramCount++;
      whereClause += ` AND target_id = ${paramCount}`;
      params.push(filters.targetId);
    }

    if (filters.actionType) {
      paramCount++;
      whereClause += ` AND action_type = ${paramCount}`;
      params.push(filters.actionType);
    }

    if (filters.startDate) {
      paramCount++;
      whereClause += ` AND created_at >= ${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      whereClause += ` AND created_at <= ${paramCount}`;
      params.push(filters.endDate);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const result = await client.query(
      `
      SELECT 
        aa.*,
        u.username as admin_username
      FROM admin_actions aa
      LEFT JOIN users u ON aa.admin_id = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT ${paramCount - 1} OFFSET ${paramCount}
    `,
      params
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching admin action history:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get admin action statistics
 * @param {Date} startDate
 * @param {Date} endDate
 */
const getAdminActionStats = async (startDate, endDate) => {
  const client = await pool.connect();

  try {
    const stats = await client.query(
      `
      SELECT 
        action_type,
        target_type,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_count,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_count
      FROM admin_actions
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY action_type, target_type
      ORDER BY count DESC
    `,
      [startDate, endDate]
    );

    const adminStats = await client.query(
      `
      SELECT 
        aa.admin_id,
        CONCAT(u.first_name, ' ', u.last_name) as admin_name,
        COUNT(*) as total_actions,
        COUNT(CASE WHEN aa.success = true THEN 1 END) as successful_actions,
        COUNT(CASE WHEN aa.success = false THEN 1 END) as failed_actions
      FROM admin_actions aa
      LEFT JOIN users u ON aa.admin_id = u.id
      WHERE aa.created_at BETWEEN $1 AND $2
      GROUP BY aa.admin_id, u.first_name, u.last_name
      ORDER BY total_actions DESC
    `,
      [startDate, endDate]
    );

    return {
      actionStats: stats.rows,
      adminStats: adminStats.rows,
    };
  } catch (error) {
    console.error("Error fetching admin action stats:", error);
    throw error;
  } finally {
    client.release();
  }
};

const ADMIN_ACTION_TYPES = {
  USER_ACTIVATED: "user_activated",
  USER_DEACTIVATED: "user_deactivated",
  USER_BANNED: "user_banned",
  USER_UNBANNED: "user_unbanned",
  USER_EMAIL_VERIFIED: "user_email_verified",
  POST_DELETED: "post_deleted",
  POST_RESTORED: "post_restored",
  POST_FEATURED: "post_featured",
  POST_UNFEATURED: "post_unfeatured",
  COMMENT_DELETED: "comment_deleted",
  COMMENT_RESTORED: "comment_restored",
  MODERATION_ACTION: "moderation_action",
  MODERATION_APPROVED: "moderation_approved",
  MODERATION_REJECTED: "moderation_rejected",
  ADMIN_ROLE_ASSIGNED: "admin_role_assigned",
  ADMIN_ROLE_REVOKED: "admin_role_revoked",
  ADMIN_ROLE_MODIFIED: "admin_role_modified",
  SETTING_UPDATE: "setting_update",
  MAINTENANCE_MODE_ENABLED: "maintenance_mode_enabled",
  MAINTENANCE_MODE_DISABLED: "maintenance_mode_disabled",
  UNAUTHORIZED_ACCESS: "unauthorized_admin_access",
  UNAUTHORIZED_PERMISSION: "unauthorized_permission_attempt",
  LOGIN_SUCCESS: "admin_login_success",
  LOGIN_FAILED: "admin_login_failed",
  SESSION_EXPIRED: "admin_session_expired",
  DASHBOARD_VIEW: "dashboard_view",
  ANALYTICS_EXPORT: "analytics_export",
  REPORT_GENERATED: "report_generated",
};

module.exports = {
  logAdminAction,
  getAdminActionHistory,
  getAdminActionStats,
  ADMIN_ACTION_TYPES,
};
