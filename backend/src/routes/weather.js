const express = require("express");
const { query } = require("express-validator");
const weatherController = require("../controllers/weatherController");
const { handleValidationErrors } = require("../middleware/validation");
const { cacheConfigs } = require("../middleware/cache");

const router = express.Router();

router.get(
  "/current",
  [
    query("lat")
      .exists()
      .withMessage("Latitude is required")
      .bail()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude is required"),
    query("lng")
      .exists()
      .withMessage("Longitude is required")
      .bail()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude is required"),
    handleValidationErrors,
  ],
  cacheConfigs.weather,
  weatherController.getCurrentWeather
);

module.exports = router;
