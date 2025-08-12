// File: backend/src/middleware/adminAuth.js
const { pool } = require("../config/database");
const jwt = require("jsonwebtoken");

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No admin token provided",
        code: "NO_ADMIN_TOKEN",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Admin token has expired",
          code: "ADMIN_TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid admin token",
        code: "INVALID_ADMIN_TOKEN",
      });
    }

    const userId = decoded.userId;
    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, email, email_verified, first_name, last_name, is_active FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Admin user not found",
          code: "ADMIN_USER_NOT_FOUND",
        });
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Admin account has been deactivated",
          code: "ADMIN_ACCOUNT_DEACTIVATED",
        });
      }

      const adminCheck = await client.query(
        `
        SELECT 
          ar.name as role_name,
          ar.permissions,
          uar.expires_at
        FROM user_admin_roles uar
        JOIN admin_roles ar ON uar.role_id = ar.id
        WHERE uar.user_id = $1 
        AND uar.is_active = true
        AND (uar.expires_at IS NULL OR uar.expires_at > NOW())
      `,
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
            userEmail: user.email,
          },
          req.ip,
          req.get("User-Agent")
        );

        return res.status(403).json({
          success: false,
          message: "Admin access required",
          code: "ADMIN_ACCESS_REQUIRED",
        });
      }

      let combinedPermissions = {};
      adminCheck.rows.forEach((role) => {
        combinedPermissions = { ...combinedPermissions, ...role.permissions };
      });

      req.user = {
        userId: decoded.userId,
        email: user.email,
        isVerified: user.email_verified,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active,
      };

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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in admin authentication",
      code: "ADMIN_AUTH_ERROR",
    });
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
          req.get("User-Agent")
        );

        return res.status(403).json({
          success: false,
          message: `Permission denied: ${resource}.${action}`,
          code: "INSUFFICIENT_PERMISSIONS",
          required: `${resource}.${action}`,
          userPermissions: Object.keys(permissions),
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error checking permissions",
        code: "PERMISSION_CHECK_ERROR",
      });
    }
  };
};

const logAdminAction = async (
  adminId,
  actionType,
  targetType,
  targetId = null,
  details = {},
  ipAddress = null,
  userAgent = null
) => {
  try {
    const client = await pool.connect();

    try {
      await client.query(
        `
        INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [adminId, actionType, targetType, targetId, JSON.stringify(details), ipAddress, userAgent]
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

const auditLogger = async (req, res, next) => {
  if (!req.admin) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const pathParts = req.path.split("/");
      const actionType = `${req.method.toLowerCase()}_${pathParts[pathParts.length - 1] || "root"}`;

      let targetType = "system";
      let targetId = null;

      if (req.path.includes("/users/")) {
        targetType = "user";
        targetId = req.params.id ? parseInt(req.params.id) : null;
      } else if (req.path.includes("/posts/")) {
        targetType = "post";
        targetId = req.params.id ? parseInt(req.params.id) : null;
      } else if (req.path.includes("/reports/")) {
        targetType = "report";
        targetId = req.params.id ? parseInt(req.params.id) : null;
      }

      logAdminAction(
        req.admin.userId,
        actionType,
        targetType,
        targetId,
        {
          method: req.method,
          path: req.path,
          query: sanitizeLogData(req.query),
          body: sanitizeLogData(req.body),
          responseStatus: res.statusCode,
          adminRoles: req.admin.roles,
        },
        req.ip,
        req.get("User-Agent")
      );
    }

    return originalJson.call(this, data);
  };

  next();
};

const sanitizeLogData = (data) => {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = ["password", "token", "secret", "key", "authorization"];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    }
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });

  return sanitized;
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.admin || !req.admin.roles.includes("super_admin")) {
      return res.status(403).json({
        success: false,
        message: "Super admin access required",
        code: "SUPER_ADMIN_REQUIRED",
      });
    }
    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking super admin status",
      code: "SUPER_ADMIN_CHECK_ERROR",
    });
  }
};

module.exports = {
  requireAdmin,
  requirePermission,
  logAdminAction,
  auditLogger,
  requireSuperAdmin,
};
