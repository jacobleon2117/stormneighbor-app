const tokenService = require("../services/tokenService");
const { pool } = require("../config/database");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided, authorization denied",
        code: "NO_TOKEN"
      });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = await tokenService.verifyAccessToken(token);

      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT id, email, email_verified, first_name, last_name, is_active FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(401).json({ 
            success: false,
            message: "Token is not valid - user not found",
            code: "USER_NOT_FOUND"
          });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
          return res.status(401).json({ 
            success: false,
            message: "Account has been deactivated",
            code: "ACCOUNT_DEACTIVATED"
          });
        }

        req.user = {
          userId: decoded.userId,
          email: user.email,
          isVerified: user.email_verified,
          firstName: user.first_name,
          lastName: user.last_name,
          isActive: user.is_active,
        };

        next();
      } finally {
        client.release();
      }
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ 
          success: false,
          message: "Access token has expired",
          code: "TOKEN_EXPIRED"
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          success: false,
          message: "Invalid token format",
          code: "INVALID_TOKEN"
        });
      } else {
        return res.status(401).json({ 
          success: false,
          message: "Token verification failed",
          code: "TOKEN_INVALID"
        });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error in authentication",
      code: "SERVER_ERROR"
    });
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = await tokenService.verifyAccessToken(token);

      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT id, email, email_verified, first_name, last_name, is_active FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
          const user = userResult.rows[0];
          req.user = {
            userId: decoded.userId,
            email: user.email,
            isVerified: user.email_verified,
            firstName: user.first_name,
            lastName: user.last_name,
            isActive: user.is_active,
          };
        } else {
          req.user = null;
        }
      } finally {
        client.release();
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required",
      code: "NO_AUTH"
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ 
      success: false,
      message: "Email verification required",
      code: "EMAIL_NOT_VERIFIED"
    });
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  requireEmailVerified,
};