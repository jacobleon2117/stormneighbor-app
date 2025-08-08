// File: backend/src/config/validateEnv.js
require("dotenv").config();

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
  "SOCKET_CORS_ORIGIN",
  "DATABASE_SSL",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DB_POOL_SIZE",
  "DB_CONNECTION_TIMEOUT",
  "DB_IDLE_TIMEOUT",
  "REDIS_URL",
  "CACHE_TTL",
  "SENTRY_DSN",
  "LOG_LEVEL",
];

function validateEnvironment() {
  console.log("Validating environment variables...");

  const missing = [];
  const present = [];
  const warnings = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  });

  optionalEnvVars.forEach((envVar) => {
    if (process.env[envVar]) {
      present.push(envVar);
    }
  });

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_")) {
    warnings.push(
      "RESEND_API_KEY should start with 're_' - please verify this is a valid Resend API key"
    );
  }

  if (process.env.FROM_EMAIL && !process.env.FROM_EMAIL.includes("@")) {
    warnings.push("FROM_EMAIL appears to be invalid - should be a valid email address");
  }

  if (process.env.CLOUDINARY_API_KEY && !/^\d+$/.test(process.env.CLOUDINARY_API_KEY)) {
    warnings.push("CLOUDINARY_API_KEY should be numeric - please verify this is correct");
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push("JWT_SECRET is quite short - consider using a longer secret for better security");
  }

  if (process.env.NODE_ENV === "production" && process.env.DATABASE_SSL !== "true") {
    warnings.push("DATABASE_SSL should be 'true' in production for security");
  }

  if (process.env.NODE_ENV === "production") {
    const productionRequired = ["DATABASE_URL", "JWT_SECRET"];
    productionRequired.forEach((envVar) => {
      if (!process.env[envVar]) {
        missing.push(`${envVar} (CRITICAL FOR PRODUCTION)`);
      }
    });
  }

  if (missing.length > 0) {
    console.error("ERROR: Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error("\nAdd these to your .env file:");
    missing.forEach((envVar) => {
      console.error(`   ${envVar}=value_here`);
    });
    throw new Error("Missing required environment variables");
  }

  if (warnings.length > 0) {
    console.warn("\nWARN:  Configuration warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  console.log(`Environment validated (${present.length} variables configured)`);

  console.log(`Environment: ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV === "development") {
    console.log("Development mode settings:");
    console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:19006"}`);
    console.log(`Database SSL: ${process.env.DATABASE_SSL || "false"}`);
  }

  console.log("\nConfigured services:");
  console.log(`Database: ${process.env.DATABASE_URL ? "SUCCESS" : "ERROR"}`);
  console.log(`Email (Resend): ${process.env.RESEND_API_KEY ? "SUCCESS" : "ERROR"}`);
  console.log(`Weather (NOAA): ${process.env.NOAA_API_BASE_URL ? "SUCCESS" : "ERROR"}`);
  console.log(
    `Images (Cloudinary): ${
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? "SUCCESS"
        : "ERROR"
    }`
  );
  console.log(`   JWT Security: ${process.env.JWT_SECRET ? "SUCCESS" : "ERROR"}`);
  console.log(`   Redis Cache: ${process.env.REDIS_URL ? "SUCCESS" : "Optional"}`);
}

module.exports = validateEnvironment;
