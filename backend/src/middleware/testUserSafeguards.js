const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

const testUserLimits = {
  weather: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message: "Weather API limit reached. Please wait 15 minutes.",
      type: "RATE_LIMIT_WEATHER",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
      success: false,
      message: "API limit reached. Please wait before making more requests.",
      type: "RATE_LIMIT_GENERAL",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  posts: rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: {
      success: false,
      message: "Post limit reached. Please wait 5 minutes before posting again.",
      type: "RATE_LIMIT_POSTS",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  uploads: rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: "Upload limit reached. Please wait 10 minutes.",
      type: "RATE_LIMIT_UPLOADS",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

const trackAPIUsage = (service) => {
  return (req, res, next) => {
    logger.info(
      `API_USAGE: ${service} - User: ${req.user?.userId || "anonymous"} - IP: ${req.ip} - Time: ${new Date().toISOString()}`
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
    const service = res.getHeader("X-API-Service");

    if (duration > 1000 || service === "weather") {
      logger.info(`COST_MONITOR: ${service} took ${duration}ms - Status: ${res.statusCode}`);
    }
  });

  next();
};

module.exports = {
  testUserLimits,
  trackAPIUsage,
  costMonitor,
};
