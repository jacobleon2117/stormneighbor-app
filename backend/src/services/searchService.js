// File: backend/src/services/searchService.js
const { pool } = require("../config/database");

class SearchService {
  // Main search function with all filters
  static async searchPosts(searchParams, userId) {
    const {
      query = "",
      city,
      state,
      postTypes,
      priorities,
      dateFrom,
      dateTo,
      emergencyOnly = false,
      resolvedFilter = "all",
      sortBy = "relevance",
      limit = 20,
      offset = 0,
    } = searchParams;

    const startTime = Date.now();
    const client = await pool.connect();

    try {
      // Log the search query for analytics
      await this.logSearchQuery(client, userId, query, searchParams, city, state);

      // Execute the advanced search function
      const result = await client.query(
        `
        SELECT * FROM search_posts($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        [
          query || null,
          city || null,
          state || null,
          postTypes || null,
          priorities || null,
          dateFrom || null,
          dateTo || null,
          emergencyOnly,
          resolvedFilter,
          sortBy,
          limit,
          offset,
        ]
      );

      const executionTime = Date.now() - startTime;

      // Update search query with results count and execution time
      await this.updateSearchQueryStats(client, query, result.rows.length, executionTime);

      return {
        posts: result.rows.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          postType: row.post_type,
          priority: row.priority,
          location: {
            city: row.location_city,
            state: row.location_state,
          },
          isEmergency: row.is_emergency,
          isResolved: row.is_resolved,
          createdAt: row.created_at,
          author: {
            id: row.author_id,
            name: row.author_name,
            profileImage: row.author_image,
          },
          matchScore: parseFloat(row.match_score),
          commentCount: parseInt(row.comment_count),
          reactionCount: parseInt(row.reaction_count),
        })),
        meta: {
          query,
          filters: searchParams,
          resultCount: result.rows.length,
          executionTime,
          hasMore: result.rows.length === limit,
        },
      };
    } finally {
      client.release();
    }
  }

  // Search suggestions and autocomplete
  static async getSearchSuggestions(partialQuery, city, state, limit = 10) {
    const client = await pool.connect();

    try {
      // Get suggestions based on partial query
      const suggestionsResult = await client.query(
        `
        SELECT 
          suggestion_text,
          suggestion_type,
          category,
          search_count
        FROM search_suggestions
        WHERE (
          suggestion_text ILIKE $1 OR
          to_tsvector('english', suggestion_text) @@ plainto_tsquery('english', $2)
        )
        AND is_approved = true
        AND (city IS NULL OR city = $3)
        AND (state IS NULL OR state = $4)
        ORDER BY 
          CASE WHEN suggestion_text ILIKE $1 THEN 1 ELSE 2 END,
          search_count DESC,
          click_through_rate DESC
        LIMIT $5
      `,
        [`${partialQuery}%`, partialQuery, city, state, limit]
      );

      // Get popular searches in the area
      const popularResult = await client.query(
        `
        SELECT DISTINCT search_term as suggestion_text, 'popular' as suggestion_type
        FROM trending_searches
        WHERE search_count > 5
        AND (city IS NULL OR city = $1)
        AND (state IS NULL OR state = $2)
        AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY search_count DESC
        LIMIT 5
      `,
        [city, state]
      );

      return {
        suggestions: suggestionsResult.rows,
        popular: popularResult.rows,
        query: partialQuery,
      };
    } finally {
      client.release();
    }
  }

  // Get trending searches
  static async getTrendingSearches(city, state, limit = 10) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          search_term,
          category,
          search_count,
          trend_score,
          sentiment
        FROM trending_searches
        WHERE is_trending = true
        AND (city IS NULL OR city = $1)
        AND (state IS NULL OR state = $2)
        ORDER BY trend_score DESC, search_count DESC
        LIMIT $3
      `,
        [city, state, limit]
      );

      return result.rows.map((row) => ({
        term: row.search_term,
        category: row.category,
        searchCount: row.search_count,
        trendScore: parseFloat(row.trend_score),
        sentiment: row.sentiment,
      }));
    } finally {
      client.release();
    }
  }

  // Save a search for a user
  static async saveSearch(userId, searchData) {
    const { name, description, query, filters } = searchData;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        INSERT INTO saved_searches (user_id, name, description, query_text, filters)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, name) 
        DO UPDATE SET 
          description = $3,
          query_text = $4,
          filters = $5,
          updated_at = NOW()
        RETURNING id, name, created_at
      `,
        [userId, name, description, query, JSON.stringify(filters)]
      );

      return {
        id: result.rows[0].id,
        name: result.rows[0].name,
        createdAt: result.rows[0].created_at,
      };
    } finally {
      client.release();
    }
  }

  // Get user's saved searches
  static async getSavedSearches(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          id, name, description, query_text, filters,
          notify_new_results, notification_frequency,
          total_results, last_result_count, last_executed,
          created_at, updated_at
        FROM saved_searches
        WHERE user_id = $1 AND is_active = true
        ORDER BY updated_at DESC
      `,
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        query: row.query_text,
        filters: row.filters || {},
        notifications: {
          enabled: row.notify_new_results,
          frequency: row.notification_frequency,
        },
        stats: {
          totalResults: row.total_results,
          lastResultCount: row.last_result_count,
          lastExecuted: row.last_executed,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  // Execute a saved search
  static async executeSavedSearch(userId, savedSearchId) {
    const client = await pool.connect();

    try {
      // Get the saved search
      const savedSearchResult = await client.query(
        `
        SELECT query_text, filters FROM saved_searches
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `,
        [savedSearchId, userId]
      );

      if (savedSearchResult.rows.length === 0) {
        throw new Error("Saved search not found");
      }

      const { query_text, filters } = savedSearchResult.rows[0];

      // Execute the search
      const searchResults = await this.searchPosts(
        {
          query: query_text,
          ...filters,
        },
        userId
      );

      // Update saved search stats
      await client.query(
        `
        UPDATE saved_searches 
        SET 
          last_executed = NOW(),
          last_result_count = $1,
          total_results = total_results + $1,
          updated_at = NOW()
        WHERE id = $2
      `,
        [searchResults.posts.length, savedSearchId]
      );

      return searchResults;
    } finally {
      client.release();
    }
  }

  // Search users (for @mentions, finding neighbors, etc.)
  static async searchUsers(query, city, state, limit = 10) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          id, first_name, last_name, profile_image_url, bio,
          location_city, address_state,
          ts_rank(
            to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(bio, '')),
            plainto_tsquery('english', $1)
          ) as match_score
        FROM users
        WHERE is_active = true
        AND (
          to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(bio, '')) 
          @@ plainto_tsquery('english', $1)
          OR first_name ILIKE $2
          OR last_name ILIKE $2
        )
        AND (location_city = $3 OR $3 IS NULL)
        AND (address_state = $4 OR $4 IS NULL)
        ORDER BY match_score DESC, first_name, last_name
        LIMIT $5
      `,
        [query, `%${query}%`, city, state, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImage: row.profile_image_url,
        bio: row.bio,
        location: {
          city: row.location_city,
          state: row.address_state,
        },
        matchScore: parseFloat(row.match_score),
      }));
    } finally {
      client.release();
    }
  }

  // Get search analytics for admin/insights
  static async getSearchAnalytics(city, state, days = 7) {
    const client = await pool.connect();

    try {
      // Popular search terms
      const popularTerms = await client.query(
        `
        SELECT 
          query_text,
          COUNT(*) as search_count,
          AVG(results_count) as avg_results,
          COUNT(DISTINCT user_id) as unique_users
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND (search_city = $1 OR $1 IS NULL)
        AND (search_state = $2 OR $2 IS NULL)
        AND query_text IS NOT NULL
        AND query_text != ''
        GROUP BY query_text
        HAVING COUNT(*) > 1
        ORDER BY search_count DESC
        LIMIT 20
      `,
        [city, state]
      );

      // Search volume over time
      const searchVolume = await client.query(
        `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as search_count,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(results_count) as avg_results
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND (search_city = $1 OR $1 IS NULL)
        AND (search_state = $2 OR $2 IS NULL)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
        [city, state]
      );

      // No results searches (for improving suggestions)
      const noResults = await client.query(
        `
        SELECT query_text, COUNT(*) as frequency
        FROM search_queries
        WHERE results_count = 0
        AND created_at >= NOW() - INTERVAL '${days} days'
        AND (search_city = $1 OR $1 IS NULL)
        AND (search_state = $2 OR $2 IS NULL)
        AND query_text IS NOT NULL
        GROUP BY query_text
        ORDER BY frequency DESC
        LIMIT 10
      `,
        [city, state]
      );

      return {
        popularTerms: popularTerms.rows,
        searchVolume: searchVolume.rows,
        noResultsQueries: noResults.rows,
        period: `${days} days`,
        location: { city, state },
      };
    } finally {
      client.release();
    }
  }

  // Private helper methods
  static async logSearchQuery(client, userId, query, filters, city, state) {
    await client.query(
      `
      INSERT INTO search_queries (
        user_id, query_text, filters, search_city, search_state, source
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [userId, query, JSON.stringify(filters), city, state, "manual"]
    );
  }

  static async updateSearchQueryStats(client, query, resultCount, executionTime) {
    if (!query) return;

    await client.query(
      `
      UPDATE search_queries 
      SET results_count = $1, execution_time_ms = $2
      WHERE query_text = $3 
      AND created_at >= NOW() - INTERVAL '1 minute'
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [resultCount, executionTime, query]
    );

    // Update or create search suggestion
    await client.query(
      `
      INSERT INTO search_suggestions (suggestion_text, suggestion_type, search_count, result_count)
      VALUES ($1, 'query', 1, $2)
      ON CONFLICT (suggestion_text, suggestion_type, city, state)
      DO UPDATE SET 
        search_count = search_suggestions.search_count + 1,
        result_count = (search_suggestions.result_count + $2) / 2,
        updated_at = NOW()
    `,
      [query, resultCount]
    );
  }
}

module.exports = SearchService;
