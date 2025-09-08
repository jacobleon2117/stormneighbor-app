require("dotenv").config();
const { testConnection, enablePostGIS } = require("../src/config/database");
const { testCloudinaryConnection } = require("../src/config/cloudinary");
const { testEmailService } = require("../src/services/emailService");

async function runDiagnostics() {
  console.log("Backend Diagnostics");
  console.log("=====================================\n");

  const results = {
    environment: true,
    database: false,
    postgis: false,
    cloudinary: false,
    email: false,
  };

  console.log("WORKING: Checking Environment Variables");
  const requiredVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "RESEND_API_KEY",
    "FROM_EMAIL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("ERROR: Missing environment variables:", missing.join(", "));
    results.environment = false;
  } else {
    console.log("SUCCESS: All required environment variables are set");
    results.environment = true;
  }

  console.log("\nWORKING: Testing Database Connection");
  try {
    results.database = await testConnection();
    if (results.database) {
      console.log("SUCCESS: Database connection successful");
    }
  } catch (error) {
    console.error("ERROR: Database connection failed:", error.message);
  }

  console.log("\nWORKING: Testing PostGIS (optional)...");
  try {
    results.postgis = await enablePostGIS();
    if (results.postgis) {
      console.log("SUCCESS: PostGIS is available");
    }
  } catch (error) {
    console.log("INFO: PostGIS not available (this is OK - Optional)");
  }

  console.log("\nTESTING: Testing Cloudinary Connection");
  try {
    results.cloudinary = await testCloudinaryConnection();
    if (results.cloudinary) {
      console.log("SUCCESS: Cloudinary connection successful");
    }
  } catch (error) {
    console.error("ERROR: Cloudinary connection failed:", error.message);
  }

  console.log("\nTESTING: Testing Email Service...");
  try {
    const emailResult = await testEmailService();
    results.email = emailResult.success;
    if (results.email) {
      console.log("SUCCESS: Email service configuration is valid");
    } else {
      console.error("ERROR: Email service configuration failed:", emailResult.error);
    }
  } catch (error) {
    console.error("ERROR: Email service test failed:", error.message);
  }

  console.log("\nSUMMARY");
  console.log("=====================================");
  console.log(`Environment: ${results.environment ? "SUCCESS:" : "ERROR:"}`);
  console.log(`Database: ${results.database ? "SUCCESS:" : "ERROR:"}`);
  console.log(`PostGIS: ${results.postgis ? "SUCCESS:" : "INFO: Optional"}`);
  console.log(`Cloudinary: ${results.cloudinary ? "SUCCESS:" : "ERROR:"}`);
  console.log(`Email: ${results.email ? "SUCCESS:" : "ERROR:"}`);

  const criticalServices = ["environment", "database", "cloudinary", "email"];
  const criticalPassing = criticalServices.every((service) => results[service]);

  if (criticalPassing) {
    console.log("\nSUCCESS: All critical services are working, backend ready");
    console.log("\nContinue with:");
    console.log("STEP: Run schema setup");
    console.log("STEP: Start server");
    console.log("STEP: Test API endpoints");
  } else {
    console.log("\nWARNING: Some critical services need attention before proceeding");
    console.log("\nWARNING: Fix failing services, then run script again");
  }

  return criticalPassing;
}

async function setupSchema() {
  console.log("WORKING: Setting up database schema");

  const fs = require("fs");
  const path = require("path");
  const { pool } = require("../src/config/database");

  try {
    const schemaPath = path.join(__dirname, "..", "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error("ERROR: Schema file not found at: " + schemaPath);
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    const client = await pool.connect();

    try {
      console.log("WORKING: Executing schema");
      await client.query(schema);
      console.log("SUCCESS: Schema setup completed successfully");

      const testUser = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, location_city, address_state, email_verified)
        VALUES ('test@stormneighbor.test', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWHH6EjT2j8HsWKa', 'Test', 'User', 'Austin', 'Texas', true)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `);

      if (testUser.rows.length > 0) {
        console.log("SUCCESS: Test user created with ID:", testUser.rows[0].id);
      } else {
        console.log("INFO: Test user already exists");
      }
    } finally {
      client.release();
    }

    if (require.main === module) {
      await pool.end();
    }
  } catch (error) {
    console.error("ERROR: Schema setup failed:", error.message);
    if (require.main === module) {
      await pool.end();
    }
    throw error;
  }
}

if (require.main === module) {
  const command = process.argv[2];

  if (command === "schema") {
    setupSchema()
      .then(() => {
        console.log("SUCCESS: Schema setup complete!");
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error("ERROR: Schema setup failed:", error.message);
        process.exitCode = 1;
      });
  } else {
    runDiagnostics()
      .then((success) => {
        process.exitCode = success ? 0 : 1;
      })
      .catch((error) => {
        console.error("ERROR: Diagnostics failed:", error.message);
        process.exitCode = 1;
      });
  }
}

module.exports = { runDiagnostics, setupSchema };
