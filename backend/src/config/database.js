const { Pool } = require("pg");
require("dotenv").config();
const logger = require("../utils/logger");
const process = require("process");

const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isStaging = process.env.NODE_ENV === "staging";
  const isTest = process.env.NODE_ENV === "test";

  let sslConfig = false;

  if (isProduction || isStaging || process.env.DATABASE_SSL === "true") {
    sslConfig = {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    };
  }

  return {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: isTest ? 2 : isProduction ? 20 : 5,
    connectionTimeoutMillis: isTest ? 5000 : 15000,
    idleTimeoutMillis: isTest ? 10000 : 30000,
    family: 4,
  };
};

const pool = new Pool(getDatabaseConfig());

const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    logger.info("SUCCESS: Database connected successfully!");

    const result = await client.query("SELECT NOW() as current_time, version()");
    logger.info("INFO: Database time:", result.rows[0].current_time);
    logger.info("INFO: PostgreSQL version:", result.rows[0].version.split(" ")[0]);

    try {
      const postgisResult = await client.query("SELECT PostGIS_Version() as version");
      logger.info("INFO: PostGIS version:", postgisResult.rows[0].version);
    } catch (postgisError) {
      logger.info("INFO: PostGIS not available (OK for testing)");
    }

    logger.info("Pool status:", {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });

    return true;
  } catch (error) {
    logger.error("ERROR: Database connection failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      logger.error("INFO: Make sure PostgreSQL is running and accessible");
    } else if (error.code === "28P01") {
      logger.error("INFO: Check your database credentials in DATABASE_URL");
    } else if (error.code === "3D000") {
      logger.error("INFO: Database does not exist, create it first");
    } else if (error.message.includes("SSL")) {
      logger.error("INFO: Try setting DATABASE_SSL=true for cloud databases");
    } else if (error.message.includes("timeout")) {
      logger.error("INFO: Database connection timeout, check network connectivity");
    }

    return false;
  } finally {
    if (client) client.release();
  }
};

const enablePostGIS = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis_topology;");

    logger.info("SUCCESS: PostGIS extensions enabled");
    return true;
  } catch (error) {
    logger.warn("WARNING: PostGIS not available:", error.message);
    logger.warn("INFO: This is OK (city/state matching will work without PostGIS)");
    return false;
  } finally {
    if (client) client.release();
  }
};

const gracefulShutdown = async () => {
  logger.info("WORKING: Shutting down database pool");
  try {
    await pool.end();
    logger.info("SUCCESS: Database pool closed gracefully");
  } catch (error) {
    logger.error("ERROR: Error closing database pool:", error.message);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

pool.on("connect", () => {
  logger.info("SUCCESS: New database client connected");
});

pool.on("error", (err) => {
  logger.error("ERROR: Unexpected database error:", err.message);
  logger.debug(err.stack);
});

module.exports = {
  pool,
  testConnection,
  enablePostGIS,
  getDatabaseConfig,
  gracefulShutdown,
};
