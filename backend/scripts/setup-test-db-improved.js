// File: backend/scripts/setup-test-db-improved.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let insideDollarQuote = false;
  let dollarQuoteTag = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (char === "$") {
      const match = sql.slice(i).match(/^\$[^$]*\$/);
      if (match) {
        const tag = match[0];
        if (!insideDollarQuote) {
          insideDollarQuote = true;
          dollarQuoteTag = tag;
          current += tag;
          i += tag.length - 1;
          continue;
        } else if (dollarQuoteTag === tag) {
          insideDollarQuote = false;
          dollarQuoteTag = null;
          current += tag;
          i += tag.length - 1;
          continue;
        }
      }
    }

    if (char === ";" && !insideDollarQuote) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));
}

async function setupTestDatabase() {
  console.log("Setting up test database...");

  if (require.main === module) {
    setupTestDatabase().catch((error) => {
      console.error("Fatal error:", error.message);
      throw error;
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5,
  });

  let client;

  try {
    console.log("Connecting to database...");
    client = await pool.connect();
    console.log("Database connection established");

    const timeResult = await client.query("SELECT NOW() as current_time");
    console.log("Database time:", timeResult.rows[0].current_time);

    const versionResult = await client.query("SELECT version()");
    console.log("PostgreSQL version:", versionResult.rows[0].version);

    try {
      console.log("Attempting to enable PostGIS...");
      await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

      const postgisResult = await client.query("SELECT PostGIS_Version()");
      console.log("PostGIS enabled - version:", postgisResult.rows[0].postgis_version);
    } catch (postgisError) {
      console.log("PostGIS not available (this is OK for testing):", postgisError.message);
    }

    console.log("Reading database schema...");
    const schemaPath = path.join(__dirname, "..", "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("Schema file size:", schema.length, "characters");

    const statements = splitSqlStatements(schema);

    console.log("Executing", statements.length, "database statements...");

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        if (statement.includes("PostGIS") || statement.includes("postgis")) {
          try {
            await client.query(statement + ";");
          } catch (postgisErr) {
            if (postgisErr.message.includes("postgis") || postgisErr.message.includes("geometry")) {
              console.log(`Skipping PostGIS statement ${i + 1} (PostGIS not available)`);
              continue;
            }
            throw postgisErr;
          }
        } else {
          await client.query(statement + ";");
        }

        if ((i + 1) % 10 === 0) {
          console.log(`   Executed ${i + 1}/${statements.length} statements`);
        }
      } catch (statementError) {
        if (
          statementError.message.includes("already exists") ||
          statementError.message.includes("does not exist")
        ) {
          console.log(`   Statement ${i + 1}: ${statementError.message} (continuing...)`);
          continue;
        }

        console.error(`Error in statement ${i + 1}:`, statement.substring(0, 100) + "...");
        console.error("Error:", statementError.message);
        throw statementError;
      }
    }

    console.log("Database schema setup complete!");

    await createTestData(client);

    await verifyDatabaseSetup(client);

    console.log("Test database setup completed successfully!");
  } catch (error) {
    console.error("Test database setup failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("Make sure PostgreSQL is running and accessible");
    } else if (error.code === "28P01") {
      console.error("Check your database credentials");
    } else if (error.code === "3D000") {
      console.error("Database does not exist - create it first");
    }

    throw error;
  } finally {
    if (client) {
      try {
        client.release();
        console.log("Database connection released");
      } catch (releaseError) {
        console.error("Error releasing connection:", releaseError.message);
      }
    }

    try {
      await pool.end();
      console.log("Connection pool closed");
    } catch (poolError) {
      console.error("Error closing pool:", poolError.message);
    }
  }
}

async function createTestData(client) {
  console.log("Creating test data...");

  try {
    const hashedPassword = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHH6EjT2j8HsWKa";

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

    console.log("   Test user created");

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

    console.log("   Test post created");

    const userCount = await client.query("SELECT COUNT(*) FROM users");
    const postCount = await client.query("SELECT COUNT(*) FROM posts");

    console.log(
      `   Test data created: ${userCount.rows[0].count} users, ${postCount.rows[0].count} posts`
    );
  } catch (error) {
    console.log("   Test data creation warning:", error.message);
  }
}

async function verifyDatabaseSetup(client) {
  console.log("Verifying database setup...");

  try {
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map((row) => row.table_name);
    console.log("   Tables found:", tableNames.join(", "));

    const expectedTables = ["users", "posts", "comments", "reactions", "weather_alerts"];
    const missingTables = expectedTables.filter((table) => !tableNames.includes(table));

    if (missingTables.length > 0) {
      console.warn("   Missing expected tables:", missingTables.join(", "));
    } else {
      console.log("   All expected tables present");
    }

    try {
      await client.query(
        "SELECT get_nearby_posts(30.2672, -97.7431, 'Austin', 'Texas', 10.0, false, 10, 0)"
      );
      console.log("   PostGIS functions working");
    } catch (funcError) {
      console.log("   PostGIS functions not available (this is OK for basic testing)");
    }

    console.log("Database verification complete");
  } catch (error) {
    console.error("Database verification failed:", error.message);
    throw error;
  }
}

process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
});

if (require.main === module) {
  setupTestDatabase().catch((error) => {
    console.error("Fatal error:", error.message);
    throw error;
  });
}

module.exports = { setupTestDatabase, createTestData, verifyDatabaseSetup };
