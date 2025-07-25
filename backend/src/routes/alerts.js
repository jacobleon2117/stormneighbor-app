const express = require("express");
const { body, query, param } = require("express-validator");
const weatherController = require("../controllers/weatherController");
const auth = require("../middleware/auth");

const router = express.Router();

const createAlertValidation = [
  body("neighborhoodId")
    .isInt({ min: 1 })
    .withMessage("Valid neighborhood ID is required"),
  body("title")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Title is required and must be less than 255 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage(
      "Description is required and must be less than 5000 characters"
    ),
  body("severity")
    .isIn(["CRITICAL", "HIGH", "MODERATE", "LOW"])
    .withMessage("Invalid severity level"),
  body("alertType")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Alert type is required"),
  body("startTime")
    .optional()
    .isISO8601()
    .withMessage("Invalid start time format"),
  body("endTime").optional().isISO8601().withMessage("Invalid end time format"),
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];

const updateAlertValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid alert ID is required"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("endTime").optional().isISO8601().withMessage("Invalid end time format"),
];

router.get(
  "/",
  [
    query("neighborhoodId")
      .isInt({ min: 1 })
      .withMessage("Valid neighborhood ID is required"),
  ],
  weatherController.getAlerts
);

router.post("/", auth, createAlertValidation, weatherController.createAlert);

router.put("/:id", auth, updateAlertValidation, weatherController.updateAlert);

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Valid alert ID is required")],
  weatherController.deleteAlert
);

module.exports = router;
