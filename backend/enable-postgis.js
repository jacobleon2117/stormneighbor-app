// File: backend/enable-postgis.js
const { pool } = require("./src/config/database");

async function enablePostGIS() {
  console.log("Attempting to enable PostGIS...\n");

  try {
    const client = await pool.connect();

    const versionResult = await client.query("SELECT version()");
    console.log("PostgreSQL version:", versionResult.rows[0].version);

    console.log("\nChecking available extensions...");
    const extensionsResult = await client.query(`
      SELECT name, installed_version, default_version, comment 
      FROM pg_available_extensions 
      WHERE name LIKE '%postgis%' OR name LIKE '%geo%'
      ORDER BY name;
    `);

    if (extensionsResult.rows.length === 0) {
      console.log(
        " No PostGIS extensions found. This PostgreSQL instance may not support PostGIS."
      );
      console.log("Railway might need a different PostgreSQL image with PostGIS support.");
    } else {
      console.log("Available PostGIS extensions:");
      extensionsResult.rows.forEach((row) => {
        console.log(`   - ${row.name}: ${row.comment}`);
      });

      console.log("\nAttempting to install PostGIS...");
      try {
        await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
        console.log("PostGIS extension created successfully!");

        const testResult = await client.query("SELECT PostGIS_Version()");
        console.log("PostGIS version:", testResult.rows[0].postgis_version);
      } catch (createError) {
        console.log("Failed to create PostGIS extension:", createError.message);
      }
    }

    client.release();
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log("\nPostGIS setup attempt complete!");
}

enablePostGIS();
