const { Pool } = require("pg");
require("dotenv").config();

const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isStaging = process.env.NODE_ENV === "staging";

  let sslConfig = false;

  if (process.env.DATABASE_SSL === "true" || isProduction || isStaging) {
    sslConfig = {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    };

    if (
      process.env.DATABASE_URL?.includes("supabase") ||
      process.env.DATABASE_URL?.includes("railway") ||
      process.env.DATABASE_URL?.includes("render") ||
      process.env.DATABASE_URL?.includes("heroku")
    ) {
      sslConfig.rejectUnauthorized = false;
    }
  }

  return {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: parseInt(process.env.DB_POOL_SIZE) || (isProduction ? 20 : 5),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  };
};

const pool = new Pool(getDatabaseConfig());

const testConnection = async () => {
  try {
    const client = await pool.connect();
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

    client.release();
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
      console.error(
        "HINT: Try setting DATABASE_SSL=true or DATABASE_SSL_REJECT_UNAUTHORIZED=false"
      );
    }

    return false;
  }
};

const enablePostGIS = async () => {
  try {
    const client = await pool.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis_topology;");
    console.log("SUCCESS: PostGIS extensions enabled");
    client.release();
  } catch (error) {
    console.warn("WARN: Failed to enable PostGIS:", error.message);
    console.warn("INFO: This is OK if PostGIS is not needed for current features");
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

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = {
  pool,
  testConnection,
  enablePostGIS,
  getDatabaseConfig,
  gracefulShutdown,
};
