const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/database");
const logger = require("../utils/logger");
const { logSecurityEvent } = require("./SecurityEventService");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const REFRESH_SALT = process.env.REFRESH_SALT || "default_refresh_salt";

class TokenService {
  constructor() {
    this.accessTokenExpiry = "15m";
    this.refreshTokenExpiry = "30d";
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
      },
      process.env.JWT_SECRET,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  generateRefreshToken() {
    const raw = crypto.randomBytes(40).toString("hex");
    const hashed = this.hashToken(raw);
    return { raw, hashed };
  }

  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== "access") throw new Error("Invalid token type");
      return decoded;
    } catch (error) {
      logger.warn("Invalid access token:", error.message);
      return null;
    }
  }

  async saveRefreshToken(userId, rawToken, deviceInfo, ipAddress) {
    const client = await pool.connect();
    try {
      const hashedToken = this.hashToken(rawToken);
      const fingerprint = this.getDeviceFingerprint(deviceInfo);

      await client.query(
        `
        INSERT INTO user_sessions (
          user_id, refresh_token, device_info, ip_address, fingerprint, is_active, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW() + interval '30 days')
      `,
        [userId, hashedToken, JSON.stringify(deviceInfo), ipAddress, fingerprint]
      );
    } catch (err) {
      logger.error("Error saving refresh token:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  async revokeRefreshToken(rawToken) {
    const client = await pool.connect();
    try {
      const hashedToken = this.hashToken(rawToken);
      const result = await client.query(
        `UPDATE user_sessions 
         SET is_active = false 
         WHERE refresh_token = $1 
         RETURNING id`,
        [hashedToken]
      );
      return result.rowCount > 0;
    } catch (err) {
      logger.error("Error revoking refresh token:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  async refreshAccessToken(oldRefreshToken, req) {
    const client = await pool.connect();
    try {
      const hashedOld = this.hashToken(oldRefreshToken);
      const res = await client.query(
        `
        SELECT s.*, u.id as user_id, u.email, u.role
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token = $1 
        AND s.is_active = true 
        AND s.expires_at > NOW()
      `,
        [hashedOld]
      );

      if (res.rows.length === 0) {
        logger.warn("Invalid refresh token attempt");
        return null;
      }

      const session = res.rows[0];

      const requestFingerprint = this.getDeviceFingerprint({
        "user-agent": req.get("User-Agent"),
        "accept-language": req.get("Accept-Language"),
        "accept-encoding": req.get("Accept-Encoding"),
        "sec-ch-ua": req.get("sec-ch-ua"),
      });

      if (session.fingerprint !== requestFingerprint) {
        await logSecurityEvent(session.user_id, "refresh_token_fingerprint_mismatch", {
          sessionId: session.id,
          oldFingerprint: session.fingerprint,
          newFingerprint: requestFingerprint,
          ipAddress: req.ip,
        });
        return null;
      }

      const { raw: newRaw, hashed: newHashed } = this.generateRefreshToken();
      await client.query(
        `UPDATE user_sessions 
         SET refresh_token = $1, last_used = NOW()
         WHERE id = $2`,
        [newHashed, session.id]
      );

      const accessToken = this.generateAccessToken({
        id: session.user_id,
        email: session.email,
        role: session.role,
      });

      return { accessToken, refreshToken: newRaw };
    } catch (err) {
      logger.error("Error refreshing access token:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  async cleanupExpiredSessions() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM user_sessions WHERE expires_at < NOW() RETURNING id`
      );
      return { expiredDeleted: result.rowCount };
    } catch (err) {
      logger.error("Error cleaning up sessions:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  getDeviceFingerprint(headers) {
    const ua = headers["user-agent"] || "";
    const lang = headers["accept-language"] || "";
    const enc = headers["accept-encoding"] || "";
    const uaHints = headers["sec-ch-ua"] || "";

    return crypto
      .createHash("sha256")
      .update(ua + lang + enc + uaHints + REFRESH_SALT)
      .digest("hex");
  }
}

module.exports = new TokenService();
