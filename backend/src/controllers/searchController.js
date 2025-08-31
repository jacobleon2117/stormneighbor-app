const { validationResult } = require("express-validator");
const SearchService = require("../services/searchService");

const searchPosts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const searchParams = {
      query: req.query.q || req.query.query,
      city: req.query.city,
      state: req.query.state,
      postTypes: req.query.types ? req.query.types.split(",") : null,
      priorities: req.query.priorities ? req.query.priorities.split(",") : null,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : null,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo) : null,
      emergencyOnly: req.query.emergencyOnly === "true",
      resolvedFilter: req.query.resolved || "all",
      sortBy: req.query.sortBy || "relevance",
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    };

    if (!searchParams.city || !searchParams.state) {
      const { pool } = require("../config/database");
      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT location_city, address_state FROM users WHERE id = $1",
          [userId]
        );
        if (userResult.rows.length > 0) {
          searchParams.city = searchParams.city || userResult.rows[0].location_city;
          searchParams.state = searchParams.state || userResult.rows[0].address_state;
        }
      } finally {
        client.release();
      }
    }

    const results = await SearchService.searchPosts(searchParams, userId);

    res.json({
      success: true,
      message: "Search completed successfully",
      data: {
        posts: results.posts,
        meta: results.meta,
        searchParams: {
          query: searchParams.query,
          location: {
            city: searchParams.city,
            state: searchParams.state,
          },
          filters: {
            postTypes: searchParams.postTypes,
            priorities: searchParams.priorities,
            dateRange: {
              from: searchParams.dateFrom,
              to: searchParams.dateTo,
            },
            emergencyOnly: searchParams.emergencyOnly,
            resolved: searchParams.resolvedFilter,
          },
          sort: searchParams.sortBy,
          pagination: {
            limit: searchParams.limit,
            offset: searchParams.offset,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Search posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error performing search",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query, city, state, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        message: "Suggestions retrieved successfully",
        data: {
          suggestions: [],
          popular: [],
          query: query || "",
        },
      });
    }

    const results = await SearchService.getSearchSuggestions(query, city, state, parseInt(limit));

    res.json({
      success: true,
      message: "Suggestions retrieved successfully",
      data: results,
    });
  } catch (error) {
    logger.error("Get search suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting suggestions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getTrendingSearches = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let { city, state } = req.query;
    const { limit = 10 } = req.query;

    if ((!city || !state) && userId) {
      const { pool } = require("../config/database");
      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT location_city, address_state FROM users WHERE id = $1",
          [userId]
        );
        if (userResult.rows.length > 0) {
          city = city || userResult.rows[0].location_city;
          state = state || userResult.rows[0].address_state;
        }
      } finally {
        client.release();
      }
    }

    const trending = await SearchService.getTrendingSearches(city, state, parseInt(limit));

    res.json({
      success: true,
      message: "Trending searches retrieved successfully",
      data: {
        trending,
        location: { city, state },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Get trending searches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting trending searches",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q: query, city, state, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        message: "User search completed",
        data: {
          users: [],
          query: query || "",
        },
      });
    }

    const users = await SearchService.searchUsers(query, city, state, parseInt(limit));

    res.json({
      success: true,
      message: "User search completed successfully",
      data: {
        users,
        query,
        resultCount: users.length,
      },
    });
  } catch (error) {
    logger.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const saveSearch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { name, description, query, filters } = req.body;

    const savedSearch = await SearchService.saveSearch(userId, {
      name,
      description,
      query,
      filters,
    });

    res.status(201).json({
      success: true,
      message: "Search saved successfully",
      data: { savedSearch },
    });
  } catch (error) {
    logger.error("Save search error:", error);

    if (error.constraint === "saved_searches_user_id_name_key") {
      return res.status(400).json({
        success: false,
        message: "You already have a saved search with this name",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error saving search",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getSavedSearches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const savedSearches = await SearchService.getSavedSearches(userId);

    res.json({
      success: true,
      message: "Saved searches retrieved successfully",
      data: {
        savedSearches,
        count: savedSearches.length,
      },
    });
  } catch (error) {
    logger.error("Get saved searches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting saved searches",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const executeSavedSearch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const results = await SearchService.executeSavedSearch(userId, parseInt(id));

    res.json({
      success: true,
      message: "Saved search executed successfully",
      data: results,
    });
  } catch (error) {
    logger.error("Execute saved search error:", error);

    if (error.message === "Saved search not found") {
      return res.status(404).json({
        success: false,
        message: "Saved search not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error executing saved search",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const result = await client.query(
        "UPDATE saved_searches SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING name",
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Saved search not found",
        });
      }

      res.json({
        success: true,
        message: "Saved search deleted successfully",
        data: { name: result.rows[0].name },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Delete saved search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting saved search",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getSearchAnalytics = async (req, res) => {
  try {
    const { city, state, days = 7 } = req.query;

    const analytics = await SearchService.getSearchAnalytics(city, state, parseInt(days));

    res.json({
      success: true,
      message: "Search analytics retrieved successfully",
      data: analytics,
    });
  } catch (error) {
    logger.error("Get search analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting search analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const testSearchSystem = async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const logger = require("../utils/logger");
    const client = await pool.connect();

    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('search_queries', 'saved_searches', 'search_suggestions', 'trending_searches')
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map((row) => row.table_name);

      const suggestionsResult = await client.query(`
        SELECT COUNT(*) as suggestion_count FROM search_suggestions WHERE is_approved = true
      `);

      const postsResult = await client.query(`
        SELECT COUNT(*) as total_posts FROM posts
      `);

      let searchFunctionWorking = false;
      try {
        await SearchService.searchPosts(
          {
            query: "test",
            city: "Austin",
            state: "Texas",
            limit: 1,
          },
          1
        );
        searchFunctionWorking = true;
      } catch (searchError) {
        logger.info("Search service test failed:", searchError.message);
      }

      const userId = req.user?.userId;
      let userSearches = null;
      if (userId) {
        const userSearchResult = await client.query(
          `
          SELECT COUNT(*) as search_count FROM search_queries WHERE user_id = $1
        `,
          [userId]
        );
        userSearches = {
          searchCount: parseInt(userSearchResult.rows[0].search_count),
        };
      }

      res.json({
        success: true,
        message: "Search system is working!",
        data: {
          tables: {
            found: tables,
            expected: [
              "search_queries",
              "saved_searches",
              "search_suggestions",
              "trending_searches",
            ],
            allPresent: tables.length === 4,
          },
          suggestions: {
            active: parseInt(suggestionsResult.rows[0].suggestion_count),
          },
          posts: {
            total: parseInt(postsResult.rows[0].total_posts),
          },
          searchFunction: {
            working: searchFunctionWorking,
          },
          userSearches,
          features: {
            textSearch: true,
            advancedFiltering: true,
            savedSearches: true,
            searchSuggestions: true,
            searchAnalytics: true,
            userSearch: true,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Search system test error:", error);
    res.status(500).json({
      success: false,
      message: "Search system test failed",
      error: error.message,
    });
  }
};

module.exports = {
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
};
