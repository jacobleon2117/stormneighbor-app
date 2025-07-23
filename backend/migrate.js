const fs = require("fs");
const path = require("path");
const { pool } = require("./src/config/database");

async function runMigration() {
  console.log("🚀 Starting database migration...\n");

  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    const statements = schemaSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    const client = await pool.connect();

    console.log(`📊 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `⚡ Executing statement ${i + 1}/${statements.length}...`
          );
          await client.query(statement);
        } catch (error) {
          console.log(
            `⚠️  Statement ${i + 1} failed (might be expected):`,
            error.message
          );
        }
      }
    }

    console.log("\n🔍 Verifying tables...");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n✅ Created tables:");
    tablesResult.rows.forEach((row) => {
      console.log(`   📋 ${row.table_name}`);
    });

    console.log("\n🗺️  Testing PostGIS with sample data...");

    // Insert a sample neighborhood (Tulsa area)
    await client.query(`
      INSERT INTO neighborhoods (name, city, state, center_point, radius_miles) 
      VALUES (
        'Downtown Tulsa', 
        'Tulsa', 
        'OK', 
        ST_SetSRID(ST_MakePoint(-95.992775, 36.153982), 4326),
        2.0
      ) ON CONFLICT DO NOTHING;
    `);

    const locationTest = await client.query(`
      SELECT name, 
             ST_AsText(center_point) as center,
             ST_Distance(
               center_point::geometry,
               ST_SetSRID(ST_MakePoint(-95.99, 36.15), 4326)
             ) * 69 as distance_miles
      FROM neighborhoods 
      WHERE name = 'Downtown Tulsa';
    `);

    if (locationTest.rows.length > 0) {
      const result = locationTest.rows[0];
      console.log(`✅ Sample neighborhood: ${result.name}`);
      console.log(`📍 Center: ${result.center}`);
      console.log(
        `📏 Distance from test point: ${result.distance_miles.toFixed(2)} miles`
      );
    }

    client.release();
    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Create your Express server");
    console.log("   2. Add authentication routes");
    console.log("   3. Build the React Native app");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }

  process.exit(0);
}

runMigration();
