const { pool } = require("./src/config/database");

async function createTables() {
  console.log("Creating database tables\n");

  const client = await pool.connect();

  try {
    console.log("Creating neighborhoods table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(10),
        boundary GEOGRAPHY(POLYGON, 4326),
        center_point GEOGRAPHY(POINT, 4326),
        radius_miles DECIMAL(5,2) DEFAULT 1.0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating users table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        location GEOGRAPHY(POINT, 4326),
        address_street VARCHAR(255),
        address_city VARCHAR(100),
        address_state VARCHAR(50),
        address_zip VARCHAR(10),
        neighborhood_id INTEGER REFERENCES neighborhoods(id),
        profile_image_url VARCHAR(500),
        is_verified BOOLEAN DEFAULT FALSE,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        skills TEXT[],
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating weather_alerts table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_alerts (
        id SERIAL PRIMARY KEY,
        alert_id VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        alert_type VARCHAR(100) NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'NOAA',
        affected_areas GEOGRAPHY(MULTIPOLYGON, 4326),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id),
        neighborhood_id INTEGER REFERENCES neighborhoods(id),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating posts table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
        title VARCHAR(255),
        content TEXT NOT NULL,
        post_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        location GEOGRAPHY(POINT, 4326),
        images TEXT[],
        tags TEXT[],
        is_emergency BOOLEAN DEFAULT FALSE,
        is_resolved BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating comments table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id INTEGER REFERENCES comments(id),
        images TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating reactions table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        reaction_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_post_reaction UNIQUE(user_id, post_id),
        CONSTRAINT unique_user_comment_reaction UNIQUE(user_id, comment_id),
        CONSTRAINT reaction_target_check CHECK ((post_id IS NOT NULL) != (comment_id IS NOT NULL))
      );
    `);

    console.log(" Creating emergency_resources table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_resources (
        id SERIAL PRIMARY KEY,
        neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
        resource_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        contact_name VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        address TEXT,
        location GEOGRAPHY(POINT, 4326),
        is_available BOOLEAN DEFAULT TRUE,
        capacity INTEGER,
        hours_available VARCHAR(100),
        requirements TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating notifications table");
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        related_id INTEGER,
        related_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating indexes for performance");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_boundary ON neighborhoods USING GIST (boundary);
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_center ON neighborhoods USING GIST (center_point);
      CREATE INDEX IF NOT EXISTS idx_weather_alerts_areas ON weather_alerts USING GIST (affected_areas);
      CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_posts_neighborhood ON posts(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_emergency_resources_location ON emergency_resources USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
    `);

    console.log("🗺️ Testing with sample data...");

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

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
      ORDER BY table_name;
    `);

    console.log("\n Successfully created tables:");
    tablesResult.rows.forEach((row) => {
      console.log(`   📋 ${row.table_name}`);
    });
  } catch (error) {
    console.error(" Error creating tables:", error.message);
    console.error("   Full error:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createTables();
