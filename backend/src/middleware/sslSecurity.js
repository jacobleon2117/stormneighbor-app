// File: backend/src/middleware/sslSecurity.js
const crypto = require("crypto");

class SSLSecurityMiddleware {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.isStaging = process.env.NODE_ENV === "staging";
    this.forceHTTPS = process.env.FORCE_HTTPS !== "false";
    this.trustedProxies = this.parseTrustedProxies();
    this.securityHeadersConfig = this.getSecurityHeaders();
  }

  parseTrustedProxies() {
    const proxies = process.env.TRUSTED_PROXIES;
    if (!proxies) return ["127.0.0.1", "::1"];

    return proxies
      .split(",")
      .map((proxy) => proxy.trim())
      .filter(Boolean);
  }

  httpsEnforcement() {
    return (req, res, next) => {
      if (!this.isProduction && !this.isStaging) {
        return next();
      }

      if (!this.forceHTTPS) {
        return next();
      }

      const isSecure = this.isRequestSecure(req);

      if (!isSecure) {
        const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;

        console.log(`[SSL] Redirecting HTTP to HTTPS: ${req.originalUrl}`);

        return res.status(301).redirect(httpsUrl);
      }

      next();
    };
  }

  isRequestSecure(req) {
    if (req.secure) return true;

    const forwardedProto = req.get("x-forwarded-proto");
    if (forwardedProto === "https") return true;

    const forwardedSsl = req.get("x-forwarded-ssl");
    if (forwardedSsl === "on") return true;

    const frontEndHttps = req.get("front-end-https");
    if (frontEndHttps === "on") return true;

    const cfVisitor = req.get("cf-visitor");
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor);
        if (visitor.scheme === "https") return true;
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    return false;
  }

  getSecurityHeaders() {
    const nonce = this.generateNonce();

    return {
      "Strict-Transport-Security": this.getHSTSHeader(),
      "Content-Security-Policy": this.getCSPHeader(nonce),
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": this.getPermissionsPolicyHeader(),
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      Server: "StormNeighbor",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "X-Download-Options": "noopen",
      "X-DNS-Prefetch-Control": "off",
      "X-Permitted-Cross-Domain-Policies": "none",
    };
  }

  generateNonce() {
    return crypto.randomBytes(16).toString("base64");
  }

  getHSTSHeader() {
    if (this.isProduction) {
      return "max-age=31536000; includeSubDomains; preload";
    } else if (this.isStaging) {
      return "max-age=2592000; includeSubDomains";
    } else {
      return "max-age=300";
    }
  }

  getCSPHeader(nonce) {
    const baseCSP = {
      "default-src": ["'self'"],
      "script-src": ["'self'", `'nonce-${nonce}'`, "https://cdnjs.cloudflare.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": [
        "'self'",
        "data:",
        "https:",
        "https://res.cloudinary.com",
        "https://api.weather.gov",
      ],
      "connect-src": [
        "'self'",
        "https://api.weather.gov",
        "wss:",
        ...(this.isProduction ? [] : ["http://localhost:*"]),
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "frame-src": ["'none'"],
      "worker-src": ["'self'"],
      "manifest-src": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    };

    return Object.entries(baseCSP)
      .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
      .join("; ");
  }

  getPermissionsPolicyHeader() {
    return [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "bluetooth=()",
      "midi=()",
      "sync-xhr=()",
      "fullscreen=(self)",
    ].join(", ");
  }

  securityHeaders() {
    return (req, res, next) => {
      Object.entries(this.securityHeadersConfig).forEach(([header, value]) => {
        res.setHeader(header, value);
      });

      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");

      next();
    };
  }

  sslHealthCheck() {
    return (req, res, next) => {
      const sslInfo = {
        secure: this.isRequestSecure(req),
        protocol: req.protocol,
        headers: {
          "x-forwarded-proto": req.get("x-forwarded-proto"),
          "x-forwarded-ssl": req.get("x-forwarded-ssl"),
          "cf-visitor": req.get("cf-visitor"),
        },
        timestamp: new Date().toISOString(),
      };

      req.sslInfo = sslInfo;

      next();
    };
  }

  requireHTTPS(paths = []) {
    return (req, res, next) => {
      const requiresHTTPS = paths.length === 0 || paths.some((path) => req.path.startsWith(path));

      if (requiresHTTPS && !this.isRequestSecure(req)) {
        const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;
        return res.status(301).redirect(httpsUrl);
      }

      next();
    };
  }

  securityAudit() {
    return (req, res) => {
      const audit = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        ssl: {
          enforced: this.forceHTTPS,
          secure: this.isRequestSecure(req),
          protocol: req.protocol,
          headers: req.sslInfo || {},
        },
        security: {
          hstsEnabled: !!this.getHSTSHeader(),
          cspEnabled: true,
          frameGuardEnabled: true,
          xssProtectionEnabled: true,
        },
        headers: Object.keys(this.securityHeadersConfig),
        recommendations: this.getSecurityRecommendations(req),
      };

      res.json({
        success: true,
        message: "Security audit completed",
        data: audit,
      });
    };
  }

  getSecurityRecommendations(req) {
    const recommendations = [];

    if (!this.isRequestSecure(req)) {
      recommendations.push("Use HTTPS for all requests");
    }

    if (!this.forceHTTPS && this.isProduction) {
      recommendations.push("Enable HTTPS enforcement in production");
    }

    if (!process.env.TRUSTED_PROXIES && this.isProduction) {
      recommendations.push("Configure trusted proxies for production");
    }

    return recommendations;
  }

  initialize(app) {
    console.log("WORKING: Initializing SSL/TLS Security");

    app.use(this.sslHealthCheck());
    app.use(this.httpsEnforcement());
    app.use(this.securityHeaders());

    app.get("/security-audit", this.securityAudit());

    console.log(`SUCCESS: SSL/TLS Security initialized for ${process.env.NODE_ENV} environment`);
    console.log(` HTTPS Enforcement: ${this.forceHTTPS ? "ENABLED" : "DISABLED"}`);
    console.log(` HSTS: ${this.getHSTSHeader()}`);
    console.log(` Trusted Proxies: ${this.trustedProxies.join(", ")}`);
  }
}

module.exports = new SSLSecurityMiddleware();
