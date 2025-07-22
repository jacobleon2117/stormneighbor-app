const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NODE_ENV",
  "NOAA_API_BASE_URL",
];

const optionalEnvVars = [
  "PORT",
  "CLIENT_URL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
];

function validateEnvironment() {
  console.log("🔍 Validating environment variables...");

  const missing = [];
  const present = [];

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

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    process.exit(1);
  }

  console.log(
    `✅ Environment validated (${present.length} variables configured)`
  );

  if (process.env.NODE_ENV === "development") {
    console.log("⚠️  Running in development mode");
    if (!process.env.CLIENT_URL) {
      console.log(
        "💡 CLIENT_URL not set, using default: http://localhost:19006"
      );
    }
  }
}

module.exports = validateEnvironment;
