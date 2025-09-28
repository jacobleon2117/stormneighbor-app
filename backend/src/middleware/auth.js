const tokenService = require("../services/tokenService");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

const fetchUserById = async (userId) => {
  const result = await pool.query(
    "SELECT id, email, email_verified, first_name, last_name, is_active FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0] || null;
};

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
        code: "NO_TOKEN",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = await tokenService.verifyAccessToken(token);
    } catch (jwtError) {
      logger.warn("JWT verification failed:", jwtError.stack);
      const codeMap = {
        TokenExpiredError: "TOKEN_EXPIRED",
        JsonWebTokenError: "INVALID_TOKEN",
      };
      return res.status(401).json({
        success: false,
        message:
          jwtError.name === "TokenExpiredError" ? "Access token has expired" : "Invalid token",
        code: codeMap[jwtError.name] || "TOKEN_INVALID",
      });
    }

    const user = await fetchUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid - user not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      isVerified: user.email_verified,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active,
    };

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
      code: "SERVER_ERROR",
    });
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = await tokenService.verifyAccessToken(token);
      const user = await fetchUserById(decoded.id);

      if (user && user.is_active) {
        req.user = {
          userId: user.id,
          email: user.email,
          isVerified: user.email_verified,
          firstName: user.first_name,
          lastName: user.last_name,
          isActive: user.is_active,
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error("Optional auth middleware error:", error.stack);
    req.user = null;
    next();
  }
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "NO_AUTH",
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  requireEmailVerified,
};
