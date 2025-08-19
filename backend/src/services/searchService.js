const { pool } = require("../config/database");

class SearchService {
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
      await this.logSearchQuery(client, userId, query, searchParams, city, state);

      const whereConditions = ["u.is_active = true"];
      const params = [];
      let paramIndex = 1;

      if (query && query.trim()) {
        whereConditions.push(
          `(p.title ILIKE '%' || $${paramIndex} || '%' OR p.content ILIKE '%' || $${paramIndex} || '%')`
        );
        params.push(query.trim());
        paramIndex++;
      }

      if (city) {
        whereConditions.push(`p.location_city = $${paramIndex}`);
        params.push(city);
        paramIndex++;
      }
      if (state) {
        whereConditions.push(`p.location_state = $${paramIndex}`);
        params.push(state);
        paramIndex++;
      }

      if (postTypes && postTypes.length > 0) {
        whereConditions.push(`p.post_type = ANY($${paramIndex})`);
        params.push(postTypes);
        paramIndex++;
      }

      if (priorities && priorities.length > 0) {
        whereConditions.push(`p.priority = ANY($${paramIndex})`);
        params.push(priorities);
        paramIndex++;
      }

      if (emergencyOnly) {
        whereConditions.push("p.is_emergency = true");
      }

      if (resolvedFilter === "resolved") {
        whereConditions.push("p.is_resolved = true");
      } else if (resolvedFilter === "unresolved") {
        whereConditions.push("p.is_resolved = false");
      }

      if (dateFrom) {
        whereConditions.push(`p.created_at >= $${paramIndex}`);
        params.push(dateFrom);
        paramIndex++;
      }
      if (dateTo) {
        whereConditions.push(`p.created_at <= $${paramIndex}`);
        params.push(dateTo);
        paramIndex++;
      }

      let orderBy = `
        CASE WHEN p.is_emergency THEN 1 ELSE 2 END,
        CASE p.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5
        END,
        p.created_at DESC
      `;

      if (sortBy === "popularity") {
        orderBy =
          `
          (COALESCE(cc.comment_count, 0) + COALESCE(rc.reaction_count, 0)) DESC,
          ` + orderBy;
      }

      const result = await client.query(
        `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority,
          p.location_city, p.location_state, p.is_emergency, p.is_resolved, p.created_at,
          u.id as author_id, 
          CONCAT(u.first_name, ' ', u.last_name) as author_name,
          u.profile_image_url as author_image,
          1.0 as match_score,
          COALESCE(cc.comment_count, 0) as comment_count,
          COALESCE(rc.reaction_count, 0) as reaction_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comment_count 
          FROM comments 
          GROUP BY post_id
        ) cc ON p.id = cc.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as reaction_count 
          FROM reactions 
          WHERE post_id IS NOT NULL 
          GROUP BY post_id
        ) rc ON p.id = rc.post_id
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, limit, offset]
      );

      const executionTime = Date.now() - startTime;

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

  static async getSearchSuggestions(partialQuery, city, state, limit = 10) {
    const client = await pool.connect();

    try {
      const suggestionsResult = await client.query(
        `
        SELECT 
          suggestion_text,
          suggestion_type,
          category,
          search_count
        FROM search_suggestions
        WHERE suggestion_text ILIKE $1
        AND is_approved = true
        AND (city IS NULL OR city = $2)
        AND (state IS NULL OR state = $3)
        ORDER BY 
          search_count DESC,
          click_through_rate DESC
        LIMIT $4
      `,
        [`${partialQuery}%`, city, state, limit]
      );

      const popularResult = await client.query(
        `
        SELECT 
          search_term as suggestion_text, 
          'popular' as suggestion_type,
          search_count
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

  static async executeSavedSearch(userId, savedSearchId) {
    const client = await pool.connect();

    try {
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

      const searchResults = await this.searchPosts(
        {
          query: query_text,
          ...filters,
        },
        userId
      );

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

  static async searchUsers(query, city, state, limit = 10) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          id, first_name, last_name, profile_image_url, bio,
          location_city, address_state,
          1.0 as match_score
        FROM users
        WHERE is_active = true
        AND (
          first_name ILIKE $1 OR
          last_name ILIKE $1 OR
          COALESCE(bio, '') ILIKE $1
        )
        AND (location_city = $2 OR $2 IS NULL)
        AND (address_state = $3 OR $3 IS NULL)
        ORDER BY first_name, last_name
        LIMIT $4
      `,
        [`%${query}%`, city, state, limit]
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

  static async getSearchAnalytics(city, state, days = 7) {
    const client = await pool.connect();

    try {
      const popularTerms = await client.query(
        `
        SELECT 
          query_text,
          COUNT(*) as search_count,
          AVG(results_count) as avg_results,
          COUNT(DISTINCT user_id) as unique_users
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
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

      const searchVolume = await client.query(
        `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as search_count,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(results_count) as avg_results
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        AND (search_city = $1 OR $1 IS NULL)
        AND (search_state = $2 OR $2 IS NULL)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
        [city, state]
      );

      const noResults = await client.query(
        `
        SELECT query_text, COUNT(*) as frequency
        FROM search_queries
        WHERE results_count = 0
        AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
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

  static async logSearchQuery(client, userId, query, filters, city, state) {
    if (userId) {
      try {
        await client.query(
          `
          INSERT INTO search_queries (
            user_id, query_text, filters, search_city, search_state, source
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [userId, query, JSON.stringify(filters), city, state, "manual"]
        );
      } catch (error) {
        console.error("Error logging search query:", error.message);
      }
    }
  }

  static async updateSearchQueryStats(client, query, resultCount, executionTime) {
    if (!query) return;

    try {
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
    } catch (error) {
      console.error("Error updating search stats:", error.message);
    }
  }
}

module.exports = SearchService;
