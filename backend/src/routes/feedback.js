const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const {
  createFeedback,
  getAllFeedback,
  getUserFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats,
} = require("../controllers/feedback");

const createFeedbackValidation = [
  body("feedbackType")
    .isIn(["bug_report", "feature_request", "general_feedback", "ui_ux_feedback"])
    .withMessage("Invalid feedback type"),
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required and must be under 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Description is required and must be under 1000 characters"),
  body("priority").optional().isIn(["low", "normal", "high"]).withMessage("Invalid priority level"),
  body("appVersion")
    .optional()
    .isLength({ max: 50 })
    .withMessage("App version must be under 50 characters"),
  body("deviceInfo")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Device info must be under 200 characters"),
];

const updateFeedbackStatusValidation = [
  param("id").isInt().withMessage("Invalid feedback ID"),
  body("status").isIn(["new", "in_review", "addressed", "closed"]).withMessage("Invalid status"),
];

const getFeedbackValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["new", "in_review", "addressed", "closed"])
    .withMessage("Invalid status filter"),
  query("feedbackType")
    .optional()
    .isIn(["bug_report", "feature_request", "general_feedback", "ui_ux_feedback"])
    .withMessage("Invalid feedback type filter"),
  query("priority")
    .optional()
    .isIn(["low", "normal", "high"])
    .withMessage("Invalid priority filter"),
  query("sortBy")
    .optional()
    .isIn(["created_at", "updated_at", "priority", "status", "feedback_type"])
    .withMessage("Invalid sort field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Invalid sort order"),
];

router.post("/", auth, createFeedbackValidation, handleValidationErrors, createFeedback);

router.get("/me", auth, getFeedbackValidation, handleValidationErrors, getUserFeedback);

router.delete(
  "/:id",
  auth,
  [param("id").isInt().withMessage("Invalid feedback ID")],
  handleValidationErrors,
  deleteFeedback
);

router.get("/", auth, getFeedbackValidation, handleValidationErrors, getAllFeedback);

router.get("/stats", auth, getFeedbackStats);

router.put(
  "/:id/status",
  auth,
  updateFeedbackStatusValidation,
  handleValidationErrors,
  updateFeedbackStatus
);

module.exports = router;
