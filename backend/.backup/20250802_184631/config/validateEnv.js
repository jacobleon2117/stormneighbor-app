// File: backend/src/config/validateEnv.js
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

  if (
    process.env.RESEND_API_KEY &&
    !process.env.RESEND_API_KEY.startsWith("re_")
  ) {
    warnings.push(
      'RESEND_API_KEY should start with "re_" - please verify this is a valid Resend API key'
    );
  }

  if (process.env.FROM_EMAIL && !process.env.FROM_EMAIL.includes("@")) {
    warnings.push(
      "FROM_EMAIL appears to be invalid - should be a valid email address"
    );
  }

  if (
    process.env.CLOUDINARY_API_KEY &&
    !/^\d+$/.test(process.env.CLOUDINARY_API_KEY)
  ) {
    warnings.push(
      "CLOUDINARY_API_KEY should be numeric - please verify this is correct"
    );
  }

  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME.length < 3
  ) {
    warnings.push(
      "CLOUDINARY_CLOUD_NAME seems too short - please verify this is correct"
    );
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET is quite short - consider using a longer secret for better security"
    );
  }

  if (missing.length > 0) {
    console.error("ERROR: Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error("\nAdd these to your .env file:");
    missing.forEach((envVar) => {
      if (envVar === "RESEND_API_KEY") {
        console.error(`   ${envVar}=re_resend_api_key_here`);
      } else if (envVar === "FROM_EMAIL") {
        console.error(`   ${envVar}=onboarding@resend.dev`);
      } else if (envVar === "CLOUDINARY_CLOUD_NAME") {
        console.error(`   ${envVar}=cloud_name_here`);
      } else if (envVar === "CLOUDINARY_API_KEY") {
        console.error(`   ${envVar}=numeric_api_key_here`);
      } else if (envVar === "CLOUDINARY_API_SECRET") {
        console.error(`   ${envVar}=api_secret_here`);
      } else {
        console.error(`   ${envVar}=value_here`);
      }
    });
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("\nWARN: Configuration warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  console.log(
    `SUCCESS: Environment validated (${present.length} variables configured)`
  );

  if (process.env.NODE_ENV === "development") {
    console.log("Running in development mode");
    if (!process.env.CLIENT_URL) {
      console.log(
        "   CLIENT_URL not set, using default: http://localhost:19006"
      );
    }
  }

  console.log("\nConfigured services:");
  console.log(`   Database: ${process.env.DATABASE_URL ? "SUCCESS" : "ERROR"}`);
  console.log(
    `   Email (Resend): ${process.env.RESEND_API_KEY ? "SUCCESS" : "ERROR"}`
  );
  console.log(
    `   Weather (NOAA): ${process.env.NOAA_API_BASE_URL ? "SUCCESS" : "ERROR"}`
  );
  console.log(
    `   Image Storage (Cloudinary): ${
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? "SUCCESS"
        : "ERROR"
    }`
  );
  console.log(
    `   JWT Security: ${process.env.JWT_SECRET ? "SUCCESS" : "ERROR"}`
  );

  if (process.env.NODE_ENV === "development") {
    console.log("\nService details:");
    console.log(
      `   Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME || "not set"}`
    );
    console.log(`   Email From: ${process.env.FROM_EMAIL || "not set"}`);
    console.log(`   Client URL: ${process.env.CLIENT_URL || "default"}`);
  }
}

module.exports = validateEnvironment;
