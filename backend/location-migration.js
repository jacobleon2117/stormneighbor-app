// File: backend/location-migration.js
const fs = require("fs");
const path = require("path");
const { pool } = require("./src/config/database");

async function runLocationMigration() {
  console.log("🚀 Starting location-based migration...\n");

  try {
    const client = await pool.connect();

    console.log("📊 Step 1: Adding new location columns to users table...");

    // Add location columns to users table
    const userColumns = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_city VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_county VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_radius_miles DECIMAL(4,1) DEFAULT 10.0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS show_city_only BOOLEAN DEFAULT FALSE",
    ];

    for (const sql of userColumns) {
      try {
        await client.query(sql);
        console.log("✅ Added user column");
      } catch (error) {
        console.log("⚠️  Column might already exist:", error.message);
      }
    }

    console.log("\n📊 Step 2: Adding location columns to posts table...");

    // Add location columns to posts table
    const postColumns = [
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_city VARCHAR(100)",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_state VARCHAR(50)",
      "ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_county VARCHAR(100)",
    ];

    for (const sql of postColumns) {
      try {
        await client.query(sql);
        console.log("✅ Added post column");
      } catch (error) {
        console.log("⚠️  Column might already exist:", error.message);
      }
    }

    console.log(
      "\n📊 Step 3: Adding location columns to weather_alerts table..."
    );

    // Add location columns to weather_alerts table
    const alertColumns = [
      "ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS location_city VARCHAR(100)",
      "ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS location_state VARCHAR(50)",
      "ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS location_county VARCHAR(100)",
    ];

    for (const sql of alertColumns) {
      try {
        await client.query(sql);
        console.log("✅ Added alert column");
      } catch (error) {
        console.log("⚠️  Column might already exist:", error.message);
      }
    }

    console.log(
      "\n📊 Step 4: Adding location columns to emergency_resources table..."
    );

    // Add location columns to emergency_resources table
    const resourceColumns = [
      "ALTER TABLE emergency_resources ADD COLUMN IF NOT EXISTS location_city VARCHAR(100)",
      "ALTER TABLE emergency_resources ADD COLUMN IF NOT EXISTS location_state VARCHAR(50)",
      "ALTER TABLE emergency_resources ADD COLUMN IF NOT EXISTS location_county VARCHAR(100)",
    ];

    for (const sql of resourceColumns) {
      try {
        await client.query(sql);
        console.log("✅ Added resource column");
      } catch (error) {
        console.log("⚠️  Column might already exist:", error.message);
      }
    }

    console.log("\n📊 Step 5: Dropping old neighborhood constraints...");

    // Remove old neighborhood foreign keys if they exist
    const dropConstraints = [
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_neighborhood",
      "ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_neighborhood_id_fkey",
      "ALTER TABLE weather_alerts DROP CONSTRAINT IF EXISTS weather_alerts_neighborhood_id_fkey",
      "ALTER TABLE emergency_resources DROP CONSTRAINT IF EXISTS emergency_resources_neighborhood_id_fkey",
    ];

    for (const sql of dropConstraints) {
      try {
        await client.query(sql);
        console.log("✅ Dropped constraint");
      } catch (error) {
        console.log("⚠️  Constraint might not exist:", error.message);
      }
    }

    console.log("\n📊 Step 6: Dropping old neighborhood columns...");

    // Remove neighborhood_id columns
    const dropColumns = [
      "ALTER TABLE users DROP COLUMN IF EXISTS neighborhood_id",
      "ALTER TABLE posts DROP COLUMN IF EXISTS neighborhood_id",
      "ALTER TABLE weather_alerts DROP COLUMN IF EXISTS neighborhood_id",
      "ALTER TABLE emergency_resources DROP COLUMN IF EXISTS neighborhood_id",
    ];

    for (const sql of dropColumns) {
      try {
        await client.query(sql);
        console.log("✅ Dropped neighborhood_id column");
      } catch (error) {
        console.log("⚠️  Column might not exist:", error.message);
      }
    }

    console.log("\n📊 Step 7: Creating location-based indexes...");

    // Create new indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_users_city ON users(location_city, address_state)",
      "CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(location_city, location_state)",
      "CREATE INDEX IF NOT EXISTS idx_weather_alerts_city ON weather_alerts(location_city, location_state)",
      "CREATE INDEX IF NOT EXISTS idx_emergency_resources_city ON emergency_resources(location_city, location_state)",
    ];

    for (const sql of indexes) {
      try {
        await client.query(sql);
        console.log("✅ Created index");
      } catch (error) {
        console.log("⚠️  Index might already exist:", error.message);
      }
    }

    console.log("\n📊 Step 8: Creating get_nearby_posts function...");

    // Create the get_nearby_posts function
    const nearbyPostsFunction = `
      CREATE OR REPLACE FUNCTION get_nearby_posts(
          user_latitude DECIMAL,
          user_longitude DECIMAL,
          user_city VARCHAR DEFAULT NULL,
          user_state VARCHAR DEFAULT NULL,
          radius_miles DECIMAL DEFAULT 10.0,
          city_only BOOLEAN DEFAULT FALSE,
          post_limit INTEGER DEFAULT 20,
          post_offset INTEGER DEFAULT 0
      )
      RETURNS TABLE (
          id INTEGER,
          user_id INTEGER,
          title VARCHAR,
          content TEXT,
          post_type VARCHAR,
          priority VARCHAR,
          location_city VARCHAR,
          location_state VARCHAR,
          images TEXT[],
          tags TEXT[],
          is_emergency BOOLEAN,
          is_resolved BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE,
          distance_miles DECIMAL,
          author_first_name VARCHAR,
          author_last_name VARCHAR,
          author_profile_image VARCHAR
      ) AS $$
      BEGIN
          IF city_only AND user_city IS NOT NULL THEN
              RETURN QUERY
              SELECT 
                  p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
                  p.location_city, p.location_state, p.images, p.tags,
                  p.is_emergency, p.is_resolved, p.created_at, p.updated_at,
                  CASE 
                      WHEN p.location IS NOT NULL THEN
                          ST_Distance(p.location::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69
                      ELSE 0
                  END as distance_miles,
                  u.first_name, u.last_name, u.profile_image_url
              FROM posts p
              JOIN users u ON p.user_id = u.id
              WHERE p.location_city = user_city 
                AND p.location_state = user_state
                AND (p.expires_at IS NULL OR p.expires_at > NOW())
              ORDER BY 
                  CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
                  CASE p.priority 
                      WHEN 'urgent' THEN 1 
                      WHEN 'high' THEN 2 
                      WHEN 'normal' THEN 3 
                      WHEN 'low' THEN 4 
                  END,
                  p.created_at DESC
              LIMIT post_limit OFFSET post_offset;
          ELSE
              RETURN QUERY
              SELECT 
                  p.id, p.user_id, p.title, p.content, p.post_type, p.priority,
                  p.location_city, p.location_state, p.images, p.tags,
                  p.is_emergency, p.is_resolved, p.created_at, p.updated_at,
                  ST_Distance(p.location::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69 as distance_miles,
                  u.first_name, u.last_name, u.profile_image_url
              FROM posts p
              JOIN users u ON p.user_id = u.id
              WHERE p.location IS NOT NULL
                AND ST_DWithin(
                  p.location::geometry,
                  ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326),
                  radius_miles / 69.0
                )
                AND (p.expires_at IS NULL OR p.expires_at > NOW())
              ORDER BY 
                  CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
                  CASE p.priority 
                      WHEN 'urgent' THEN 1 
                      WHEN 'high' THEN 2 
                      WHEN 'normal' THEN 3 
                      WHEN 'low' THEN 4 
                  END,
                  distance_miles ASC,
                  p.created_at DESC
              LIMIT post_limit OFFSET post_offset;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(nearbyPostsFunction);
      console.log("✅ Created get_nearby_posts function");
    } catch (error) {
      console.log("⚠️  Function creation failed:", error.message);
    }

    console.log(
      "\n📊 Step 9: Creating get_weather_alerts_for_location function..."
    );

    // Create the weather alerts function
    const weatherAlertsFunction = `
      CREATE OR REPLACE FUNCTION get_weather_alerts_for_location(
          user_latitude DECIMAL,
          user_longitude DECIMAL,
          radius_miles DECIMAL DEFAULT 25.0
      )
      RETURNS TABLE (
          id INTEGER,
          alert_id VARCHAR,
          title VARCHAR,
          description TEXT,
          severity VARCHAR,
          alert_type VARCHAR,
          source VARCHAR,
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE,
          distance_miles DECIMAL
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              wa.id, wa.alert_id, wa.title, wa.description, wa.severity,
              wa.alert_type, wa.source, wa.start_time, wa.end_time,
              wa.is_active, wa.created_at,
              CASE 
                  WHEN wa.affected_areas IS NOT NULL THEN
                      ST_Distance(wa.affected_areas::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69
                  ELSE 0
              END as distance_miles
          FROM weather_alerts wa
          WHERE wa.is_active = true
            AND (wa.end_time IS NULL OR wa.end_time > NOW())
            AND (
              wa.affected_areas IS NULL OR
              ST_DWithin(
                wa.affected_areas::geometry,
                ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326),
                radius_miles / 69.0
              )
            )
          ORDER BY 
              CASE wa.severity 
                  WHEN 'CRITICAL' THEN 1 
                  WHEN 'HIGH' THEN 2 
                  WHEN 'MODERATE' THEN 3 
                  WHEN 'LOW' THEN 4 
              END,
              distance_miles ASC,
              wa.created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(weatherAlertsFunction);
      console.log("✅ Created get_weather_alerts_for_location function");
    } catch (error) {
      console.log("⚠️  Function creation failed:", error.message);
    }

    console.log("\n📊 Step 10: Updating existing user data...");

    // Update existing users to use their address_city as location_city
    try {
      const updateUsers = `
        UPDATE users 
        SET location_city = address_city 
        WHERE address_city IS NOT NULL AND location_city IS NULL
      `;
      const result = await client.query(updateUsers);
      console.log(
        `✅ Updated ${result.rowCount} user records with location_city`
      );
    } catch (error) {
      console.log("⚠️  User update failed:", error.message);
    }

    client.release();

    console.log("\n🎉 Location-based migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test creating a post");
    console.log("   2. Check if posts appear in your feed");
    console.log("   3. Update your profile with complete location info");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }

  process.exit(0);
}

runLocationMigration();
