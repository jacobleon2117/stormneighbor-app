// File: backend/scripts/setup-test-db.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function setupTestDatabase() {
  console.log("Setting up test database...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    const client = await pool.connect();

    try {
      const schemaPath = path.join(__dirname, "..", "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");

      console.log("Running database schema...");

      await client.query(schema);

      console.log("SUCCESS: Test database setup complete!");

      try {
        const postgisResult = await client.query("SELECT PostGIS_Version()");
        console.log("PostGIS version:", postgisResult.rows[0].postgis_version);
      } catch (postgisError) {
        console.log(
          "WARN: PostGIS not available in test environment (that's okay)"
        );
      }

      await createTestData(client);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Test database setup failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createTestData(client) {
  console.log("Creating test data...");

  try {
    const hashedPassword =
      "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHH6EjT2j8HsWKa";

    await client.query(
      `
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        email_verified, location_city, address_state,
        created_at
      ) VALUES (
        'test@example.com', $1, 'Test', 'User',
        true, 'Austin', 'Texas',
        NOW()
      ) ON CONFLICT (email) DO NOTHING
    `,
      [hashedPassword]
    );

    console.log("Test user created");

    await client.query(`
      INSERT INTO posts (
        user_id, title, content, post_type, priority,
        location_city, location_state, created_at
      ) 
      SELECT 
        id, 'Test Post', 'This is a test post for CI/CD', 'general', 'normal',
        'Austin', 'Texas', NOW()
      FROM users 
      WHERE email = 'test@example.com'
      ON CONFLICT DO NOTHING
    `);

    console.log("Test post created");
  } catch (error) {
    console.log("WARN: Test data creation warning:", error.message);
  }
}

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
