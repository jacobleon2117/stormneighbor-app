const crypto = require("crypto");
const { validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const Redis = require("ioredis");
const createDOMPurify = require("isomorphic-dompurify");
const { JSDOM } = require("jsdom");
const logger = require("../utils/logger");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

class SecurityMiddleware {
  constructor() {
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 15 * 60 * 1000;
    this.MAX_PASSWORD_RESET_ATTEMPTS = 3;
    this.SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
    this.requestCounts = new Map();
  }

  sanitizeInput() {
    return (req, _res, next) => {
      const sanitizeObject = (obj) => {
        if (obj === null || obj === undefined) return obj;
        if (Array.isArray(obj)) return obj.map(sanitizeObject);
        if (typeof obj === "object") {
          return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)]));
        }
        if (typeof obj === "string") {
          return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
            .split("")
            .filter((c) => {
              const code = c.charCodeAt(0);
              return code >= 32 && code !== 127;
            })
            .join("")
            .trim();
        }
        return obj;
      };

      if (req.body && typeof req.body === "object") req.body = sanitizeObject(req.body);
      if (req.query && typeof req.query === "object") req.query = sanitizeObject(req.query);
      if (req.params && typeof req.params === "object") req.params = sanitizeObject(req.params);

      next();
    };
  }

  handleValidationErrors() {
    return (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formatted = errors.array().map((e) => ({
          field: e.path || e.param,
          message: e.msg,
          value: e.value,
          location: e.location,
        }));
        if (process.env.NODE_ENV === "development") logger.info("Validation errors:", formatted);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formatted,
          errorCount: formatted.length,
        });
      }
      next();
    };
  }

  generateNonce() {
    return crypto.randomBytes(16).toString("base64");
  }

  securityHeaders() {
    return (req, res, next) => {
      const nonce = this.generateNonce();
      req.cspNonce = nonce;

      const headers = {
        "Strict-Transport-Security":
          process.env.NODE_ENV === "production"
            ? "max-age=31536000; includeSubDomains; preload"
            : "max-age=300",
        "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; frame-src 'none';`,
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        Server: "StormNeighbor",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
      };

      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");

      next();
    };
  }

  passwordResetProtection() {
    return rateLimit({
      store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
      windowMs: 60 * 60 * 1000,
      max: this.MAX_PASSWORD_RESET_ATTEMPTS,
      keyGenerator: (req) => `pwd_reset:${req.body.email || req.ip}`,
      message: {
        success: false,
        message: "Too many password reset requests",
        code: "PASSWORD_RESET_LIMIT",
      },
    });
  }

  registrationProtection() {
    return rateLimit({
      store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
      windowMs: 15 * 60 * 1000,
      max: 3,
      keyGenerator: (req) => req.ip,
      message: {
        success: false,
        message: "Too many registration attempts",
        code: "REGISTRATION_LIMIT",
      },
    });
  }

  loginBruteForceProtection() {
    return async (req, res, next) => {
      const { email } = req.body;
      if (!email) return next();
      const key = `login:${email}:${req.ip}`;
      const attempts = parseInt(await redisClient.get(key)) || 0;

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: "Too many failed login attempts. Account temporarily locked.",
          code: "BRUTE_FORCE_DETECTED",
        });
      }

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        if (data.success === false && data.message?.includes("Invalid credentials")) {
          await redisClient.multi().incr(key).pexpire(key, this.LOCKOUT_DURATION).exec();
        } else if (data.success === true) {
          await redisClient.del(key);
        }
        return originalJson(data);
      };

      next();
    };
  }

  validateCoordinates() {
    return (req, res, next) => {
      const errors = [];
      const { latitude, longitude } = req.body;
      if (
        latitude !== undefined &&
        (isNaN(parseFloat(latitude)) || latitude < -90 || latitude > 90)
      )
        errors.push({
          field: "latitude",
          message: "Latitude must be -90 to 90",
          value: latitude,
          location: "body",
        });
      if (
        longitude !== undefined &&
        (isNaN(parseFloat(longitude)) || longitude < -180 || longitude > 180)
      )
        errors.push({
          field: "longitude",
          message: "Longitude must be -180 to 180",
          value: longitude,
          location: "body",
        });
      if (errors.length)
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates",
          errors,
          errorCount: errors.length,
        });
      next();
    };
  }

  requireAuthToken() {
    return (req, res, next) => {
      const token = req.header("Authorization");
      if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. Valid token required.",
          errors: [
            {
              field: "authorization",
              message: "Bearer token required in Authorization header",
              location: "header",
            },
          ],
        });
      }
      next();
    };
  }
}

module.exports = new SecurityMiddleware();
