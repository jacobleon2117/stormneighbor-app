const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NODE_ENV",
  "NOAA_API_BASE_URL",
  "RESEND_API_KEY",
  "FROM_EMAIL",
];

const optionalEnvVars = [
  "PORT",
  "CLIENT_URL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "FROM_NAME",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
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

  const cloudinaryVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const cloudinaryPresent = cloudinaryVars.filter(
    (envVar) => process.env[envVar]
  );

  if (cloudinaryPresent.length > 0 && cloudinaryPresent.length < 3) {
    warnings.push(
      `Incomplete Cloudinary configuration. Found: ${cloudinaryPresent.join(", ")}. Need all three: ${cloudinaryVars.join(", ")}`
    );
  }

  if (missing.length > 0) {
    console.error("ERROR: Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error("\nAdd these to your .env file:");
    missing.forEach((envVar) => {
      if (envVar === "RESEND_API_KEY") {
        console.error(`   ${envVar}=re_your_resend_api_key_here`);
      } else if (envVar === "FROM_EMAIL") {
        console.error(`   ${envVar}=onboarding@resend.dev`);
      } else {
        console.error(`   ${envVar}=your_value_here`);
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
    if (cloudinaryPresent.length === 0) {
      console.log(
        "   Cloudinary not configured - image uploads will be disabled"
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
    `   Image Storage (Cloudinary): ${cloudinaryPresent.length === 3 ? "SUCCESS" : "ERROR"}`
  );
}

module.exports = validateEnvironment;
