const {
  testConnection,
  enablePostGIS,
  pool,
} = require("./src/config/database");

async function runDatabaseTest() {
  console.log("Testing database connection\n");

  const isConnected = await testConnection();

  if (isConnected) {
    console.log("\n Enabling PostGIS extensions");
    await enablePostGIS();

    console.log("\n Running additional tests");

    try {
      const client = await pool.connect();

      const geoTest = await client.query(
        "SELECT ST_GeomFromText('POINT(-95.99 36.15)') as point"
      );
      console.log("PostGIS geometry test passed!");

      const locationTest = await client.query(`
        SELECT ST_Distance(
          ST_GeomFromText('POINT(-95.99 36.15)'),
          ST_GeomFromText('POINT(-95.90 36.10)')
        ) as distance_degrees
      `);
      console.log("Location distance calculation test passed");
      console.log(
        "📏 Distance between test points:",
        locationTest.rows[0].distance_degrees,
        "degrees"
      );

      client.release();
    } catch (error) {
      console.error("PostGIS test failed:", error.message);
    }
  }

  console.log("\n Database test complete");
  process.exit(0);
}

runDatabaseTest();
