const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

class TokenService {
  constructor() {
    this.ACCESS_TOKEN_EXPIRY = "15m";
    this.REFRESH_TOKEN_EXPIRY = "7d";
    this.MAX_SESSIONS_PER_USER = 5;
    this.DEVICE_FINGERPRINT_STRICT = process.env.NODE_ENV === "production";
    this.MAX_FINGERPRINT_MISMATCHES = 3;
    this.FINGERPRINT_MISMATCH_WINDOW = 24 * 60 * 60 * 1000;
  }

  /**
   * Generate access token
   * @param {number} userId
   * @param {object} additionalPayload
   * @returns {string}
   */
  generateAccessToken(userId, additionalPayload = {}) {
    const payload = {
      userId,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      ...additionalPayload,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: "stormneighbor",
      audience: "stormneighbor-api",
    });
  }

  /**
   * Generate refresh token
   * @returns {string}
   */
  generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
  }

  /**
   * Generate device fingerprint
   * @param {object} req
   * @returns {string}
   */
  generateDeviceFingerprint(req) {
    const userAgent = req.get("User-Agent") || "";
    const acceptLanguage = req.get("Accept-Language") || "";
    const acceptEncoding = req.get("Accept-Encoding") || "";

    const fingerprint = crypto
      .createHash("sha256")
      .update(`${userAgent}${acceptLanguage}${acceptEncoding}`)
      .digest("hex");

    return fingerprint.substring(0, 32);
  }

  /**
   * Validate device fingerprint
   * @param {string} storedFingerprint
   * @param {string} currentFingerprint
   * @param {object} session
   * @returns {object}
   */
  validateDeviceFingerprint(storedFingerprint, currentFingerprint, session) {
    if (!storedFingerprint || !currentFingerprint) {
      return { valid: true, action: "allow", reason: "fingerprint_missing" };
    }

    if (storedFingerprint === currentFingerprint) {
      return { valid: true, action: "allow", reason: "fingerprint_match" };
    }

    if (process.env.NODE_ENV === "development") {
      return { valid: true, action: "warn", reason: "dev_mode_lenient" };
    }

    const similarity = this.calculateFingerprintSimilarity(storedFingerprint, currentFingerprint);

    if (similarity > 0.8) {
      return { valid: true, action: "update", reason: "minor_browser_update" };
    }

    const sessionAge = Date.now() - new Date(session.created_at).getTime();

    if (sessionAge < 60 * 60 * 1000) {
      return { valid: false, action: "revoke", reason: "new_session_fingerprint_mismatch" };
    }

    if (similarity < 0.3) {
      return { valid: false, action: "revoke", reason: "significant_fingerprint_change" };
    }

    return { valid: true, action: "flag", reason: "moderate_fingerprint_change" };
  }

  /**
   * Calculate similarity
   * @param {string} fp1
   * @param {string} fp2
   * @returns {number}
   */
  calculateFingerprintSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;

    let matches = 0;
    const length = Math.min(fp1.length, fp2.length);

    for (let i = 0; i < length; i++) {
      if (fp1[i] === fp2[i]) matches++;
    }

    return matches / Math.max(fp1.length, fp2.length);
  }

  /**
   * Log security event for monitoring
   * @param {string} event
   * @param {object} data
   */
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data,
    };

    logger.warn("SECURITY_EVENT", logEntry);

    // While in production, I could send it to a security monitoring service
    // e.g., Sentry, DataDog, or your own logging service
  }

  /**
   * Create a new user session with refresh token
   * @param {number} userId
   * @param {object} req
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async createSession(userId, req) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const accessToken = this.generateAccessToken(userId);
      const refreshToken = this.generateRefreshToken();
      const deviceFingerprint = this.generateDeviceFingerprint(req);

      const deviceInfo = {
        userAgent: req.get("User-Agent") || null,
        platform: req.get("sec-ch-ua-platform") || null,
        mobile: req.get("sec-ch-ua-mobile") === "?1",
        language: req.get("Accept-Language") || null,
        timestamp: new Date().toISOString(),
      };

      const activeSessions = await client.query(
        "SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = true",
        [userId]
      );

      if (parseInt(activeSessions.rows[0].count) >= this.MAX_SESSIONS_PER_USER) {
        await client.query(
          `DELETE FROM user_sessions 
           WHERE id = (
             SELECT id FROM user_sessions 
             WHERE user_id = $1 AND is_active = true 
             ORDER BY last_used_at ASC 
             LIMIT 1
           )`,
          [userId]
        );

        this.logSecurityEvent("session_limit_exceeded", {
          userId,
          action: "removed_oldest_session",
          maxSessions: this.MAX_SESSIONS_PER_USER,
        });
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO user_sessions 
         (user_id, refresh_token, device_info, device_fingerprint, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          refreshToken,
          JSON.stringify(deviceInfo),
          deviceFingerprint,
          req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"],
          req.get("User-Agent"),
          expiresAt,
        ]
      );

      await client.query("COMMIT");

      this.logSecurityEvent("session_created", {
        userId,
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
        fingerprint: deviceFingerprint.substring(0, 8),
      });

      return { accessToken, refreshToken };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error creating session", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken
   * @param {object} req
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshAccessToken(refreshToken, req) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const sessionResult = await client.query(
        `SELECT s.*, u.id as user_id, u.email, u.email_verified 
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.refresh_token = $1 AND s.is_active = true AND s.expires_at > NOW()`,
        [refreshToken]
      );

      if (sessionResult.rows.length === 0) {
        this.logSecurityEvent("invalid_refresh_token", {
          token: refreshToken.substring(0, 8),
          ipAddress: req.ip,
        });
        throw new Error("Invalid or expired refresh token");
      }

      const session = sessionResult.rows[0];
      const currentFingerprint = this.generateDeviceFingerprint(req);

      const validation = this.validateDeviceFingerprint(
        session.device_fingerprint,
        currentFingerprint,
        session
      );

      switch (validation.action) {
      case "revoke":
        await client.query(
          "UPDATE user_sessions SET is_active = false WHERE refresh_token = $1",
          [refreshToken]
        );

        await client.query("COMMIT");

        this.logSecurityEvent("session_revoked_security", {
          userId: session.user_id,
          reason: validation.reason,
          storedFingerprint: session.device_fingerprint?.substring(0, 8),
          currentFingerprint: currentFingerprint.substring(0, 8),
          ipAddress: req.ip,
        });

        throw new Error("Session revoked for security reasons. Please log in again.");

      case "flag":
        this.logSecurityEvent("fingerprint_mismatch_flagged", {
          userId: session.user_id,
          reason: validation.reason,
          storedFingerprint: session.device_fingerprint?.substring(0, 8),
          currentFingerprint: currentFingerprint.substring(0, 8),
          ipAddress: req.ip,
        });
        break;

      case "warn":
        this.logSecurityEvent("fingerprint_mismatch_warning", {
          userId: session.user_id,
          reason: validation.reason,
          environment: process.env.NODE_ENV,
        });
        break;

      case "update":
        this.logSecurityEvent("fingerprint_updated", {
          userId: session.user_id,
          reason: validation.reason,
        });
        break;

      case "allow":
      default:
        break;
      }

      const newAccessToken = this.generateAccessToken(session.user_id, {
        email: session.email,
        verified: session.email_verified,
      });
      const newRefreshToken = this.generateRefreshToken();

      await client.query(
        `UPDATE user_sessions 
         SET refresh_token = $1, 
             last_used_at = NOW(), 
             updated_at = NOW(),
             device_fingerprint = $2,
             ip_address = $3
         WHERE refresh_token = $4`,
        [
          newRefreshToken,
          currentFingerprint,
          req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"],
          refreshToken,
        ]
      );

      await client.query("COMMIT");

      this.logSecurityEvent("token_refreshed", {
        userId: session.user_id,
        validationAction: validation.action,
        ipAddress: req.ip,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error refreshing token", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify access token
   * @param {string} token
   * @returns {Promise<object>}
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "stormneighbor",
        audience: "stormneighbor-api",
      });

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid access token");
      }
      throw error;
    }
  }

  /**
   * Revoke a specific session
   * @param {string} refreshToken
   * @returns {Promise<boolean>}
   */
  async revokeSession(refreshToken) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "UPDATE user_sessions SET is_active = false WHERE refresh_token = $1",
        [refreshToken]
      );

      const revoked = result.rowCount > 0;
      if (revoked) {
        this.logSecurityEvent("session_manually_revoked", {
          token: refreshToken.substring(0, 8),
        });
      }

      return revoked;
    } catch (error) {
      logger.error("Error revoking session", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke all sessions for a user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async revokeAllUserSessions(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "UPDATE user_sessions SET is_active = false WHERE user_id = $1",
        [userId]
      );

      const revokedCount = result.rowCount;

      this.logSecurityEvent("all_sessions_revoked", {
        userId,
        revokedCount,
      });

      return revokedCount;
    } catch (error) {
      logger.error("Error revoking all user sessions", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get active sessions for a user
   * @param {number} userId
   * @returns {Promise<array>}
   */
  async getUserSessions(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, device_info, ip_address, created_at, last_used_at, expires_at,
                user_agent, device_fingerprint
         FROM user_sessions 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY last_used_at DESC`,
        [userId]
      );

      return result.rows.map((session) => {
        const deviceInfo = session.device_info || {};

        return {
          id: session.id,
          deviceInfo: {
            ...deviceInfo,
            userAgent: session.user_agent,
            platform: deviceInfo.platform || "Unknown",
            mobile: deviceInfo.mobile || false,
          },
          ipAddress: session.ip_address,
          createdAt: session.created_at,
          lastUsedAt: session.last_used_at,
          expiresAt: session.expires_at,
          isCurrent: false,
        };
      });
    } catch (error) {
      logger.error("Error getting user sessions", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup expired sessions
   * @returns {Promise<boolean>}
   */
  async cleanupExpiredSessions() {
    const client = await pool.connect();

    try {
      const beforeCount = await client.query(
        "SELECT COUNT(*) as count FROM user_sessions WHERE expires_at < NOW() OR is_active = false"
      );

      await client.query("SELECT cleanup_expired_sessions()");

      const afterCount = await client.query("SELECT COUNT(*) as count FROM user_sessions");

      const cleanedUp = parseInt(beforeCount.rows[0].count);
      const remaining = parseInt(afterCount.rows[0].count);

      this.logSecurityEvent("session_cleanup", {
        cleanedUp,
        remaining,
      });

      return true;
    } catch (error) {
      logger.error("Error cleaning up expired sessions", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get session statistics
   * @returns {Promise<object>}
   */
  async getSessionStats() {
    const client = await pool.connect();

    try {
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
          COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_sessions,
          COUNT(DISTINCT user_id) FILTER (WHERE is_active = true) as active_users,
          AVG(EXTRACT(EPOCH FROM (NOW() - last_used_at))) as avg_last_used_seconds
        FROM user_sessions
      `);

      const userSessionCounts = await client.query(`
        SELECT user_id, COUNT(*) as session_count
        FROM user_sessions 
        WHERE is_active = true 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
        ORDER BY session_count DESC
        LIMIT 10
      `);

      return {
        ...stats.rows[0],
        usersWithMultipleSessions: userSessionCounts.rows,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error getting session stats", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new TokenService();
