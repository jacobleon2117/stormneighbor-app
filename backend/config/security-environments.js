const { getConfig } = require("./environments");

function getSecurityConfig() {
  const config = getConfig();

  const baseHelmetConfig = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "https://res.cloudinary.com", "https://api.weather.gov"],
        connectSrc: ["'self'", "https://api.weather.gov"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  };

  if (config.isProduction) {
    return {
      ...baseHelmetConfig,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
      referrerPolicy: { policy: "same-origin" },
      contentSecurityPolicy: {
        ...baseHelmetConfig.contentSecurityPolicy,
        directives: {
          ...baseHelmetConfig.contentSecurityPolicy.directives,
          upgradeInsecureRequests: [],
        },
      },
    };
  }

  if (config.isStaging) {
    return {
      ...baseHelmetConfig,
      hsts: {
        maxAge: 7776000,
        includeSubDomains: true,
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
    };
  }

  return {
    ...baseHelmetConfig,
    hsts: false,
  };
}

function getRateLimitConfig() {
  const config = getConfig();

  return {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: config.isTest ? () => true : undefined,
  };
}

module.exports = {
  getSecurityConfig,
  getRateLimitConfig,
};
