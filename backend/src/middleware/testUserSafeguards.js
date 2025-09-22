const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

const createRateLimiter = ({ windowMs, max, message, serviceName }) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(
        `RATE_LIMIT_HIT: ${serviceName} - User: ${req.user?.userId || "anonymous"} - IP: ${req.ip} - Time: ${new Date().toISOString()}`
      );
      res.status(429).json(message);
    },
  });
};

const testUserLimits = {
  weather: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message: "Weather API limit reached. Please wait 15 minutes.",
      type: "RATE_LIMIT_WEATHER",
    },
    serviceName: "weather",
  }),

  general: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
      success: false,
      message: "API limit reached. Please wait before making more requests.",
      type: "RATE_LIMIT_GENERAL",
    },
    serviceName: "general",
  }),

  posts: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: {
      success: false,
      message: "Post limit reached. Please wait 5 minutes before posting again.",
      type: "RATE_LIMIT_POSTS",
    },
    serviceName: "posts",
  }),

  uploads: createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: "Upload limit reached. Please wait 10 minutes.",
      type: "RATE_LIMIT_UPLOADS",
    },
    serviceName: "uploads",
  }),
};

const trackAPIUsage = (service) => {
  return (req, res, next) => {
    const userId = req.user?.userId || "anonymous";
    const ip = req.ip;

    logger.info(
      `API_USAGE: ${service} - User: ${userId} - IP: ${ip} - Time: ${new Date().toISOString()}`
    );

    res.setHeader("X-API-Service", service);
    res.setHeader("X-Rate-Limit-Service", service);

    next();
  };
};

const costMonitor = (_req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const service = res.getHeader("X-API-Service") || "unknown";

    if (duration > 1000 || service === "weather") {
      logger.info(
        `COST_MONITOR: ${service} - Duration: ${duration}ms - Status: ${res.statusCode} - Time: ${new Date().toISOString()}`
      );
    }
  });

  next();
};

module.exports = {
  testUserLimits,
  trackAPIUsage,
  costMonitor,
};
