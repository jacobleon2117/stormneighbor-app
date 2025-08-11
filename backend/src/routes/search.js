// File: backend/src/routes/search.js
const express = require("express");
const { body, query, param } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { cacheConfigs } = require("../middleware/cache");
const {
  searchPosts,
  getSearchSuggestions,
  getTrendingSearches,
  searchUsers,
  saveSearch,
  getSavedSearches,
  executeSavedSearch,
  deleteSavedSearch,
  getSearchAnalytics,
  testSearchSystem,
} = require("../controllers/searchController");

const router = express.Router();

const searchPostsValidation = [
  query("q")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Query must be less than 200 characters"),
  query("query")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Query must be less than 200 characters"),
  query("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be less than 100 characters"),
  query("state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State must be less than 50 characters"),
  query("types").optional().isString().withMessage("Types must be a comma-separated string"),
  query("priorities")
    .optional()
    .isString()
    .withMessage("Priorities must be a comma-separated string"),
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom format"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo format"),
  query("emergencyOnly").optional().isBoolean().withMessage("emergencyOnly must be a boolean"),
  query("resolved")
    .optional()
    .isIn(["all", "resolved", "unresolved"])
    .withMessage("Invalid resolved filter"),
  query("sortBy")
    .optional()
    .isIn(["relevance", "date", "popularity"])
    .withMessage("Invalid sort option"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be non-negative"),
];

const searchSuggestionsValidation = [
  query("q")
    .isLength({ min: 2, max: 100 })
    .withMessage("Query must be between 2 and 100 characters"),
  query("city").optional().trim().isLength({ max: 100 }),
  query("state").optional().trim().isLength({ max: 50 }),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

const saveSearchValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("query")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Query must be less than 200 characters"),
  body("filters").optional().isObject().withMessage("Filters must be an object"),
];

const searchUsersValidation = [
  query("q")
    .isLength({ min: 2, max: 100 })
    .withMessage("Query must be between 2 and 100 characters"),
  query("city").optional().trim().isLength({ max: 100 }),
  query("state").optional().trim().isLength({ max: 50 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];

router.get("/test-system", testSearchSystem);

router.get(
  "/",
  auth,
  searchPostsValidation,
  handleValidationErrors,
  cacheConfigs.shortTerm,
  searchPosts
);

router.get(
  "/suggestions",
  searchSuggestionsValidation,
  handleValidationErrors,
  cacheConfigs.static,
  getSearchSuggestions
);

router.get(
  "/trending",
  [
    query("city").optional().trim().isLength({ max: 100 }),
    query("state").optional().trim().isLength({ max: 50 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  cacheConfigs.static,
  getTrendingSearches
);

router.get(
  "/users",
  auth,
  searchUsersValidation,
  handleValidationErrors,
  cacheConfigs.shortTerm,
  searchUsers
);

router.get("/saved", auth, getSavedSearches);

router.post("/saved", auth, saveSearchValidation, handleValidationErrors, saveSearch);

router.get(
  "/saved/:id/execute",
  auth,
  [param("id").isInt().withMessage("Valid saved search ID is required")],
  handleValidationErrors,
  executeSavedSearch
);

router.delete(
  "/saved/:id",
  auth,
  [param("id").isInt().withMessage("Valid saved search ID is required")],
  handleValidationErrors,
  deleteSavedSearch
);

router.get(
  "/analytics",
  auth, // TODO: Add admin middleware
  [
    query("city").optional().trim().isLength({ max: 100 }),
    query("state").optional().trim().isLength({ max: 50 }),
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ],
  handleValidationErrors,
  getSearchAnalytics
);

router.get(
  "/quick/emergency",
  auth,
  [
    query("city").optional().trim().isLength({ max: 100 }),
    query("state").optional().trim().isLength({ max: 50 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    req.query.emergencyOnly = "true";
    req.query.sortBy = "date";
    next();
  },
  searchPosts
);

router.get(
  "/quick/help-requests",
  auth,
  [
    query("city").optional().trim().isLength({ max: 100 }),
    query("state").optional().trim().isLength({ max: 50 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    req.query.types = "help_request";
    req.query.resolved = "unresolved";
    req.query.sortBy = "date";
    next();
  },
  searchPosts
);

router.get(
  "/quick/help-offers",
  auth,
  [
    query("city").optional().trim().isLength({ max: 100 }),
    query("state").optional().trim().isLength({ max: 50 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    req.query.types = "help_offer";
    req.query.sortBy = "date";
    next();
  },
  searchPosts
);

router.post(
  "/advanced",
  auth,
  [
    body("query").optional().trim().isLength({ max: 200 }),
    body("location").optional().isObject(),
    body("location.city").optional().trim().isLength({ max: 100 }),
    body("location.state").optional().trim().isLength({ max: 50 }),
    body("location.radius").optional().isFloat({ min: 0.1, max: 100 }),
    body("filters").optional().isObject(),
    body("filters.postTypes").optional().isArray(),
    body("filters.priorities").optional().isArray(),
    body("filters.dateRange").optional().isObject(),
    body("filters.emergencyOnly").optional().isBoolean(),
    body("filters.resolvedFilter").optional().isIn(["all", "resolved", "unresolved"]),
    body("sorting").optional().isObject(),
    body("sorting.sortBy").optional().isIn(["relevance", "date", "popularity"]),
    body("pagination").optional().isObject(),
    body("pagination.limit").optional().isInt({ min: 1, max: 100 }),
    body("pagination.offset").optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    const { query, location, filters, sorting, pagination } = req.body;

    req.query = {
      q: query,
      city: location?.city,
      state: location?.state,
      radius: location?.radius,
      types: filters?.postTypes?.join(","),
      priorities: filters?.priorities?.join(","),
      dateFrom: filters?.dateRange?.from,
      dateTo: filters?.dateRange?.to,
      emergencyOnly: filters?.emergencyOnly,
      resolved: filters?.resolvedFilter,
      sortBy: sorting?.sortBy,
      limit: pagination?.limit,
      offset: pagination?.offset,
    };

    next();
  },
  searchPosts
);

module.exports = router;
