// File: backend/src/routes/users.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");

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
          up.bio,
          up.city,
          up.state,
          u.created_at,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = true) as post_count,
          (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND is_active = true) as comment_count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
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
      console.error("Get user profile error:", error);
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
          up.city,
          up.state,
          (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = true) as post_count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.is_active = true
      `;

      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramCount} OR up.city ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      let countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.is_active = true
      `;

      const countParams = [];

      if (search) {
        countQuery += " AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR up.city ILIKE $1)";
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
      console.error("Search users error:", error);
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
        WHERE p.user_id = $1 AND p.is_active = true
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
      console.error("Get user posts error:", error);
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

      // For now, i'll have to just return success - i'll implement following system later
      res.json({
        success: true,
        message: "Following feature coming soon",
        data: {
          user_id: parseInt(userId),
          follower_id: followerId,
          status: "pending_implementation",
        },
      });
    } catch (error) {
      console.error("Follow user error:", error);
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

router.get("/test/status", async (req, res) => {
  try {
    const { pool } = require("../config/database");
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
    console.error("Users test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Users routes test failed",
      error: error.message,
    });
  }
});

module.exports = router;
