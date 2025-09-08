const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const logger = require("../utils/logger");

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  addCommentReaction,
  removeCommentReaction,
} = require("../controllers/posts");

const createPostValidation = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title must be under 200 characters"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content is required and must be under 5000 characters"),
  body("postType")
    .isIn([
      "help_request",
      "help_offer",
      "lost_found",
      "safety_alert",
      "general",
      "question",
      "event",
      "announcement",
      "weather_alert",
    ])
    .withMessage("Invalid post type"),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("isEmergency").optional().isBoolean().withMessage("isEmergency must be a boolean"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

const updatePostValidation = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title must be under 200 characters"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content must be under 5000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("isResolved").optional().isBoolean().withMessage("isResolved must be a boolean"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

const createCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment content is required and must be under 500 characters"),
  body("parentCommentId")
    .optional()
    .isInt()
    .withMessage("Parent comment ID must be a valid integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
];

const updateCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment content is required and must be under 500 characters"),
];

const reactionValidation = [
  body("reactionType")
    .isIn(["like", "love", "helpful", "concerned", "angry"])
    .withMessage("Invalid reaction type"),
];

const reportValidation = [
  body("reason")
    .isIn(["spam", "harassment", "inappropriate", "misinformation", "other"])
    .withMessage("Invalid report reason"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be under 500 characters"),
];

router.get("/", auth, getPosts);

router.get(
  "/:id",
  auth,
  [param("id").isInt().withMessage("Valid post ID is required")],
  handleValidationErrors,
  getPost
);

router.post("/", auth, createPostValidation, handleValidationErrors, createPost);

router.put(
  "/:id",
  auth,
  [param("id").isInt().withMessage("Valid post ID is required")],
  updatePostValidation,
  handleValidationErrors,
  updatePost
);

router.delete(
  "/:id",
  auth,
  [param("id").isInt().withMessage("Valid post ID is required")],
  handleValidationErrors,
  deletePost
);

router.get(
  "/:postId/comments",
  auth,
  [param("postId").isInt().withMessage("Valid post ID is required")],
  handleValidationErrors,
  getComments
);

router.post(
  "/:postId/comments",
  auth,
  [param("postId").isInt().withMessage("Valid post ID is required"), ...createCommentValidation],
  handleValidationErrors,
  createComment
);

router.put(
  "/:postId/comments/:commentId",
  auth,
  [
    param("postId").isInt().withMessage("Valid post ID is required"),
    param("commentId").isInt().withMessage("Valid comment ID is required"),
    ...updateCommentValidation,
  ],
  handleValidationErrors,
  updateComment
);

router.delete(
  "/:postId/comments/:commentId",
  auth,
  [
    param("postId").isInt().withMessage("Valid post ID is required"),
    param("commentId").isInt().withMessage("Valid comment ID is required"),
  ],
  handleValidationErrors,
  deleteComment
);

router.post(
  "/:postId/reactions",
  auth,
  [param("postId").isInt().withMessage("Valid post ID is required"), ...reactionValidation],
  handleValidationErrors,
  addReaction
);

router.delete(
  "/:postId/reactions",
  auth,
  [param("postId").isInt().withMessage("Valid post ID is required")],
  handleValidationErrors,
  removeReaction
);

router.post(
  "/comments/:commentId/reactions",
  auth,
  [param("commentId").isInt().withMessage("Valid comment ID is required"), ...reactionValidation],
  handleValidationErrors,
  addCommentReaction
);

router.delete(
  "/comments/:commentId/reactions",
  auth,
  [param("commentId").isInt().withMessage("Valid comment ID is required")],
  handleValidationErrors,
  removeCommentReaction
);

router.post(
  "/:id/report",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Valid post ID is required"), ...reportValidation],
  handleValidationErrors,
  async (req, res) => {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const { id: postId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user.userId;

      const postCheck = await client.query("SELECT id, user_id FROM posts WHERE id = $1", [postId]);

      if (postCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
          code: "POST_NOT_FOUND",
        });
      }

      const post = postCheck.rows[0];

      if (post.user_id === userId) {
        return res.status(400).json({
          success: false,
          message: "Cannot report your own post",
          code: "SELF_REPORT_ERROR",
        });
      }

      const existingReport = await client.query(
        "SELECT id FROM post_reports WHERE post_id = $1 AND reported_by = $2",
        [postId, userId]
      );

      if (existingReport.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already reported this post",
          code: "ALREADY_REPORTED",
        });
      }

      const reportResult = await client.query(
        "INSERT INTO post_reports (post_id, reported_by, report_reason, report_description) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
        [postId, userId, reason, description || null]
      );

      res.status(201).json({
        success: true,
        message: "Post reported successfully",
        data: {
          reportId: reportResult.rows[0].id,
          postId: parseInt(postId),
          reason,
          description: description || null,
          createdAt: reportResult.rows[0].created_at,
        },
      });
    } catch (error) {
      logger.error("Post report error:", error);
      res.status(500).json({
        success: false,
        message: "Server error reporting post",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      client.release();
    }
  }
);

router.get("/test", auth, async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM posts
      `);

      const userResult = await client.query(
        "SELECT id, first_name, location_city FROM users WHERE id = $1",
        [req.user.userId]
      );

      res.json({
        success: true,
        message: "Posts endpoint is working!",
        data: {
          postCount: result.rows[0].count,
          user: userResult.rows[0] || null,
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
});

router.post(
  "/:postId/save",
  auth,
  [param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const { postId } = req.params;
      const userId = req.user.userId;

      const postCheck = await client.query(
        "SELECT id FROM posts WHERE id = $1 AND is_active = true",
        [postId]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
          code: "POST_NOT_FOUND",
        });
      }

      const existingSave = await client.query(
        "SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      if (existingSave.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Post is already saved",
          code: "ALREADY_SAVED",
        });
      }

      await client.query("INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)", [
        userId,
        postId,
      ]);

      res.status(200).json({
        success: true,
        message: "Post saved successfully",
        data: {
          user_id: userId,
          post_id: parseInt(postId),
          saved_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Save post error:", error);
      res.status(500).json({
        success: false,
        message: "Error saving post",
        code: "INTERNAL_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:postId/save",
  auth,
  [param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const { postId } = req.params;
      const userId = req.user.userId;

      const existingSave = await client.query(
        "SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      if (existingSave.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Post is not saved",
          code: "NOT_SAVED",
        });
      }

      await client.query("DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2", [
        userId,
        postId,
      ]);

      res.status(200).json({
        success: true,
        message: "Post unsaved successfully",
        data: {
          user_id: userId,
          post_id: parseInt(postId),
          unsaved_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Unsave post error:", error);
      res.status(500).json({
        success: false,
        message: "Error unsaving post",
        code: "INTERNAL_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/saved", auth, async (req, res) => {
  const { pool } = require("../config/database");
  const client = await pool.connect();

  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const savedPosts = await client.query(
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
         sp.created_at as saved_at,
         (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'like') as like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = true) as comment_count,
         (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = $1) as user_reaction
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = $1 AND p.is_active = true AND u.is_active = true
       ORDER BY sp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalCount = await client.query(
      `SELECT COUNT(*) as count
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = $1 AND p.is_active = true AND u.is_active = true`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        posts: savedPosts.rows,
        pagination: {
          page,
          limit,
          total: parseInt(totalCount.rows[0].count),
          hasMore: offset + limit < parseInt(totalCount.rows[0].count),
        },
      },
    });
  } catch (error) {
    logger.error("Get saved posts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved posts",
      code: "INTERNAL_ERROR",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
