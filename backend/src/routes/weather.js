// File: backend/src/routes/weather.js
const express = require("express");
const { query } = require("express-validator");
const weatherController = require("../controllers/weatherController");

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
  ],
  weatherController.getCurrentWeather
);

module.exports = router;
