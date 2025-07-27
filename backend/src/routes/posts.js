const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const auth = require("../middleware/auth"); // Adjust path as needed

// Import controller functions
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
} = require("../controllers/posts"); // This should point to your controller file

const createPostValidation = [
  body("title")
    .optional({ nullable: true }) // Allow null/undefined titles
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

// Validation middleware for updating posts
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

// Posts routes
router.get("/", auth, getPosts);
router.get("/:id", auth, getPost);
router.post("/", auth, createPostValidation, createPost);
router.put("/:id", auth, updatePostValidation, updatePost);
router.delete("/:id", auth, deletePost);

// Comments routes
router.get("/:postId/comments", auth, getComments);
router.post("/:postId/comments", auth, createComment);

// Reactions routes
router.post("/:postId/reactions", auth, addReaction);
router.delete("/:postId/reactions", auth, removeReaction);

module.exports = router;
