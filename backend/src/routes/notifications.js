// File: backend/src/routes/notifications.js
const express = require("express");
const { body, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { adminAuth, requirePermission } = require("../middleware/adminAuth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  registerDevice,
  removeDevice,
  getUserDevices,
  sendTestNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  getNotificationStats,
  testFirebaseConnection,
  getServiceStatus,
} = require("../controllers/pushNotificationController");

const router = express.Router();

const deviceRegistrationValidation = [
  body("deviceToken")
    .isString()
    .isLength({ min: 140 })
    .withMessage("Valid device token is required"),
  body("deviceInfo").optional().isObject().withMessage("Device info must be an object"),
  body("deviceInfo.platform")
    .optional()
    .isIn(["ios", "android", "web"])
    .withMessage("Platform must be ios, android, or web"),
  body("deviceInfo.version").optional().isString().withMessage("Version must be a string"),
];

const testNotificationValidation = [
  body("title")
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title is required and must be 1-100 characters"),
  body("body")
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage("Body is required and must be 1-255 characters"),
  body("data").optional().isObject().withMessage("Data must be an object"),
  body("targetUserId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Target user ID must be a positive integer"),
];

const topicNotificationValidation = [
  body("topic")
    .isString()
    .matches(/^[a-zA-Z0-9-_.~%]+$/)
    .withMessage("Topic must contain only valid characters"),
  body("title")
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title is required and must be 1-100 characters"),
  body("body")
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage("Body is required and must be 1-255 characters"),
  body("data").optional().isObject().withMessage("Data must be an object"),
];

const topicValidation = [
  body("topic")
    .isString()
    .matches(/^[a-zA-Z0-9-_.~%]+$/)
    .withMessage("Topic must contain only valid characters"),
];

router.use(auth);

router.post("/register", deviceRegistrationValidation, handleValidationErrors, registerDevice);

router.delete("/register", removeDevice);

router.get("/devices", getUserDevices);

router.post("/subscribe", topicValidation, handleValidationErrors, subscribeToTopic);

router.post("/unsubscribe", topicValidation, handleValidationErrors, unsubscribeFromTopic);

router.get("/status", getServiceStatus);

router.use(adminAuth);

router.post(
  "/test",
  requirePermission("notifications", "send"),
  testNotificationValidation,
  handleValidationErrors,
  sendTestNotification
);

router.post(
  "/topic",
  requirePermission("notifications", "send"),
  topicNotificationValidation,
  handleValidationErrors,
  sendTopicNotification
);

router.get(
  "/stats",
  requirePermission("notifications", "read"),
  [
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ],
  handleValidationErrors,
  getNotificationStats
);

router.get("/test-connection", requirePermission("notifications", "test"), testFirebaseConnection);

module.exports = router;
