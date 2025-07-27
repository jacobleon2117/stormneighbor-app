const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const auth = require("../middleware/auth");

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  addReaction,
  removeReaction,
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
    ])
    .withMessage("Invalid post type"),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("isEmergency")
    .optional()
    .isBoolean()
    .withMessage("isEmergency must be a boolean"),
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
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
  body("isResolved")
    .optional()
    .isBoolean()
    .withMessage("isResolved must be a boolean"),
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

router.get("/", auth, getPosts);
router.get("/:id", auth, getPost);
router.post("/", auth, createPostValidation, createPost);
router.put("/:id", auth, updatePostValidation, updatePost);
router.delete("/:id", auth, deletePost);

router.get("/:postId/comments", auth, getComments);
router.post("/:postId/comments", auth, createComment);

router.post("/:postId/reactions", auth, addReaction);
router.delete("/:postId/reactions", auth, removeReaction);

router.get("/test", auth, async (req, res) => {
  try {
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
