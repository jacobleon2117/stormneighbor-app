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
    this.IP_WHITELIST = new Set(process.env.ADMIN_IP_WHITELIST?.split(',') || []);
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

          this.logSecurityEvent(req, 'BRUTE_FORCE_DETECTED', {
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
      res.json = function(data) {
        if (data.success === false && data.message && data.message.includes('Invalid credentials')) {
          attempts.count++;
          attempts.lastAttempt = Date.now();
          bruteForceStore.set(key, attempts);

          data.attemptsRemaining = Math.max(0, SecurityMiddleware.prototype.MAX_LOGIN_ATTEMPTS - attempts.count);
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
      onLimitReached: (req) => {
        this.logSecurityEvent(req, 'PASSWORD_RESET_ABUSE', {
          email: req.body.email,
          attempts: this.MAX_PASSWORD_RESET_ATTEMPTS,
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
      
      const recentRequests = requests.filter(time => now - time < windowMs);
      
      if (recentRequests.length > this.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        suspiciousIPs.add(clientIP);
        
        this.logSecurityEvent(req, 'API_ABUSE_DETECTED', {
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

  adminIPWhitelist() {
    return (req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        return next();
      }

      const clientIP = this.getClientIP(req);
      
      if (!this.IP_WHITELIST.has(clientIP)) {
        this.logSecurityEvent(req, 'ADMIN_ACCESS_DENIED', {
          deniedIP: clientIP,
          path: req.path,
        });
        
        return res.status(403).json({
          success: false,
          message: "Access denied. IP not whitelisted.",
          code: "IP_NOT_WHITELISTED",
        });
      }
      
      next();
    };
  }

  sqlInjectionDetection() {
    return (req, res, next) => {
      const suspiciousPatterns = [
        /(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)\s*)/gi,
        /(\'|\"|;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
        /(benchmark|sleep|waitfor|delay)\s*\(/gi,
        /(script|javascript|vbscript|onload|onerror|onclick)/gi,
      ];

      const checkForInjection = (obj, path = '') => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string') {
              for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                  this.logSecurityEvent(req, 'SQL_INJECTION_ATTEMPT', {
                    field: currentPath,
                    value: value.substring(0, 100),
                    pattern: pattern.source,
                  });
                  
                  return res.status(400).json({
                    success: false,
                    message: "Invalid input detected.",
                    code: "INVALID_INPUT",
                  });
                }
              }
            } else if (typeof value === 'object' && value !== null) {
              const result = checkForInjection(value, currentPath);
              if (result) return result;
            }
          }
        }
      };

      const result = checkForInjection({ ...req.body, ...req.query, ...req.params });
      if (result) return result;

      next();
    };
  }

  auditLogger() {
    return async (req, res, next) => {
      const originalJson = res.json;
      const startTime = Date.now();

      res.json = function(data) {
        const duration = Date.now() - startTime;
        
        if (req.path.includes('/admin/') || req.method !== 'GET') {
          SecurityMiddleware.prototype.logAuditEvent(req, {
            action: `${req.method} ${req.path}`,
            userId: req.user?.userId,
            success: data.success !== false,
            duration,
            response: data.success === false ? data.message : 'success',
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    };
  }

  contentSecurityPolicy() {
    return (req, res, next) => {
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://res.cloudinary.com https://api.weather.gov",
        "connect-src 'self' https://api.weather.gov",
        "font-src 'self'",
        "object-src 'none'",
        "media-src 'self'",
        "frame-src 'none'",
      ].join('; '));
      
      next();
    };
  }

  enhancedInputValidation() {
    return (req, res, next) => {
      const MAX_INPUT_LENGTH = 10000;
      
      const checkLength = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && obj[key].length > MAX_INPUT_LENGTH) {
            return res.status(400).json({
              success: false,
              message: `Input too long for field: ${key}`,
              code: "INPUT_TOO_LONG",
            });
          }
        }
      };

      checkLength(req.body);
      checkLength(req.query);

      next();
    };
  }

  getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  }

  logSecurityEvent(req, event, data = {}) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      userId: req.user?.userId || null,
      ...data,
    };

    console.log(`SECURITY_EVENT: ${JSON.stringify(securityLog)}`);
    
    // I will find the best security monitoring service that suits my app for when i'm in production
    // e.g., Sentry, DataDog, CloudWatch, etc.
  }

  logAuditEvent(req, data = {}) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      ...data,
    };

    console.log(`AUDIT_LOG: ${JSON.stringify(auditLog)}`);

  }

  cleanup() {
    const now = Date.now();
    
    for (const [key, attempts] of bruteForceStore.entries()) {
      if (now - attempts.firstAttempt > this.LOCKOUT_DURATION) {
        bruteForceStore.delete(key);
      }
    }
    
    for (const [email, lockData] of accountLockouts.entries()) {
      if (now > lockData.expiresAt) {
        accountLockouts.delete(email);
      }
    }
    
    if (this.requestCounts) {
      for (const [key, requests] of this.requestCounts.entries()) {
        const recentRequests = requests.filter(time => now - time < 60000);
        if (recentRequests.length === 0) {
          this.requestCounts.delete(key);
        } else {
          this.requestCounts.set(key, recentRequests);
        }
      }
    }
  }
}

const securityMiddleware = new SecurityMiddleware();

setInterval(() => {
  securityMiddleware.cleanup();
}, 5 * 60 * 1000);

module.exports = securityMiddleware;