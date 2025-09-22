const express = require("express");
const { query } = require("express-validator");
const weatherController = require("../controllers/weatherController");
const { handleValidationErrors } = require("../middleware/validation");
const { createCacheMiddleware } = require("../middleware/cache");

const router = express.Router();

const validateLatLng = [
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
];

const weatherCache = createCacheMiddleware({ ttl: 300000 });

router.get(
  "/current",
  [...validateLatLng, handleValidationErrors],
  weatherCache,
  async (req, res, next) => {
    try {
      await weatherController.getCurrentWeather(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/cache/stats", async (req, res, next) => {
  try {
    await weatherController.getCacheStats(req, res);
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  console.error("Weather route error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
});

module.exports = router;
