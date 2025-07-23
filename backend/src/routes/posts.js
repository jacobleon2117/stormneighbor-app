const express = require("express");
const { body, query, param } = require("express-validator");
const postController = require("../controllers/postController");
const auth = require("../middleware/auth");

const router = express.Router();

const createPostValidation = [
  body("neighborhoodId")
    .isInt({ min: 1 })
    .withMessage("Valid neighborhood ID is required"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content is required and must be less than 5000 characters"),
  body("postType")
    .isIn([
      "safety_alert",
      "help_request",
      "help_offer",
      "general",
      "weather_update",
    ])
    .withMessage("Invalid post type"),
  body("priority")
    .optional()
    .isIn(["urgent", "high", "normal", "low"])
    .withMessage("Invalid priority level"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Title must be less than 255 characters"),
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
  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiration date format"),
];

const updatePostValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid post ID is required"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content must be less than 5000 characters"),
  body("priority")
    .optional()
    .isIn(["urgent", "high", "normal", "low"])
    .withMessage("Invalid priority level"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Title must be less than 255 characters"),
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
  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiration date format"),
];

const getPostsValidation = [
  query("neighborhoodId")
    .isInt({ min: 1 })
    .withMessage("Valid neighborhood ID is required"),
  query("postType")
    .optional()
    .isIn([
      "safety_alert",
      "help_request",
      "help_offer",
      "general",
      "weather_update",
    ])
    .withMessage("Invalid post type"),
  query("priority")
    .optional()
    .isIn(["urgent", "high", "normal", "low"])
    .withMessage("Invalid priority level"),
  query("isEmergency")
    .optional()
    .isBoolean()
    .withMessage("isEmergency must be a boolean"),
  query("isResolved")
    .optional()
    .isBoolean()
    .withMessage("isResolved must be a boolean"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be 0 or greater"),
];

const createCommentValidation = [
  param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage(
      "Comment content is required and must be less than 2000 characters"
    ),
  body("parentCommentId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid parent comment ID"),
  body("images").optional().isArray().withMessage("Images must be an array"),
];

const reactionValidation = [
  param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required"),
  body("reactionType")
    .isIn(["like", "love", "helpful", "concerned", "angry"])
    .withMessage("Invalid reaction type"),
];

router.get("/", getPostsValidation, postController.getPosts);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid post ID is required")],
  postController.getPost
);

router.post("/", auth, createPostValidation, postController.createPost);

router.put("/:id", auth, updatePostValidation, postController.updatePost);

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Valid post ID is required")],
  postController.deletePost
);

router.get(
  "/:postId/comments",
  [
    param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset must be 0 or greater"),
  ],
  postController.getComments
);

router.post(
  "/:postId/comments",
  auth,
  createCommentValidation,
  postController.createComment
);

router.post(
  "/:postId/reactions",
  auth,
  reactionValidation,
  postController.addReaction
);

router.delete(
  "/:postId/reactions",
  auth,
  [param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required")],
  postController.removeReaction
);

module.exports = router;
