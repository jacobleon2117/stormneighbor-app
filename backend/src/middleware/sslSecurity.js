const crypto = require("crypto");
const logger = require("../utils/logger");

class SSLSecurityMiddleware {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.isStaging = process.env.NODE_ENV === "staging";
    this.forceHTTPS = process.env.FORCE_HTTPS !== "false";
    this.trustedProxies = this.parseTrustedProxies();
  }

  parseTrustedProxies() {
    const proxies = process.env.TRUSTED_PROXIES;
    if (!proxies) return ["127.0.0.1", "::1"];
    return proxies
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  isRequestSecure(req) {
    if (req.secure) return true;

    const proto = req.get("x-forwarded-proto")?.toLowerCase();
    if (proto === "https") return true;

    if (req.get("x-forwarded-ssl") === "on") return true;
    if (req.get("front-end-https") === "on") return true;

    const cfVisitor = req.get("cf-visitor");
    try {
      const visitor = JSON.parse(cfVisitor);
      if (visitor.scheme === "https") return true;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Invalid cf-visitor header JSON:", err.message);
      }
    }

    return false;
  }

  generateNonce() {
    return crypto.randomBytes(16).toString("base64");
  }

  getHSTSHeader() {
    if (this.isProduction) return "max-age=31536000; includeSubDomains; preload";
    if (this.isStaging) return "max-age=2592000; includeSubDomains";
    return "max-age=300";
  }

  getCSPHeader(nonce) {
    const csp = {
      "default-src": ["'self'"],
      "script-src": ["'self'", `'nonce-${nonce}'`, "https://cdnjs.cloudflare.com"],
      "style-src": ["'self'", "https://fonts.googleapis.com"],
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
      "object-src": ["'none'"],
      "frame-src": ["'none'"],
      "worker-src": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    };

    return Object.entries(csp)
      .map(([dir, src]) => `${dir} ${src.join(" ")}`)
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
      const nonce = this.generateNonce();
      const headers = {
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
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
        "X-Download-Options": "noopen",
        "X-DNS-Prefetch-Control": "off",
        "X-Permitted-Cross-Domain-Policies": "none",
      };

      Object.entries(headers).forEach(([h, v]) => res.setHeader(h, v));
      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");

      req.cspNonce = nonce;

      next();
    };
  }

  httpsEnforcement() {
    return (req, res, next) => {
      if (!this.forceHTTPS || (!this.isProduction && !this.isStaging)) return next();
      if (this.isRequestSecure(req)) return next();

      const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;
      logger.info(`[SSL] Redirecting HTTP to HTTPS: ${req.originalUrl} -> ${httpsUrl}`);
      res.status(301).redirect(httpsUrl);
    };
  }

  sslHealthCheck() {
    return (req, _res, next) => {
      req.sslInfo = {
        secure: this.isRequestSecure(req),
        protocol: req.protocol,
        headers: {
          "x-forwarded-proto": req.get("x-forwarded-proto"),
          "x-forwarded-ssl": req.get("x-forwarded-ssl"),
          "cf-visitor": req.get("cf-visitor"),
        },
        timestamp: new Date().toISOString(),
      };
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
        headers: Object.keys(this.securityHeadersConfig || {}),
        recommendations: this.getSecurityRecommendations(req),
      };
      res.json({ success: true, message: "Security audit completed", data: audit });
    };
  }

  getSecurityRecommendations(req) {
    const recs = [];
    if (!this.isRequestSecure(req)) recs.push("Use HTTPS for all requests");
    if (!this.forceHTTPS && this.isProduction) recs.push("Enable HTTPS enforcement in production");
    if (!process.env.TRUSTED_PROXIES && this.isProduction) recs.push("Configure trusted proxies");
    return recs;
  }

  initialize(app) {
    logger.info("Initializing SSL/TLS Security Middleware");

    app.use(this.sslHealthCheck());
    app.use(this.httpsEnforcement());
    app.use(this.securityHeaders());
    app.get("/security-audit", this.securityAudit());

    logger.info(`HTTPS Enforcement: ${this.forceHTTPS ? "ENABLED" : "DISABLED"}`);
    logger.info(`HSTS: ${this.getHSTSHeader()}`);
    logger.info(`Trusted Proxies: ${this.trustedProxies.join(", ")}`);
  }
}

module.exports = new SSLSecurityMiddleware();
