require("dotenv").config();
const fs = require("fs");

class SSLConfiguration {
  constructor() {
    this.environment = (process.env.NODE_ENV || "development").toLowerCase();
    this.isProduction = this.environment === "production";
    this.isStaging = this.environment === "staging";
    this.isDevelopment = this.environment === "development";
  }

  getSSLConfig() {
    return {
      forceHTTPS: this.getHTTPSEnforcement(),
      trustedProxies: this.getTrustedProxies(),
      sslSettings: this.getSSLSettings(),
      hstsConfig: this.getHSTSConfig(),
      certificateConfig: this.getCertificateConfig(),
      corsConfig: this.getCORSConfig(),
    };
  }

  getHTTPSEnforcement() {
    if (this.isDevelopment) {
      return process.env.FORCE_HTTPS_DEV === "true";
    }

    if (this.isStaging) {
      return process.env.FORCE_HTTPS_STAGING !== "false";
    }

    if (this.isProduction) {
      return process.env.FORCE_HTTPS_PROD !== "false";
    }

    return false;
  }

  getTrustedProxies() {
    const envProxies = process.env.TRUSTED_PROXIES;

    if (envProxies) {
      return envProxies.split(",").map((proxy) => proxy.trim());
    }

    if (this.isProduction) {
      return [
        "127.0.0.1",
        "::1",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "52.0.0.0/8",
        "34.0.0.0/8",
        "35.0.0.0/8",
        "104.16.0.0/12",
        "172.64.0.0/13",
        "108.162.192.0/18",
      ];
    }

    if (this.isStaging) {
      return ["127.0.0.1", "::1", "10.0.0.0/8"];
    }

    return ["127.0.0.1", "::1"];
  }

  getSSLSettings() {
    return {
      minVersion: "TLSv1.2",
      ciphers: this.isProduction
        ? [
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES128-SHA256",
            "ECDHE-RSA-AES256-SHA384",
          ].join(":")
        : null,
      honorCipherOrder: this.isProduction,
      sessionTimeout: this.isProduction ? 300 : 3600,
      enableOCSP: this.isProduction,
    };
  }

  getHSTSConfig() {
    if (this.isProduction) {
      return {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      };
    }

    if (this.isStaging) {
      return {
        maxAge: 2592000,
        includeSubDomains: true,
        preload: false,
      };
    }

    return {
      maxAge: 300,
      includeSubDomains: false,
      preload: false,
    };
  }

  getHSTSHeader() {
    const config = this.getHSTSConfig();
    let header = `max-age=${config.maxAge}`;
    if (config.includeSubDomains) header += "; includeSubDomains";
    if (config.preload) header += "; preload";
    return header;
  }

  getCertificateConfig() {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    const caPath = process.env.SSL_CA_PATH;

    return {
      certPath,
      keyPath,
      caPath,
      acmeEnabled: process.env.ACME_ENABLED === "true",
      acmeDirectory: process.env.ACME_DIRECTORY || "/etc/letsencrypt/live",
      rejectUnauthorized: this.isProduction,
      autoRenew: process.env.SSL_AUTO_RENEW === "true",
      renewalDays: parseInt(process.env.SSL_RENEWAL_DAYS, 10) || 30,
      pathsExist:
        (certPath ? fs.existsSync(certPath) : true) &&
        (keyPath ? fs.existsSync(keyPath) : true) &&
        (caPath ? fs.existsSync(caPath) : true),
    };
  }

  getCORSConfig() {
    const baseConfig = {
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
      maxAge: 86400,
    };

    if (this.isProduction) {
      return { ...baseConfig, origin: this.getProductionOrigins(), optionsSuccessStatus: 200 };
    }

    if (this.isStaging) {
      return { ...baseConfig, origin: this.getStagingOrigins() };
    }

    return { ...baseConfig, origin: "*", credentials: false };
  }

  getProductionOrigins() {
    const origins = process.env.ALLOWED_ORIGINS;
    if (origins) return origins.split(",").map((o) => o.trim());
    return ["https://domain.com", "https://www.domain.com", "https://app.domain.com"];
  }

  getStagingOrigins() {
    return [
      "https://staging.yourdomain.com",
      "https://dev.domain.com",
      "http://localhost:3000",
      "http://localhost:19006",
    ];
  }

  getSecurityHeaders() {
    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Download-Options": "noopen",
      "X-DNS-Prefetch-Control": "off",
    };

    if (this.isProduction || this.isStaging) {
      Object.assign(headers, {
        "Strict-Transport-Security": this.getHSTSHeader(),
        "Expect-CT": "max-age=86400, enforce",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
    }

    return headers;
  }

  validateConfig() {
    const config = this.getSSLConfig();
    const issues = [];

    if (this.isProduction) {
      if (!config.forceHTTPS) issues.push("HTTPS enforcement should be enabled in production");
      if (!config.hstsConfig.includeSubDomains)
        issues.push("HSTS should include subdomains in production");
      if (config.hstsConfig.maxAge < 31536000)
        issues.push("HSTS max-age should be at least 1 year in production");
    }

    const certConfig = config.certificateConfig;
    if (certConfig.certPath && !certConfig.keyPath) {
      issues.push("SSL certificate path specified but no key path");
    }
    if (!certConfig.pathsExist) {
      issues.push("One or more SSL certificate/key/CA paths do not exist");
    }

    return { valid: issues.length === 0, issues, config };
  }

  getConfigSummary() {
    const config = this.getSSLConfig();
    return {
      environment: this.environment,
      httpsEnforced: config.forceHTTPS,
      hstsEnabled: !!config.hstsConfig.maxAge,
      hstsMaxAge: config.hstsConfig.maxAge,
      trustedProxiesCount: config.trustedProxies.length,
      minTLSVersion: config.sslSettings.minVersion,
      certificateManagement: config.certificateConfig.acmeEnabled ? "ACME/Let's Encrypt" : "Manual",
      securityLevel: this.isProduction ? "High" : this.isStaging ? "Medium" : "Development",
    };
  }
}

module.exports = new SSLConfiguration();
