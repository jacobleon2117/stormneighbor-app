// File: backend/src/middleware/security.js
const rateLimit = require("express-rate-limit");
const { pool } = require("../config/database");

const bruteForceStore = new Map();
const suspiciousIPs = new Set();
const accountLockouts = new Map();

class SecurityMiddleware {
  constructor() {
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 15 * 60 * 1000;
    this.MAX_PASSWORD_RESET_ATTEMPTS = 3;
    this.SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
    this.IP_WHITELIST = new Set(process.env.ADMIN_IP_WHITELIST?.split(",") || []);
    this.requestCounts = new Map();
  }

  getClientIP(req) {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      "unknown"
    );
  }

  logSecurityEvent(req, eventType, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ip: this.getClientIP(req),
      userAgent: req.get("User-Agent"),
      endpoint: req.path,
      method: req.method,
      userId: req.user?.userId,
      ...details,
    };

    console.warn(`[SECURITY] ${eventType}:`, JSON.stringify(logEntry, null, 2));

    if (process.env.NODE_ENV === "production") {
      this.saveSecurityLog(logEntry);
    }
  }

  async saveSecurityLog(logEntry) {
    try {
      const client = await pool.connect();
      try {
        await client.query(
          `
          INSERT INTO security_logs (event_type, ip_address, user_id, details, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
          [logEntry.eventType, logEntry.ip, logEntry.userId, JSON.stringify(logEntry)]
        );
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Failed to save security log:", error.message);
    }
  }

  loginBruteForceProtection() {
    return async (req, res, next) => {
      const { email } = req.body;
      const clientIP = this.getClientIP(req);
      const key = `${email}:${clientIP}`;

      if (accountLockouts.has(email)) {
        const lockData = accountLockouts.get(email);
        if (Date.now() < lockData.expiresAt) {
          return res.status(429).json({
            success: false,
            message: `Account temporarily locked. Try again in ${Math.ceil((lockData.expiresAt - Date.now()) / 60000)} minutes.`,
            code: "ACCOUNT_LOCKED",
            retryAfter: Math.ceil((lockData.expiresAt - Date.now()) / 1000),
          });
        } else {
          accountLockouts.delete(email);
        }
      }

      const attempts = bruteForceStore.get(key) || { count: 0, firstAttempt: Date.now() };

      if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
        const timeSinceFirst = Date.now() - attempts.firstAttempt;
        if (timeSinceFirst < this.LOCKOUT_DURATION) {
          accountLockouts.set(email, {
            expiresAt: Date.now() + this.LOCKOUT_DURATION,
            attempts: attempts.count,
          });

          this.logSecurityEvent(req, "BRUTE_FORCE_DETECTED", {
            email,
            attempts: attempts.count,
            timeWindow: timeSinceFirst,
          });

          return res.status(429).json({
            success: false,
            message: "Too many failed login attempts. Account temporarily locked.",
            code: "BRUTE_FORCE_DETECTED",
            retryAfter: Math.ceil(this.LOCKOUT_DURATION / 1000),
          });
        } else {
          bruteForceStore.delete(key);
        }
      }

      const originalJson = res.json;
      res.json = function (data) {
        if (
          data.success === false &&
          data.message &&
          data.message.includes("Invalid credentials")
        ) {
          attempts.count++;
          attempts.lastAttempt = Date.now();
          bruteForceStore.set(key, attempts);

          data.attemptsRemaining = Math.max(
            0,
            SecurityMiddleware.prototype.MAX_LOGIN_ATTEMPTS - attempts.count
          );
        } else if (data.success === true) {
          bruteForceStore.delete(key);
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  passwordResetProtection() {
    return rateLimit({
      windowMs: 60 * 60 * 1000,
      max: this.MAX_PASSWORD_RESET_ATTEMPTS,
      keyGenerator: (req) => {
        return `pwd_reset:${req.body.email || req.ip}`;
      },
      message: {
        success: false,
        message: "Too many password reset requests. Please try again later.",
        code: "PASSWORD_RESET_LIMIT",
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logSecurityEvent(req, "PASSWORD_RESET_ABUSE", {
          email: req.body.email,
          attempts: this.MAX_PASSWORD_RESET_ATTEMPTS,
        });

        res.status(429).json({
          success: false,
          message: "Too many password reset requests. Please try again later.",
          code: "PASSWORD_RESET_LIMIT",
        });
      },
    });
  }

  registrationProtection() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3,
      keyGenerator: (req) => this.getClientIP(req),
      message: {
        success: false,
        message: "Too many registration attempts from this IP. Please try again later.",
        code: "REGISTRATION_LIMIT",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  apiAbuseDetection() {
    return async (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const userId = req.user?.userId;

      const key = userId || clientIP;
      const now = Date.now();
      const windowMs = 60 * 1000;

      if (!this.requestCounts) {
        this.requestCounts = new Map();
      }

      const requests = this.requestCounts.get(key) || [];

      const recentRequests = requests.filter((time) => now - time < windowMs);

      if (recentRequests.length > this.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        suspiciousIPs.add(clientIP);

        this.logSecurityEvent(req, "API_ABUSE_DETECTED", {
          userId,
          requestCount: recentRequests.length,
          windowMs,
        });

        return res.status(429).json({
          success: false,
          message: "Suspicious activity detected. Please slow down.",
          code: "API_ABUSE",
        });
      }

      recentRequests.push(now);
      this.requestCounts.set(key, recentRequests);

      next();
    };
  }

  enhancedInputValidation() {
    return (req, res, next) => {
      const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:\s*text\/html/gi,
        /vbscript:/gi,
      ];

      const checkInput = (obj, path = "") => {
        if (typeof obj === "string") {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(obj)) {
              this.logSecurityEvent(req, "XSS_ATTEMPT_DETECTED", {
                path,
                value: obj.substring(0, 100),
                pattern: pattern.toString(),
              });

              return res.status(400).json({
                success: false,
                message: "Invalid input detected",
                code: "INVALID_INPUT",
              });
            }
          }
        } else if (typeof obj === "object" && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const result = checkInput(value, `${path}.${key}`);
            if (result) return result;
          }
        }
      };

      if (req.body) {
        const result = checkInput(req.body, "body");
        if (result) return result;
      }

      if (req.query) {
        const result = checkInput(req.query, "query");
        if (result) return result;
      }

      next();
    };
  }

  sqlInjectionDetection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(--|\/\*|\*\/|;)/g,
        /(\b(CONCAT|CHAR|ASCII|SUBSTRING)\s*\()/gi,
        /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/gi,
        /(0x[0-9A-Fa-f]+)/g,
      ];

      const checkForSQLInjection = (obj, path = "") => {
        if (typeof obj === "string") {
          for (const pattern of sqlPatterns) {
            if (pattern.test(obj)) {
              this.logSecurityEvent(req, "SQL_INJECTION_ATTEMPT", {
                path,
                value: obj.substring(0, 100),
                pattern: pattern.toString(),
              });

              return res.status(400).json({
                success: false,
                message: "Invalid input detected",
                code: "SECURITY_VIOLATION",
              });
            }
          }
        } else if (typeof obj === "object" && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const result = checkForSQLInjection(value, `${path}.${key}`);
            if (result) return result;
          }
        }
      };

      if (req.body) {
        const result = checkForSQLInjection(req.body, "body");
        if (result) return result;
      }

      if (req.query) {
        const result = checkForSQLInjection(req.query, "query");
        if (result) return result;
      }

      next();
    };
  }

  contentSecurityPolicy() {
    return (req, res, next) => {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; object-src 'none'; media-src 'self'; frame-src 'none';"
      );
      next();
    };
  }

  auditLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      const originalJson = res.json;
      res.json = function (data) {
        const responseTime = Date.now() - startTime;

        if (req.method !== "GET" || res.statusCode >= 400) {
          console.log(
            `[AUDIT] ${req.method} ${req.path} - Status: ${res.statusCode} - Time: ${responseTime}ms - IP: ${req.ip} - User: ${req.user?.userId || "anonymous"}`
          );
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }
}

module.exports = new SecurityMiddleware();
