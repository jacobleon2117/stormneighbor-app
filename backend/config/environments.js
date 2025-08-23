const environments = {
  development: {
    server: {
      port: process.env.PORT || 3000,
      corsOrigin: process.env.CLIENT_URL || "http://localhost:19006",
    },
    database: {
      ssl: false,
      poolSize: 5,
      connectionTimeout: 10000,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    cache: {
      ttl: 5 * 60 * 1000,
      maxSize: 1000,
    },
    logging: {
      level: "debug",
      enableRequestLogging: true,
      enablePerformanceMonitoring: true,
    },
    security: {
      strictCSP: false,
      enableHSTS: false,
    },
  },

  staging: {
    server: {
      port: process.env.PORT || 3000,
      corsOrigin: process.env.CLIENT_URL,
    },
    database: {
      ssl: true,
      poolSize: 10,
      connectionTimeout: 15000,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 75,
    },
    cache: {
      ttl: 10 * 60 * 1000,
      maxSize: 2000,
    },
    logging: {
      level: "info",
      enableRequestLogging: true,
      enablePerformanceMonitoring: true,
    },
    security: {
      strictCSP: true,
      enableHSTS: true,
    },
  },

  production: {
    server: {
      port: process.env.PORT || 3000,
      corsOrigin: process.env.CLIENT_URL,
    },
    database: {
      ssl: true,
      poolSize: 20,
      connectionTimeout: 30000,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 50,
    },
    cache: {
      ttl: 30 * 60 * 1000,
      maxSize: 5000,
    },
    logging: {
      level: "warn",
      enableRequestLogging: false,
      enablePerformanceMonitoring: true,
    },
    security: {
      strictCSP: true,
      enableHSTS: true,
      additionalHeaders: {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "same-origin",
      },
    },
  },

  test: {
    server: {
      port: 0,
      corsOrigin: "*",
    },
    database: {
      ssl: false,
      poolSize: 2,
      connectionTimeout: 5000,
    },
    rateLimit: {
      windowMs: 1000,
      max: 1000,
    },
    cache: {
      ttl: 1000,
      maxSize: 100,
    },
    logging: {
      level: "error",
      enableRequestLogging: false,
      enablePerformanceMonitoring: false,
    },
    security: {
      strictCSP: false,
      enableHSTS: false,
    },
  },
};

function getConfig() {
  const env = process.env.NODE_ENV || "development";
  const config = environments[env];

  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }

  return {
    ...config,
    environment: env,
    isDevelopment: env === "development",
    isStaging: env === "staging",
    isProduction: env === "production",
    isTest: env === "test",
  };
}

module.exports = {
  environments,
  getConfig,
};
