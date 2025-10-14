const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

router.get(
  "/:userId",
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;

      const result = await client.query(
        `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          u.bio,
          u.location_city as city,
          u.address_state as state,
          u.phone,
          u.email,
          u.location_radius_miles,
          u.show_city_only,
          u.latitude,
          u.longitude,
          u.email_verified,
          u.created_at,
          u.updated_at,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = true) as post_count,
          (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND is_active = true) as comment_count
        FROM users u
        WHERE u.id = $1 AND u.is_active = true
      `,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Get user profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user profile",
        code: "PROFILE_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/",
  [
    query("search")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Search term must be 2-50 characters"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          u.location_city as city,
          u.address_state as state,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = true) as post_count
        FROM users u
        WHERE u.is_active = true
      `;

      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramCount} OR u.location_city ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      let countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.is_active = true
      `;

      const countParams = [];

      if (search) {
        countQuery +=
          " AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.location_city ILIKE $1)";
        countParams.push(`%${search}%`);
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Search users error:", error);
      res.status(500).json({
        success: false,
        message: "Error searching users",
        code: "USER_SEARCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:userId/posts",
  [
    param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const userCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const result = await client.query(
        `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = true) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) as total FROM posts WHERE user_id = $1 AND is_active = true",
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          posts: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Get user posts error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user posts",
        code: "USER_POSTS_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:userId/follow",
  auth,
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const followerId = req.user.userId;

      if (parseInt(userId) === followerId) {
        return res.status(400).json({
          success: false,
          message: "Cannot follow yourself",
          code: "SELF_FOLLOW_ERROR",
        });
      }

      const userCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const existingFollow = await client.query(
        "SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2",
        [followerId, userId]
      );

      if (existingFollow.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You are already following this user",
          code: "ALREADY_FOLLOWING",
        });
      }

      await client.query("INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)", [
        followerId,
        userId,
      ]);

      const followerInfo = await client.query(
        "SELECT first_name, last_name FROM users WHERE id = $1",
        [followerId]
      );

      const followerName = `${followerInfo.rows[0].first_name} ${followerInfo.rows[0].last_name}`;

      try {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            parseInt(userId),
            "New Follower",
            `${followerName} started following you`,
            "new_follower",
            followerId,
          ]
        );
      } catch (notificationError) {
        logger.warn("Failed to create follow notification:", notificationError);
      }

      res.json({
        success: true,
        message: "Successfully followed user",
        data: {
          user_id: parseInt(userId),
          follower_id: followerId,
          follower_name: followerName,
          followed_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Follow user error:", error);
      res.status(500).json({
        success: false,
        message: "Error following user",
        code: "FOLLOW_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/preferences/notifications", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;

    const prefsResult = await client.query(
      `SELECT notification_type, enabled, push_enabled, email_enabled, frequency
         FROM notification_preferences 
         WHERE user_id = $1
         ORDER BY notification_type`,
      [userId]
    );

    const defaultPreferences = {
      emergency_alerts: {
        enabled: true,
        push_enabled: true,
        email_enabled: true,
        frequency: "immediate",
      },
      weather_alerts: {
        enabled: true,
        push_enabled: true,
        email_enabled: true,
        frequency: "immediate",
      },
      new_messages: {
        enabled: true,
        push_enabled: true,
        email_enabled: false,
        frequency: "immediate",
      },
      post_comments: {
        enabled: true,
        push_enabled: true,
        email_enabled: false,
        frequency: "immediate",
      },
      reactions: {
        enabled: false,
        push_enabled: false,
        email_enabled: false,
        frequency: "immediate",
      },
      neighborhood_posts: {
        enabled: true,
        push_enabled: true,
        email_enabled: false,
        frequency: "immediate",
      },
      community_updates: {
        enabled: true,
        push_enabled: false,
        email_enabled: true,
        frequency: "daily",
      },
      admin_announcements: {
        enabled: true,
        push_enabled: true,
        email_enabled: true,
        frequency: "immediate",
      },
    };

    const preferences = { ...defaultPreferences };
    prefsResult.rows.forEach((pref) => {
      preferences[pref.notification_type] = {
        enabled: pref.enabled,
        push_enabled: pref.push_enabled,
        email_enabled: pref.email_enabled,
        frequency: pref.frequency,
      };
    });

    res.json({
      success: true,
      message: "Notification preferences retrieved successfully",
      data: {
        preferences,
        user_id: userId,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Get notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification preferences",
      code: "PREFERENCES_FETCH_ERROR",
    });
  } finally {
    client.release();
  }
});

router.put(
  "/preferences/notifications",
  auth,
  [
    body("preferences").isObject().withMessage("Preferences must be an object"),
    body("preferences.*.enabled").optional().isBoolean().withMessage("Enabled must be a boolean"),
    body("preferences.*.push_enabled")
      .optional()
      .isBoolean()
      .withMessage("Push enabled must be a boolean"),
    body("preferences.*.email_enabled")
      .optional()
      .isBoolean()
      .withMessage("Email enabled must be a boolean"),
    body("preferences.*.frequency")
      .optional()
      .isIn(["immediate", "hourly", "daily", "weekly"])
      .withMessage("Frequency must be immediate, hourly, daily, or weekly"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { preferences } = req.body;

      const validTypes = [
        "emergency_alerts",
        "weather_alerts",
        "new_messages",
        "post_comments",
        "reactions",
        "neighborhood_posts",
        "community_updates",
        "admin_announcements",
      ];

      const invalidTypes = Object.keys(preferences).filter((type) => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid notification types: ${invalidTypes.join(", ")}`,
          code: "INVALID_NOTIFICATION_TYPES",
        });
      }

      await client.query("BEGIN");

      for (const [notificationType, settings] of Object.entries(preferences)) {
        const {
          enabled = true,
          push_enabled = true,
          email_enabled = false,
          frequency = "immediate",
        } = settings;

        await client.query(
          `INSERT INTO notification_preferences 
           (user_id, notification_type, enabled, push_enabled, email_enabled, frequency)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, notification_type)
           DO UPDATE SET
             enabled = $3,
             push_enabled = $4,
             email_enabled = $5,
             frequency = $6,
             updated_at = NOW()`,
          [userId, notificationType, enabled, push_enabled, email_enabled, frequency]
        );
      }

      await client.query("COMMIT");

      const updatedPrefs = await client.query(
        `SELECT notification_type, enabled, push_enabled, email_enabled, frequency
         FROM notification_preferences 
         WHERE user_id = $1
         ORDER BY notification_type`,
        [userId]
      );

      const preferencesMap = {};
      updatedPrefs.rows.forEach((pref) => {
        preferencesMap[pref.notification_type] = {
          enabled: pref.enabled,
          push_enabled: pref.push_enabled,
          email_enabled: pref.email_enabled,
          frequency: pref.frequency,
        };
      });

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
        data: {
          preferences: preferencesMap,
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Update notification preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating notification preferences",
        code: "PREFERENCES_UPDATE_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:userId/follow",
  auth,
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const followerId = req.user.userId;

      if (parseInt(userId) === followerId) {
        return res.status(400).json({
          success: false,
          message: "Cannot unfollow yourself",
          code: "SELF_UNFOLLOW_ERROR",
        });
      }

      const existingFollow = await client.query(
        "SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2",
        [followerId, userId]
      );

      if (existingFollow.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "You are not following this user",
          code: "NOT_FOLLOWING",
        });
      }

      await client.query("DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2", [
        followerId,
        userId,
      ]);

      res.json({
        success: true,
        message: "Successfully unfollowed user",
        data: {
          user_id: parseInt(userId),
          follower_id: followerId,
          unfollowed_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Unfollow user error:", error);
      res.status(500).json({
        success: false,
        message: "Error unfollowing user",
        code: "UNFOLLOW_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:userId/followers",
  [
    param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const userCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const followers = await client.query(
        `SELECT 
           u.id, u.first_name, u.last_name, u.profile_image_url,
           uf.created_at as followed_at
         FROM user_follows uf
         JOIN users u ON uf.follower_id = u.id
         WHERE uf.following_id = $1 AND u.is_active = true
         ORDER BY uf.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) as total
         FROM user_follows uf
         JOIN users u ON uf.follower_id = u.id
         WHERE uf.following_id = $1 AND u.is_active = true`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          followers: followers.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Get followers error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching followers",
        code: "FOLLOWERS_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:userId/following",
  [
    param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const userCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const following = await client.query(
        `SELECT 
           u.id, u.first_name, u.last_name, u.profile_image_url,
           uf.created_at as followed_at
         FROM user_follows uf
         JOIN users u ON uf.following_id = u.id
         WHERE uf.follower_id = $1 AND u.is_active = true
         ORDER BY uf.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) as total
         FROM user_follows uf
         JOIN users u ON uf.following_id = u.id
         WHERE uf.follower_id = $1 AND u.is_active = true`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          following: following.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Get following error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching following",
        code: "FOLLOWING_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/available", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUserId = req.user.userId;
    const { page = 1, limit = 20, query } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.profile_image_url,
        u.location_city as city,
        u.address_state as state,
        u.bio
      FROM users u
      WHERE u.is_active = true
        AND u.id != $1
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
    `;

    const params = [currentUserId];
    let paramCount = 1;

    if (query) {
      paramCount++;
      queryStr += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramCount} OR u.location_city ILIKE $${paramCount})`;
      params.push(`%${query}%`);
    }

    queryStr += ` ORDER BY u.first_name, u.last_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await client.query(queryStr, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.is_active = true
        AND u.id != $1
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
    `;

    const countParams = [currentUserId];

    if (query) {
      countQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $2 OR u.location_city ILIKE $2)`;
      countParams.push(`%${query}%`);
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get available users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available users",
      code: "AVAILABLE_USERS_ERROR",
    });
  } finally {
    client.release();
  }
});

router.get("/test/status", async (_req, res) => {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT COUNT(*) as user_count FROM users WHERE is_active = true"
      );

      res.json({
        success: true,
        message: "Users routes are working!",
        data: {
          active_users: result.rows[0].user_count,
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Users test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Users routes test failed",
      error: error.message,
    });
  }
});

router.post(
  "/:userId/block",
  auth,
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const blockerId = req.user.userId;

      if (parseInt(userId) === blockerId) {
        return res.status(400).json({
          success: false,
          message: "Cannot block yourself",
          code: "INVALID_OPERATION",
        });
      }

      const userCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const existingBlock = await client.query(
        "SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2",
        [blockerId, userId]
      );

      if (existingBlock.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "User is already blocked",
          code: "ALREADY_BLOCKED",
        });
      }

      await client.query("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)", [
        blockerId,
        userId,
      ]);

      await client.query(
        "DELETE FROM user_follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)",
        [blockerId, userId]
      );

      res.status(200).json({
        success: true,
        message: "User blocked successfully",
        data: {
          blocker_id: blockerId,
          blocked_id: parseInt(userId),
          blocked_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Block user error:", error);
      res.status(500).json({
        success: false,
        message: "Error blocking user",
        code: "INTERNAL_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:userId/block",
  auth,
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const blockerId = req.user.userId;

      const existingBlock = await client.query(
        "SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2",
        [blockerId, userId]
      );

      if (existingBlock.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "User is not blocked",
          code: "NOT_BLOCKED",
        });
      }

      await client.query("DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2", [
        blockerId,
        userId,
      ]);

      res.status(200).json({
        success: true,
        message: "User unblocked successfully",
        data: {
          blocker_id: blockerId,
          unblocked_id: parseInt(userId),
          unblocked_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Unblock user error:", error);
      res.status(500).json({
        success: false,
        message: "Error unblocking user",
        code: "INTERNAL_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/blocked", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const blockedUsers = await client.query(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.profile_image_url,
         u.bio,
         u.email,
         ub.created_at as blocked_at
       FROM user_blocks ub
       JOIN users u ON ub.blocked_id = u.id
       WHERE ub.blocker_id = $1 AND u.is_active = true
       ORDER BY ub.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalCount = await client.query(
      `SELECT COUNT(*) as count
       FROM user_blocks ub
       JOIN users u ON ub.blocked_id = u.id
       WHERE ub.blocker_id = $1 AND u.is_active = true`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        blockedUsers: blockedUsers.rows,
        pagination: {
          page,
          limit,
          total: parseInt(totalCount.rows[0].count),
          hasMore: offset + limit < parseInt(totalCount.rows[0].count),
        },
      },
    });
  } catch (error) {
    logger.error("Get blocked users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blocked users",
      code: "INTERNAL_ERROR",
    });
  } finally {
    client.release();
  }
});

router.get(
  "/:userId/posts",
  auth,
  [param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = (page - 1) * limit;

      const posts = await client.query(
        `SELECT 
           p.id,
           p.title,
           p.content,
           p.post_type,
           p.priority,
           p.is_emergency,
           p.tags,
           p.created_at,
           p.updated_at,
           u.first_name,
           u.last_name,
           u.profile_image_url,
           (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'like') as like_count,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = true) as comment_count,
           (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $2) as user_reaction
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1 AND u.is_active = true
         ORDER BY p.created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, req.user.userId, limit, offset]
      );

      const totalCount = await client.query(
        `SELECT COUNT(*) as count
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1 AND u.is_active = true`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          posts: posts.rows,
          pagination: {
            page,
            limit,
            total: parseInt(totalCount.rows[0].count),
            hasMore: offset + limit < parseInt(totalCount.rows[0].count),
          },
        },
      });
    } catch (error) {
      logger.error("Get user posts error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user posts",
        code: "INTERNAL_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
