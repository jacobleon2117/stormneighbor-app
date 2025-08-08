// File: backend/scripts/test-setup.js
// Run this script to test that everything is working correctly

require("dotenv").config();
const { testConnection, enablePostGIS } = require("../src/config/database");
const { testCloudinaryConnection } = require("../src/config/cloudinary");
const { testEmailService } = require("../src/services/emailService");

async function runDiagnostics() {
  console.log("🚀 StormNeighbor Backend Diagnostics");
  console.log("=====================================\n");

  const results = {
    environment: true,
    database: false,
    postgis: false,
    cloudinary: false,
    email: false,
  };

  // 1. Environment Check
  console.log("1️⃣  Checking Environment Variables...");
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
    console.error("❌ Missing environment variables:", missing.join(", "));
    results.environment = false;
  } else {
    console.log("✅ All required environment variables are set");
    results.environment = true;
  }

  // 2. Database Connection Test
  console.log("\n2️⃣  Testing Database Connection...");
  try {
    results.database = await testConnection();
    if (results.database) {
      console.log("✅ Database connection successful");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }

  // 3. PostGIS Test (optional)
  console.log("\n3️⃣  Testing PostGIS (optional)...");
  try {
    results.postgis = await enablePostGIS();
    if (results.postgis) {
      console.log("✅ PostGIS is available");
    }
  } catch (error) {
    console.log("ℹ️  PostGIS not available (this is OK)");
  }

  // 4. Cloudinary Test
  console.log("\n4️⃣  Testing Cloudinary Connection...");
  try {
    results.cloudinary = await testCloudinaryConnection();
    if (results.cloudinary) {
      console.log("✅ Cloudinary connection successful");
    }
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
  }

  // 5. Email Service Test
  console.log("\n5️⃣  Testing Email Service...");
  try {
    const emailResult = await testEmailService();
    results.email = emailResult.success;
    if (results.email) {
      console.log("✅ Email service configuration is valid");
    } else {
      console.error("❌ Email service configuration failed:", emailResult.error);
    }
  } catch (error) {
    console.error("❌ Email service test failed:", error.message);
  }

  // Summary
  console.log("\n📊 SUMMARY");
  console.log("===========");
  console.log(`Environment: ${results.environment ? "✅" : "❌"}`);
  console.log(`Database: ${results.database ? "✅" : "❌"}`);
  console.log(`PostGIS: ${results.postgis ? "✅" : "ℹ️  Optional"}`);
  console.log(`Cloudinary: ${results.cloudinary ? "✅" : "❌"}`);
  console.log(`Email: ${results.email ? "✅" : "❌"}`);

  const criticalServices = ["environment", "database", "cloudinary", "email"];
  const criticalPassing = criticalServices.every((service) => results[service]);

  if (criticalPassing) {
    console.log("\n🎉 All critical services are working! Your backend is ready to go.");
    console.log("\n📋 Next Steps:");
    console.log("1. Run the schema setup: node scripts/setup-schema.js");
    console.log("2. Start your server: npm run dev");
    console.log("3. Test your API endpoints");
  } else {
    console.log("\n⚠️  Some critical services need attention before proceeding.");
    console.log("\n🔧 Fix the failing services above, then run this script again.");
  }

  return criticalPassing;
}

// Schema setup helper
async function setupSchema() {
  console.log("🗄️  Setting up database schema...");

  const fs = require("fs");
  const path = require("path");
  const { pool } = require("../src/config/database");

  try {
    const schemaPath = path.join(__dirname, "..", "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error("Schema file not found at: " + schemaPath);
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    const client = await pool.connect();

    try {
      console.log("📝 Executing schema...");
      await client.query(schema);
      console.log("✅ Schema setup completed successfully!");

      // Create a test user
      const testUser = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, location_city, address_state, email_verified)
        VALUES ('test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWHH6EjT2j8HsWKa', 'Test', 'User', 'Austin', 'Texas', true)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `);

      if (testUser.rows.length > 0) {
        console.log("👤 Test user created with ID:", testUser.rows[0].id);
      } else {
        console.log("👤 Test user already exists");
      }
    } finally {
      client.release();
    }

    // Close pool only if this is the main execution
    if (require.main === module) {
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Schema setup failed:", error.message);
    // Close pool on error too, but only for main execution
    if (require.main === module) {
      await pool.end();
    }
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === "schema") {
    setupSchema()
      .then(() => {
        console.log("🎉 Schema setup complete!");
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error("❌ Schema setup failed:", error.message);
        process.exitCode = 1;
      });
  } else {
    runDiagnostics()
      .then((success) => {
        process.exitCode = success ? 0 : 1;
      })
      .catch((error) => {
        console.error("❌ Diagnostics failed:", error.message);
        process.exitCode = 1;
      });
  }
}

module.exports = { runDiagnostics, setupSchema };
