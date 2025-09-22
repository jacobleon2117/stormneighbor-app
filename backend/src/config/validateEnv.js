require("dotenv").config();
const logger = require("../utils/logger");

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NODE_ENV",
  "NOAA_API_BASE_URL",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const optionalEnvVars = [
  "PORT",
  "CLIENT_URL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "FROM_NAME",
  "JWT_EXPIRES_IN",
  "DATABASE_SSL",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DB_POOL_SIZE",
  "DB_CONNECTION_TIMEOUT",
  "DB_IDLE_TIMEOUT",
  "CACHE_TTL",
  "LOG_LEVEL",
];

function validateEnvironment() {
  logger.info("WORKING: Validating environment variables");

  const missing = [];
  const present = [];
  const warnings = [];

  const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]?.trim()) {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  });

  optionalEnvVars.forEach((envVar) => {
    if (process.env[envVar]?.trim()) {
      present.push(envVar);
    }
  });

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_")) {
    warnings.push("RESEND_API_KEY should start with 're_' (verify this is a valid Resend API key)");
  }

  if (process.env.FROM_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.FROM_EMAIL)) {
    warnings.push("FROM_EMAIL appears invalid (should be a proper email address)");
  }

  if (process.env.CLOUDINARY_API_KEY && !/^\d+$/.test(process.env.CLOUDINARY_API_KEY)) {
    warnings.push("CLOUDINARY_API_KEY should be numeric (verify this is correct)");
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET is short (consider using at least 32 characters for better security)"
    );
  }

  if (nodeEnv === "production" && process.env.DATABASE_SSL !== "true") {
    warnings.push("DATABASE_SSL should be 'true' in production for secure connections");
  }

  if (nodeEnv === "production") {
    const productionRequired = ["DATABASE_URL", "JWT_SECRET"];
    productionRequired.forEach((envVar) => {
      if (!process.env[envVar]?.trim()) {
        missing.push(`${envVar} (CRITICAL FOR PRODUCTION)`);
      }
    });
  }

  [
    "PORT",
    "DB_POOL_SIZE",
    "DB_CONNECTION_TIMEOUT",
    "DB_IDLE_TIMEOUT",
    "RATE_LIMIT_WINDOW_MS",
    "RATE_LIMIT_MAX_REQUESTS",
    "CACHE_TTL",
  ].forEach((varName) => {
    if (process.env[varName] && isNaN(Number(process.env[varName]))) {
      warnings.push(`${varName} should be a numeric value`);
    }
  });

  if (missing.length > 0) {
    logger.error("ERROR: Missing required environment variables:");
    missing.forEach((envVar) => logger.error(`   - ${envVar}`));
    logger.error("\nINFO: Add these to your .env file:");
    missing.forEach((envVar) => {
      logger.error(`   ${envVar}=value_here`);
    });
    throw new Error("ERROR: Missing required environment variables");
  }

  if (warnings.length > 0) {
    logger.warn("\nWARNING: Configuration warnings:");
    warnings.forEach((warning) => logger.warn(`   - ${warning}`));
  }

  logger.info(`WORKING: Environment validated (${present.length} variables configured)`);
  logger.info(`Environment: ${nodeEnv}`);

  if (nodeEnv === "development") {
    logger.info("Development mode settings:");
    logger.info(`INFO: Client URL: ${process.env.CLIENT_URL || "http://localhost:19006"}`);
    logger.info(`INFO: Database SSL: ${process.env.DATABASE_SSL || "false"}`);
  }

  logger.info("\nConfigured services:");
  logger.info(`INFO: Database: ${process.env.DATABASE_URL ? "SUCCESS" : "ERROR"}`);
  logger.info(`INFO: Email (Resend): ${process.env.RESEND_API_KEY ? "SUCCESS" : "ERROR"}`);
  logger.info(`INFO: Weather (NOAA): ${process.env.NOAA_API_BASE_URL ? "SUCCESS" : "ERROR"}`);
  logger.info(
    `Images (Cloudinary): ${
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? "SUCCESS"
        : "ERROR"
    }`
  );
  logger.info(`JWT Security: ${process.env.JWT_SECRET ? "SUCCESS" : "ERROR"}`);
}

module.exports = validateEnvironment;
