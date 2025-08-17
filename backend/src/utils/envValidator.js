// File: backend/src/utils/envValidator.js
const fs = require("fs");
const path = require("path");

class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      DATABASE_URL: {
        required: true,
        description: "PostgreSQL database connection URL",
        validator: (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
        errorMessage: "DATABASE_URL must be a valid PostgreSQL connection string",
      },

      JWT_SECRET: {
        required: true,
        description: "Secret key for JWT token signing",
        validator: (value) => value.length >= 32,
        errorMessage: "JWT_SECRET must be at least 32 characters long",
      },

      PORT: {
        required: false,
        default: "3000",
        description: "Server port number",
        validator: (value) => !isNaN(value) && parseInt(value) > 0 && parseInt(value) < 65536,
        errorMessage: "PORT must be a valid port number (1-65535)",
      },

      NODE_ENV: {
        required: false,
        default: "development",
        description: "Node.js environment",
        validator: (value) => ["development", "test", "staging", "production"].includes(value),
        errorMessage: "NODE_ENV must be one of: development, test, staging, production",
      },

      FIREBASE_PROJECT_ID: {
        required: false,
        description: "Firebase project ID for push notifications",
        validator: (value) => !value || value.length > 0,
        errorMessage: "FIREBASE_PROJECT_ID must not be empty if provided",
      },

      FIREBASE_PRIVATE_KEY: {
        required: false,
        description: "Firebase private key for push notifications",
        validator: (value) => !value || value.includes("BEGIN PRIVATE KEY"),
        errorMessage: "FIREBASE_PRIVATE_KEY must be a valid private key",
      },

      FIREBASE_CLIENT_EMAIL: {
        required: false,
        description: "Firebase client email for push notifications",
        validator: (value) => !value || (value.includes("@") && value.includes(".")),
        errorMessage: "FIREBASE_CLIENT_EMAIL must be a valid email address",
      },

      NOAA_API_BASE_URL: {
        required: false,
        default: "https://api.weather.gov",
        description: "NOAA Weather API base URL",
        validator: (value) => value.startsWith("http"),
        errorMessage: "NOAA_API_BASE_URL must be a valid HTTP(S) URL",
      },

      CLOUDINARY_CLOUD_NAME: {
        required: false,
        description: "Cloudinary cloud name for image uploads",
        validator: (value) => !value || /^[a-zA-Z0-9_-]+$/.test(value),
        errorMessage:
          "CLOUDINARY_CLOUD_NAME must contain only alphanumeric characters, hyphens, and underscores",
      },

      CLOUDINARY_API_KEY: {
        required: false,
        description: "Cloudinary API key",
        validator: (value) => !value || /^\d+$/.test(value),
        errorMessage: "CLOUDINARY_API_KEY must be numeric",
      },

      CLOUDINARY_API_SECRET: {
        required: false,
        description: "Cloudinary API secret",
        validator: (value) => !value || value.length >= 20,
        errorMessage: "CLOUDINARY_API_SECRET must be at least 20 characters",
      },

      CORS_ORIGIN: {
        required: false,
        default: "*",
        description: "CORS allowed origins",
        validator: (value) => value === "*" || value.startsWith("http"),
        errorMessage: "CORS_ORIGIN must be " * " or a valid HTTP(S) URL",
      },

      RATE_LIMIT_WINDOW_MS: {
        required: false,
        default: "900000",
        description: "Rate limiting window in milliseconds",
        validator: (value) => !isNaN(value) && parseInt(value) > 0,
        errorMessage: "RATE_LIMIT_WINDOW_MS must be a positive number",
      },

      RATE_LIMIT_MAX_REQUESTS: {
        required: false,
        default: "100",
        description: "Maximum requests per rate limit window",
        validator: (value) => !isNaN(value) && parseInt(value) > 0,
        errorMessage: "RATE_LIMIT_MAX_REQUESTS must be a positive number",
      },
    };

    this.errors = [];
    this.warnings = [];
    this.config = {};
  }

  validate(silent = false) {
    this.errors = [];
    this.warnings = [];
    this.config = {};
    this.silent = silent || process.env.NODE_ENV === "test";

    if (!this.silent) {
      console.log("🔍 Validating environment configuration...\n");
    }

    this.checkEnvFile();

    for (const [varName, config] of Object.entries(this.requiredVars)) {
      this.validateVariable(varName, config);
    }

    this.validateCombinations();

    if (!this.silent) {
      this.reportResults();
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      config: this.config,
    };
  }

  checkEnvFile() {
    const envPath = path.join(process.cwd(), ".env");
    const envExamplePath = path.join(process.cwd(), ".env.example");

    if (!fs.existsSync(envPath)) {
      if (process.env.NODE_ENV === "production") {
        this.errors.push("❌ .env file not found in production environment");
      } else {
        this.warnings.push("⚠️  .env file not found (using system environment variables)");
      }
    } else if (!this.silent) {
      console.log("✅ .env file found");
    }

    if (!fs.existsSync(envExamplePath)) {
      this.warnings.push("⚠️  .env.example file not found (recommended for documentation)");
    }
  }

  validateVariable(varName, config) {
    let value = process.env[varName];

    if (!value && config.required) {
      this.errors.push(`❌ Missing required environment variable: ${varName}`);
      return;
    }

    if (!value && config.default) {
      value = config.default;
      process.env[varName] = value;
      this.warnings.push(`⚠️  Using default value for ${varName}: ${value}`);
    }

    if (!value) {
      return;
    }

    if (config.validator && !config.validator(value)) {
      this.errors.push(`❌ Invalid ${varName}: ${config.errorMessage}`);
      return;
    }

    this.config[varName] = value;
    if (!this.silent) {
      console.log(`✅ ${varName}: ${this.maskSensitive(varName, value)}`);
    }
  }

  validateCombinations() {
    const firebaseVars = ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"];
    const providedFirebaseVars = firebaseVars.filter((varName) => process.env[varName]);

    if (providedFirebaseVars.length > 0 && providedFirebaseVars.length < firebaseVars.length) {
      this.warnings.push("⚠️  Incomplete Firebase configuration - push notifications may not work");
    }

    const cloudinaryVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    const providedCloudinaryVars = cloudinaryVars.filter((varName) => process.env[varName]);

    if (
      providedCloudinaryVars.length > 0 &&
      providedCloudinaryVars.length < cloudinaryVars.length
    ) {
      this.warnings.push("⚠️  Incomplete Cloudinary configuration - image uploads may not work");
    }

    if (process.env.NODE_ENV === "production") {
      if (!process.env.FIREBASE_PROJECT_ID) {
        this.warnings.push(
          "⚠️  Firebase not configured in production - push notifications disabled"
        );
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        this.warnings.push("⚠️  Cloudinary not configured in production - image uploads may fail");
      }

      if (process.env.CORS_ORIGIN === "*") {
        this.warnings.push(
          "⚠️  CORS_ORIGIN is set to " * " in production - consider restricting to specific domains"
        );
      }
    }
  }

  maskSensitive(varName, value) {
    const sensitiveVars = [
      "JWT_SECRET",
      "DATABASE_URL",
      "FIREBASE_PRIVATE_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    if (sensitiveVars.includes(varName)) {
      if (value.length <= 8) {
        return "*".repeat(value.length);
      }
      return value.substring(0, 4) + "*".repeat(4) + value.substring(value.length - 4);
    }

    return value;
  }

  reportResults() {
    console.log("\n📊 Environment Validation Results:");

    if (this.errors.length === 0) {
      console.log("✅ Environment configuration is valid!\n");
    } else {
      console.log(`❌ Environment configuration has ${this.errors.length} error(s):\n`);
      this.errors.forEach((error) => console.log(`  ${error}`));
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warning(s):\n`);
      this.warnings.forEach((warning) => console.log(`  ${warning}`));
      console.log("");
    }

    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🚀 Port: ${process.env.PORT || "3000"}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? "Configured" : "Not configured"}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? "Configured" : "Not configured"}`);
    console.log(
      `📱 Push Notifications: ${process.env.FIREBASE_PROJECT_ID ? "Enabled" : "Disabled"}`
    );
    console.log(`☁️  Image Uploads: ${process.env.CLOUDINARY_CLOUD_NAME ? "Enabled" : "Disabled"}`);
    console.log("");
  }

  getRequiredVariables() {
    return Object.entries(this.requiredVars)
      .filter(([_, config]) => config.required)
      .map(([varName, config]) => ({
        name: varName,
        description: config.description,
        example: config.example || "",
      }));
  }

  generateEnvTemplate() {
    let template = "# Environment Configuration\n";
    template += "# Generated by Environment Validator\n\n";

    for (const [varName, config] of Object.entries(this.requiredVars)) {
      template += `# ${config.description}\n`;
      if (config.required) {
        template += `${varName}=\n\n`;
      } else {
        template += `# ${varName}=${config.default || ""}\n\n`;
      }
    }

    return template;
  }
}

module.exports = EnvironmentValidator;
