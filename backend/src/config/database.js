// File: backend/src/config/database.js
const { Pool } = require("pg");
require("dotenv").config();

const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isStaging = process.env.NODE_ENV === "staging";
  const isTest = process.env.NODE_ENV === "test";

  let sslConfig = false;

  if (isProduction || isStaging || process.env.DATABASE_SSL === "true") {
    sslConfig = {
      rejectUnauthorized: false,
    };
  }

  const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: isTest ? 2 : isProduction ? 20 : 5,
    connectionTimeoutMillis: isTest ? 5000 : 15000,
    idleTimeoutMillis: isTest ? 10000 : 30000,
    acquireTimeoutMillis: isTest ? 10000 : 60000,
  };

  return poolConfig;
};

const pool = new Pool(getDatabaseConfig());

const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("SUCCESS: Database connected successfully!");

    const result = await client.query("SELECT NOW() as current_time, version()");
    console.log("Database time:", result.rows[0].current_time);
    console.log("PostgreSQL version:", result.rows[0].version.split(" ")[0]);

    try {
      const postgisResult = await client.query("SELECT PostGIS_Version() as version");
      console.log("PostGIS version:", postgisResult.rows[0].version);
    } catch (postgisError) {
      console.log("INFO: PostGIS not available (this is OK for basic functionality)");
    }

    console.log("Pool status:", {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });

    return true;
  } catch (error) {
    console.error("ERROR: Database connection failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("HINT: Make sure PostgreSQL is running and accessible");
    } else if (error.code === "28P01") {
      console.error("HINT: Check your database credentials in DATABASE_URL");
    } else if (error.code === "3D000") {
      console.error("HINT: Database does not exist - create it first");
    } else if (error.message.includes("SSL")) {
      console.error("HINT: Try setting DATABASE_SSL=true for cloud databases");
    } else if (error.message.includes("timeout")) {
      console.error("HINT: Database connection timeout - check network connectivity");
    }

    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

const enablePostGIS = async () => {
  let client;
  try {
    client = await pool.connect();

    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis_topology;");

    console.log("SUCCESS: PostGIS extensions enabled");
    return true;
  } catch (error) {
    console.warn("WARN: PostGIS not available:", error.message);
    console.warn("INFO: This is OK - city/state matching will work without PostGIS");
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

const gracefulShutdown = async () => {
  console.log("Shutting down database pool...");
  try {
    await pool.end();
    console.log("SUCCESS: Database pool closed gracefully");
  } catch (error) {
    console.error("ERROR: Error closing database pool:", error.message);
  }
};

if (process.env.NODE_ENV !== "test") {
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

pool.on("connect", () => {
  console.log("New database client connected");
});

pool.on("error", (err) => {
  console.error("FAILED: Unexpected database error:", err.message);
});

module.exports = {
  pool,
  testConnection,
  enablePostGIS,
  getDatabaseConfig,
  gracefulShutdown,
};
