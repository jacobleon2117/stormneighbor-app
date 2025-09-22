const express = require("express");
const { body, query, param } = require("express-validator");
const { auth } = require("../middleware/auth");
const { adminAuth } = require("../middleware/adminAuth");
const { handleValidationErrors } = require("../middleware/validation");
const { cacheConfigs } = require("../middleware/cache");
const searchController = require("../controllers/searchController");

const router = express.Router();

const optionalQueryTrimmedString = (name, maxLength) =>
  query(name).optional().trim().isLength({ max: maxLength });
const optionalQueryInt = (name, min, max) => query(name).optional().isInt({ min, max });

const searchPostsValidation = [
  query("q").optional().trim().isLength({ max: 200 }),
  query("query").optional().trim().isLength({ max: 200 }),
  optionalQueryTrimmedString("city", 100),
  optionalQueryTrimmedString("state", 50),
  query("types").optional().isString(),
  query("priorities").optional().isString(),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
  query("emergencyOnly").optional().isBoolean(),
  query("resolved").optional().isIn(["all", "resolved", "unresolved"]),
  query("sortBy").optional().isIn(["relevance", "date", "popularity"]),
  optionalQueryInt("limit", 1, 100),
  optionalQueryInt("offset", 0, 1000),
];

const queryWithCityState = [
  optionalQueryTrimmedString("city", 100),
  optionalQueryTrimmedString("state", 50),
];
const queryWithLimit = (name = "limit", min = 1, max = 50) => [optionalQueryInt(name, min, max)];

const quickSearchMiddleware =
  (overrides = {}) =>
  (req, _res, next) => {
    req.query = { ...req.query, ...overrides };
    next();
  };

router.get("/test-system", searchController.testSearchSystem);

router.get(
  "/",
  auth,
  searchPostsValidation,
  handleValidationErrors,
  cacheConfigs.shortTerm,
  searchController.searchPosts
);

router.get(
  "/suggestions",
  [
    query("q")
      .isLength({ min: 2, max: 100 })
      .withMessage("Query must be between 2 and 100 characters"),
    ...queryWithCityState,
    ...queryWithLimit(),
  ],
  handleValidationErrors,
  cacheConfigs.static,
  searchController.getSearchSuggestions
);

router.get(
  "/trending",
  [...queryWithCityState, ...queryWithLimit()],
  handleValidationErrors,
  cacheConfigs.static,
  searchController.getTrendingSearches
);

router.get(
  "/users",
  auth,
  [...queryWithCityState, ...queryWithLimit()],
  handleValidationErrors,
  cacheConfigs.shortTerm,
  searchController.searchUsers
);

router.get("/saved", auth, searchController.getSavedSearches);
router.post(
  "/saved",
  auth,
  [
    body("name").trim().isLength({ min: 1, max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("query").optional().trim().isLength({ max: 200 }),
    body("filters").optional().isObject(),
  ],
  handleValidationErrors,
  searchController.saveSearch
);

router.get(
  "/saved/:id/execute",
  auth,
  [param("id").isInt()],
  handleValidationErrors,
  searchController.executeSavedSearch
);
router.delete(
  "/saved/:id",
  auth,
  [param("id").isInt()],
  handleValidationErrors,
  searchController.deleteSavedSearch
);

router.get(
  "/analytics",
  auth,
  adminAuth,
  [...queryWithCityState, query("days").optional().isInt({ min: 1, max: 365 })],
  handleValidationErrors,
  searchController.getSearchAnalytics
);

router.get(
  "/quick/emergency",
  auth,
  [...queryWithCityState, ...queryWithLimit()],
  handleValidationErrors,
  quickSearchMiddleware({ emergencyOnly: "true", sortBy: "date" }),
  searchController.searchPosts
);

router.get(
  "/quick/help-requests",
  auth,
  [...queryWithCityState, ...queryWithLimit()],
  handleValidationErrors,
  quickSearchMiddleware({ types: "help_request", resolved: "unresolved", sortBy: "date" }),
  searchController.searchPosts
);

router.get(
  "/quick/help-offers",
  auth,
  [...queryWithCityState, ...queryWithLimit()],
  handleValidationErrors,
  quickSearchMiddleware({ types: "help_offer", sortBy: "date" }),
  searchController.searchPosts
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
  (req, _res, next) => {
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
  searchController.searchPosts
);

module.exports = router;
