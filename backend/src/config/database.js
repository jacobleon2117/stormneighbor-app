const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? {
        rejectUnauthorized: false,
        ca: null,
      }
    : false,
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");

    const result = await client.query("SELECT NOW()");
    console.log("📅 Current database time:", result.rows[0].now);

    try {
      const postgisResult = await client.query("SELECT PostGIS_Version()");
      console.log("🗺️ PostGIS version:", postgisResult.rows[0].postgis_version);
    } catch (postgisError) {
      console.log("⚠️ PostGIS not enabled yet - we'll enable it next!");
    }

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

const enablePostGIS = async () => {
  try {
    const client = await pool.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis_topology;");
    console.log("✅ PostGIS extensions enabled!");
    client.release();
  } catch (error) {
    console.error("❌ Failed to enable PostGIS:", error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  enablePostGIS,
};
