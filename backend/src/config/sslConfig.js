require("dotenv").config();

class SSLConfiguration {
  constructor() {
    this.environment = process.env.NODE_ENV || "development";
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
        // Need to add (load balancer IPs)
        // 'e.g. oad-balancer-ip'
      ];
    }

    if (this.isStaging) {
      return ["127.0.0.1", "::1", "10.0.0.0/8"];
    }

    return ["127.0.0.1", "::1"];
  }

  getSSLSettings() {
    return {
      minVersion: this.isProduction ? "TLSv1.2" : "TLSv1.0",

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

  getCertificateConfig() {
    return {
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH,
      caPath: process.env.SSL_CA_PATH,

      acmeEnabled: process.env.ACME_ENABLED === "true",
      acmeDirectory: process.env.ACME_DIRECTORY || "/etc/letsencrypt/live",

      rejectUnauthorized: this.isProduction,

      autoRenew: process.env.SSL_AUTO_RENEW === "true",
      renewalDays: parseInt(process.env.SSL_RENEWAL_DAYS) || 30,
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
      return {
        ...baseConfig,
        origin: this.getProductionOrigins(),
        optionsSuccessStatus: 200,
      };
    }

    if (this.isStaging) {
      return {
        ...baseConfig,
        origin: this.getStagingOrigins(),
      };
    }

    return {
      ...baseConfig,
      origin: true,
      credentials: true,
    };
  }

  getProductionOrigins() {
    const origins = process.env.ALLOWED_ORIGINS;

    if (origins) {
      return origins.split(",").map((origin) => origin.trim());
    }

    return ["https://yourdomain.com", "https://www.yourdomain.com", "https://app.yourdomain.com"];
  }

  getStagingOrigins() {
    return [
      "https://staging.yourdomain.com",
      "https://dev.yourdomain.com",
      "http://localhost:3000",
      "http://localhost:19006",
    ];
  }

  getSecurityHeaders() {
    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
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

  getHSTSHeader() {
    const config = this.getHSTSConfig();
    let header = `max-age=${config.maxAge}`;

    if (config.includeSubDomains) {
      header += "; includeSubDomains";
    }

    if (config.preload) {
      header += "; preload";
    }

    return header;
  }

  validateConfig() {
    const config = this.getSSLConfig();
    const issues = [];

    if (this.isProduction) {
      if (!config.forceHTTPS) {
        issues.push("HTTPS enforcement should be enabled in production");
      }

      if (!config.hstsConfig.includeSubDomains) {
        issues.push("HSTS should include subdomains in production");
      }

      if (config.hstsConfig.maxAge < 31536000) {
        issues.push("HSTS max-age should be at least 1 year in production");
      }
    }

    const certConfig = config.certificateConfig;
    if (certConfig.certPath && !certConfig.keyPath) {
      issues.push("SSL certificate path specified but no key path");
    }

    return {
      valid: issues.length === 0,
      issues,
      config,
    };
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
