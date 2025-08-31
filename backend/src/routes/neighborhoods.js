const express = require("express");
const router = express.Router();
const { param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");

router.get(
  "/nearby",
  auth,
  [
    query("latitude")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    query("longitude")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    query("radius")
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage("Radius must be between 0.1 and 100 miles"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { latitude, longitude, radius = 10, limit = 20 } = req.query;
      const userId = req.user.userId;

      let userLat = latitude;
      let userLng = longitude;

      if (!userLat || !userLng) {
        const userLocation = await client.query(
          "SELECT latitude, longitude FROM users WHERE id = $1",
          [userId]
        );

        if (userLocation.rows.length > 0) {
          userLat = userLocation.rows[0].latitude;
          userLng = userLocation.rows[0].longitude;
        }
      }

      if (!userLat || !userLng) {
        return res.status(400).json({
          success: false,
          message: "Location coordinates required",
          code: "LOCATION_REQUIRED",
        });
      }

      const result = await client.query(
        `
        SELECT DISTINCT
          location_city as name,
          location_state as state,
          COUNT(*) as post_count,
          COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_posts,
          AVG(latitude) as avg_latitude,
          AVG(longitude) as avg_longitude,
          MIN(
            CASE 
              WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN
                SQRT(
                  POW((latitude - $1) * 69.0, 2) + 
                  POW((longitude - $2) * 53.0, 2)
                )
              ELSE 999999
            END
          ) as distance_miles
        FROM posts p
        WHERE location_city IS NOT NULL 
          AND location_state IS NOT NULL
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND SQRT(
            POW((latitude - $1) * 69.0, 2) + 
            POW((longitude - $2) * 53.0, 2)
          ) <= $3
        GROUP BY location_city, location_state
        HAVING COUNT(*) > 0
        ORDER BY distance_miles ASC, post_count DESC
        LIMIT $4
      `,
        [userLat, userLng, radius, limit]
      );

      const neighborhoods = result.rows.map((row) => ({
        name: row.name,
        state: row.state,
        postCount: parseInt(row.post_count),
        emergencyCount: parseInt(row.emergency_count),
        recentPosts: parseInt(row.recent_posts),
        location: {
          latitude: parseFloat(row.avg_latitude),
          longitude: parseFloat(row.avg_longitude),
        },
        distanceMiles: parseFloat(row.distance_miles),
      }));

      res.json({
        success: true,
        data: {
          neighborhoods,
          searchLocation: {
            latitude: parseFloat(userLat),
            longitude: parseFloat(userLng),
            radius: parseFloat(radius),
          },
          totalFound: neighborhoods.length,
        },
      });
    } catch (error) {
      logger.error("Get nearby neighborhoods error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching nearby neighborhoods",
        code: "NEIGHBORHOODS_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:city/:state",
  auth,
  [
    param("city").trim().isLength({ min: 1, max: 100 }).withMessage("Valid city name required"),
    param("state").trim().isLength({ min: 2, max: 50 }).withMessage("Valid state name required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { city, state } = req.params;

      const stats = await client.query(
        `
        SELECT 
          COUNT(*) as total_posts,
          COUNT(*) FILTER (WHERE is_emergency = true) as emergency_posts,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as posts_24h,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as posts_7d,
          COUNT(DISTINCT user_id) as active_users,
          AVG(latitude) as avg_latitude,
          AVG(longitude) as avg_longitude,
          MIN(created_at) as oldest_post,
          MAX(created_at) as newest_post
        FROM posts 
        WHERE location_city ILIKE $1 AND location_state ILIKE $2
      `,
        [city, state]
      );

      if (stats.rows[0].total_posts === "0") {
        return res.status(404).json({
          success: false,
          message: "Neighborhood not found",
          code: "NEIGHBORHOOD_NOT_FOUND",
        });
      }

      const recentPosts = await client.query(
        `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority, p.is_emergency,
          p.created_at, p.latitude, p.longitude,
          u.first_name, u.last_name, u.profile_image_url,
          COUNT(r.id) as reaction_count,
          COUNT(c.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN reactions r ON p.id = r.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE p.location_city ILIKE $1 AND p.location_state ILIKE $2
        GROUP BY p.id, u.id
        ORDER BY p.created_at DESC
        LIMIT 10
      `,
        [city, state]
      );

      const activeUsers = await client.query(
        `
        SELECT 
          u.id, u.first_name, u.last_name, u.profile_image_url,
          COUNT(p.id) as post_count
        FROM users u
        JOIN posts p ON u.id = p.user_id
        WHERE p.location_city ILIKE $1 AND p.location_state ILIKE $2
        GROUP BY u.id
        ORDER BY post_count DESC
        LIMIT 5
      `,
        [city, state]
      );

      const neighborhood = {
        name: city,
        state: state,
        statistics: {
          totalPosts: parseInt(stats.rows[0].total_posts),
          emergencyPosts: parseInt(stats.rows[0].emergency_posts),
          posts24h: parseInt(stats.rows[0].posts_24h),
          posts7d: parseInt(stats.rows[0].posts_7d),
          activeUsers: parseInt(stats.rows[0].active_users),
          oldestPost: stats.rows[0].oldest_post,
          newestPost: stats.rows[0].newest_post,
        },
        location: {
          latitude: parseFloat(stats.rows[0].avg_latitude),
          longitude: parseFloat(stats.rows[0].avg_longitude),
        },
        recentPosts: recentPosts.rows.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? "..." : ""),
          postType: post.post_type,
          priority: post.priority,
          isEmergency: post.is_emergency,
          createdAt: post.created_at,
          location: {
            latitude: post.latitude,
            longitude: post.longitude,
          },
          author: {
            id: post.user_id,
            firstName: post.first_name,
            lastName: post.last_name,
            profileImageUrl: post.profile_image_url,
          },
          reactionCount: parseInt(post.reaction_count),
          commentCount: parseInt(post.comment_count),
        })),
        activeUsers: activeUsers.rows.map((user) => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          postCount: parseInt(user.post_count),
        })),
      };

      res.json({
        success: true,
        data: { neighborhood },
      });
    } catch (error) {
      logger.error("Get neighborhood details error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching neighborhood details",
        code: "NEIGHBORHOOD_DETAILS_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/",
  auth,
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("timeframe")
      .optional()
      .isIn(["24h", "7d", "30d", "all"])
      .withMessage("Invalid timeframe"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { limit = 20, timeframe = "7d" } = req.query;

      let timeFilter = "";
      switch (timeframe) {
        case "24h":
          timeFilter = "AND p.created_at > NOW() - INTERVAL '24 hours'";
          break;
        case "7d":
          timeFilter = "AND p.created_at > NOW() - INTERVAL '7 days'";
          break;
        case "30d":
          timeFilter = "AND p.created_at > NOW() - INTERVAL '30 days'";
          break;
        case "all":
        default:
          timeFilter = "";
          break;
      }

      const result = await client.query(
        `
        SELECT 
          location_city as name,
          location_state as state,
          COUNT(*) as post_count,
          COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count,
          COUNT(DISTINCT user_id) as active_users,
          AVG(latitude) as avg_latitude,
          AVG(longitude) as avg_longitude,
          MAX(created_at) as last_activity
        FROM posts p
        WHERE location_city IS NOT NULL 
          AND location_state IS NOT NULL
          ${timeFilter}
        GROUP BY location_city, location_state
        HAVING COUNT(*) > 0
        ORDER BY post_count DESC, active_users DESC
        LIMIT $1
      `,
        [limit]
      );

      const neighborhoods = result.rows.map((row) => ({
        name: row.name,
        state: row.state,
        postCount: parseInt(row.post_count),
        emergencyCount: parseInt(row.emergency_count),
        activeUsers: parseInt(row.active_users),
        location: {
          latitude: parseFloat(row.avg_latitude),
          longitude: parseFloat(row.avg_longitude),
        },
        lastActivity: row.last_activity,
      }));

      res.json({
        success: true,
        data: {
          neighborhoods,
          timeframe,
          totalFound: neighborhoods.length,
        },
      });
    } catch (error) {
      logger.error("Get popular neighborhoods error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching popular neighborhoods",
        code: "POPULAR_NEIGHBORHOODS_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/search/:query",
  auth,
  [
    param("query")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Search query must be 2-100 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { query: searchQuery } = req.params;
      const { limit = 20 } = req.query;

      const result = await client.query(
        `
        SELECT 
          location_city as name,
          location_state as state,
          COUNT(*) as post_count,
          COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count,
          COUNT(DISTINCT user_id) as active_users,
          AVG(latitude) as avg_latitude,
          AVG(longitude) as avg_longitude,
          MAX(created_at) as last_activity
        FROM posts
        WHERE (location_city ILIKE $1 OR location_state ILIKE $1)
          AND location_city IS NOT NULL 
          AND location_state IS NOT NULL
        GROUP BY location_city, location_state
        HAVING COUNT(*) > 0
        ORDER BY 
          CASE 
            WHEN location_city ILIKE $2 THEN 1
            WHEN location_city ILIKE $1 THEN 2
            WHEN location_state ILIKE $1 THEN 3
            ELSE 4
          END,
          post_count DESC
        LIMIT $3
      `,
        [`%${searchQuery}%`, `${searchQuery}%`, limit]
      );

      const neighborhoods = result.rows.map((row) => ({
        name: row.name,
        state: row.state,
        postCount: parseInt(row.post_count),
        emergencyCount: parseInt(row.emergency_count),
        activeUsers: parseInt(row.active_users),
        location: {
          latitude: parseFloat(row.avg_latitude),
          longitude: parseFloat(row.avg_longitude),
        },
        lastActivity: row.last_activity,
      }));

      res.json({
        success: true,
        data: {
          neighborhoods,
          searchQuery,
          totalFound: neighborhoods.length,
        },
      });
    } catch (error) {
      logger.error("Search neighborhoods error:", error);
      res.status(500).json({
        success: false,
        message: "Error searching neighborhoods",
        code: "NEIGHBORHOODS_SEARCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/my/current", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;

    const userLocation = await client.query(
      `
        SELECT latitude, longitude, location_city, address_state 
        FROM users 
        WHERE id = $1
      `,
      [userId]
    );

    if (userLocation.rows.length === 0 || !userLocation.rows[0].latitude) {
      return res.status(404).json({
        success: false,
        message: "User location not set",
        code: "USER_LOCATION_NOT_SET",
      });
    }

    const user = userLocation.rows[0];

    const stats = await client.query(
      `
        SELECT 
          COUNT(*) as total_posts,
          COUNT(*) FILTER (WHERE is_emergency = true) as emergency_posts,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as posts_24h,
          COUNT(DISTINCT user_id) as active_users
        FROM posts 
        WHERE location_city ILIKE $1 
          AND location_state ILIKE $2
      `,
      [user.location_city || "", user.address_state || ""]
    );

    const neighborhood = {
      name: user.location_city,
      state: user.address_state,
      location: {
        latitude: parseFloat(user.latitude),
        longitude: parseFloat(user.longitude),
      },
      statistics: {
        totalPosts: parseInt(stats.rows[0].total_posts),
        emergencyPosts: parseInt(stats.rows[0].emergency_posts),
        posts24h: parseInt(stats.rows[0].posts_24h),
        activeUsers: parseInt(stats.rows[0].active_users),
      },
      isUserNeighborhood: true,
    };

    res.json({
      success: true,
      data: { neighborhood },
    });
  } catch (error) {
    logger.error("Get user neighborhood error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user neighborhood",
      code: "USER_NEIGHBORHOOD_ERROR",
    });
  } finally {
    client.release();
  }
});

router.get("/test/status", async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const logger = require("../utils/logger");
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT location_city) as unique_cities,
          COUNT(DISTINCT location_state) as unique_states,
          COUNT(*) as total_posts_with_location
        FROM posts 
        WHERE location_city IS NOT NULL AND location_state IS NOT NULL
      `);

      res.json({
        success: true,
        message: "Neighborhoods routes are working!",
        data: {
          ...result.rows[0],
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Neighborhoods test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Neighborhoods routes test failed",
      error: error.message,
    });
  }
});

module.exports = router;
