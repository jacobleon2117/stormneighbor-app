const { pool } = require("../config/database");
const { logAdminAction } = require("../utils/adminLogger");
const logger = require("../utils/logger");

const adminAuth = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const adminCheck = await client.query(
      `SELECT 
         ar.name as role_name,
         ar.permissions,
         uar.expires_at,
         uar.is_active
       FROM user_admin_roles uar
       JOIN admin_roles ar ON uar.role_id = ar.id
       WHERE uar.user_id = $1 
       AND uar.is_active = true 
       AND ar.is_active = true
       AND (uar.expires_at IS NULL OR uar.expires_at > NOW())`,
      [userId]
    );

    if (adminCheck.rows.length === 0) {
      await logAdminAction(
        userId,
        "unauthorized_admin_access",
        "security",
        null,
        {
          endpoint: req.path,
          method: req.method,
        },
        req.ip,
        req.get("User-Agent"),
        false
      );

      return res.status(403).json({
        success: false,
        message: "Admin access required",
        code: "ADMIN_ACCESS_REQUIRED",
      });
    }

    const combinedPermissions = {};

    adminCheck.rows.forEach((role) => {
      const rolePermissions = role.permissions || {};

      Object.keys(rolePermissions).forEach((resource) => {
        if (!combinedPermissions[resource]) {
          combinedPermissions[resource] = [];
        }

        const actions = rolePermissions[resource];
        if (Array.isArray(actions)) {
          combinedPermissions[resource] = [
            ...new Set([...combinedPermissions[resource], ...actions]),
          ];
        }
      });
    });

    req.admin = {
      userId,
      roles: adminCheck.rows.map((r) => r.role_name),
      permissions: combinedPermissions,
      expires: adminCheck.rows
        .map((r) => r.expires_at)
        .filter((e) => e)
        .sort()[0],
    };

    next();
  } catch (error) {
    logger.error("Admin auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in admin authentication",
      code: "ADMIN_AUTH_ERROR",
    });
  } finally {
    client.release();
  }
};

const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(403).json({
          success: false,
          message: "Admin authentication required",
          code: "ADMIN_AUTH_REQUIRED",
        });
      }

      const permissions = req.admin.permissions;

      if (!permissions[resource] || !permissions[resource].includes(action)) {
        await logAdminAction(
          req.admin.userId,
          "unauthorized_permission_attempt",
          "security",
          null,
          {
            resource,
            action,
            userPermissions: permissions,
            endpoint: req.path,
            method: req.method,
          },
          req.ip,
          req.get("User-Agent"),
          false
        );

        return res.status(403).json({
          success: false,
          message: `Permission denied: ${resource}.${action}`,
          code: "INSUFFICIENT_PERMISSIONS",
          required: `${resource}.${action}`,
        });
      }

      next();
    } catch (error) {
      logger.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error in permission check",
        code: "PERMISSION_CHECK_ERROR",
      });
    }
  };
};

const requireSuperAdmin = requirePermission("admin", "write");
const requireModerator = requirePermission("content", "moderate");
const requireAnalytics = requirePermission("analytics", "read");

module.exports = {
  adminAuth,
  requirePermission,
  requireSuperAdmin,
  requireModerator,
  requireAnalytics,
};
