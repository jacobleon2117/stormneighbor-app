// File: backend/src/routes/weather.js
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
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude is required"),
    query("lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude is required"),
    handleValidationErrors,
  ],
  cacheConfigs.weather,
  weatherController.getCurrentWeather
);

module.exports = router;
