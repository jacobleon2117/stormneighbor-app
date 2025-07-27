const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixFunction() {
  console.log("🔧 Dropping and recreating function...");

  const client = await pool.connect();

  try {
    await client.query(`
      DROP FUNCTION IF EXISTS get_nearby_posts(numeric,numeric,character varying,character varying,numeric,boolean,integer,integer);
    `);
    console.log("✅ Dropped old function");

    await client.query(`
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
        distance_miles DOUBLE PRECISION,
        author_first_name VARCHAR,
        author_last_name VARCHAR,
        author_profile_image VARCHAR
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, extensions
      AS $$
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
              ELSE 0::double precision
            END as distance_miles,
            u.first_name, u.last_name, u.profile_image_url
          FROM public.posts p
          JOIN public.users u ON p.user_id = u.id
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
            COALESCE(ST_Distance(p.location::geometry, ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)) * 69, 0::double precision) as distance_miles,
            u.first_name, u.last_name, u.profile_image_url
          FROM public.posts p
          JOIN public.users u ON p.user_id = u.id
          WHERE (p.expires_at IS NULL OR p.expires_at > NOW())
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
        END IF;
      END;
      $$;
    `);

    console.log("✅ Function fixed!");
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixFunction().catch(console.error);
}
