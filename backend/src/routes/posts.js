// File: backend/src/routes/posts.js
const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const auth = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

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
  reportComment,
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
    .isIn(["help_request", "help_offer", "lost_found", "safety_alert", "general"])
    .withMessage("Invalid post type"),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("isEmergency").optional().isBoolean().withMessage("isEmergency must be a boolean"),
  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
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
  body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
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
    .isIn(["inappropriate", "spam", "harassment", "other"])
    .withMessage("Invalid report reason"),
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
  "/comments/:commentId/report",
  auth,
  [param("commentId").isInt().withMessage("Valid comment ID is required"), ...reportValidation],
  handleValidationErrors,
  reportComment
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
        `
        SELECT id, first_name, location_city FROM users WHERE id = $1
      `,
        [req.user.userId]
      );

      res.json({
        message: "Posts endpoint is working!",
        postCount: result.rows[0].count,
        user: userResult.rows[0] || null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      message: "Test failed",
      error: error.message,
    });
  }
});

module.exports = router;
