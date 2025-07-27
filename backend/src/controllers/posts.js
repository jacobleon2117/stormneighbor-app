const { pool } = require("../config/database");
const { validationResult } = require("express-validator");

const getPosts = async (req, res) => {
  try {
    const {
      postType,
      priority,
      isEmergency,
      isResolved,
      limit = 20,
      offset = 0,
    } = req.query;

    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const userResult = await client.query(
        `SELECT 
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude,
          location_city,
          address_state as location_state,
          location_radius_miles,
          show_city_only
        FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];

      if (!user.latitude || !user.longitude) {
        console.log("User has no coordinates, trying city-based query");

        const simpleQuery = `
          SELECT 
            p.id, p.title, p.content, p.post_type, p.priority,
            p.is_emergency, p.is_resolved, p.images, p.tags,
            p.location_city, p.location_state, p.created_at, p.updated_at,
            0 as distance_miles,
            u.first_name as author_first_name, 
            u.last_name as author_last_name, 
            u.profile_image_url as author_profile_image,
            p.user_id
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE (p.expires_at IS NULL OR p.expires_at > NOW())
          ORDER BY 
            CASE WHEN p.is_emergency = true THEN 1 ELSE 2 END,
            CASE p.priority 
              WHEN 'urgent' THEN 1 
              WHEN 'high' THEN 2 
              WHEN 'normal' THEN 3 
              WHEN 'low' THEN 4 
            END,
            p.created_at DESC
          LIMIT $1 OFFSET $2
        `;

        const result = await client.query(simpleQuery, [
          parseInt(limit),
          parseInt(offset),
        ]);

        const posts = result.rows.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          postType: row.post_type,
          priority: row.priority,
          isEmergency: row.is_emergency,
          isResolved: row.is_resolved,
          images: row.images || [],
          tags: row.tags || [],
          location:
            row.location_city && row.location_state
              ? `${row.location_city}, ${row.location_state}`
              : null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          distanceMiles: 0,
          user: {
            id: row.user_id,
            firstName: row.author_first_name,
            lastName: row.author_last_name,
            profileImageUrl: row.author_profile_image,
          },
          commentCount: 0,
          reactionCount: 0,
          userHasLiked: false, // TODO: Add actual reaction status
        }));

        return res.json({
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length,
          },
          location: {
            city: user.location_city,
            state: user.location_state,
            radiusMiles: user.location_radius_miles,
            cityOnly: user.show_city_only,
          },
        });
      }

      let functionCall = `
        SELECT * FROM get_nearby_posts(
          ${user.latitude},
          ${user.longitude},
          ${user.location_city ? `'${user.location_city}'` : "NULL"},
          ${user.location_state ? `'${user.location_state}'` : "NULL"},
          ${user.location_radius_miles || 10.0},
          ${user.show_city_only || false},
          ${parseInt(limit)},
          ${parseInt(offset)}
        )
      `;

      console.log("Trying geographic function query");

      const result = await client.query(functionCall);

      const posts = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        postType: row.post_type,
        priority: row.priority,
        isEmergency: row.is_emergency,
        isResolved: row.is_resolved,
        images: row.images || [],
        tags: row.tags || [],
        location:
          row.location_city && row.location_state
            ? `${row.location_city}, ${row.location_state}`
            : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        distanceMiles: parseFloat(row.distance_miles || 0),
        user: {
          id: row.user_id,
          firstName: row.author_first_name,
          lastName: row.author_last_name,
          profileImageUrl: row.author_profile_image,
        },
        commentCount: 0,
        reactionCount: 0,
        userHasLiked: false, // TODO: Add actual reaction status
      }));

      res.json({
        posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: posts.length,
        },
        location: {
          city: user.location_city,
          state: user.location_state,
          radiusMiles: user.location_radius_miles,
          cityOnly: user.show_city_only,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      message: "Server error fetching posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority,
          p.is_emergency, p.is_resolved, p.images, p.tags,
          p.location_city, p.location_state, p.expires_at, 
          p.created_at, p.updated_at, p.metadata,
          u.id as user_id, u.first_name, u.last_name, u.profile_image_url,
          ST_X(p.location::geometry) as longitude,
          ST_Y(p.location::geometry) as latitude
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      const row = result.rows[0];
      const post = {
        id: row.id,
        title: row.title,
        content: row.content,
        postType: row.post_type,
        priority: row.priority,
        isEmergency: row.is_emergency,
        isResolved: row.is_resolved,
        images: row.images || [],
        tags: row.tags || [],
        location:
          row.location_city && row.location_state
            ? `${row.location_city}, ${row.location_state}`
            : null,
        coordinates:
          row.longitude && row.latitude
            ? { longitude: row.longitude, latitude: row.latitude }
            : null,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata || {},
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        },
      };

      res.json(post);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error fetching post" });
  }
};

const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const {
      title: rawTitle,
      content,
      postType,
      priority = "normal",
      isEmergency = false,
      latitude,
      longitude,
      images = [],
      tags = [],
      expiresAt,
      metadata = {},
    } = req.body;

    const title =
      rawTitle || content.substring(0, 50) + (content.length > 50 ? "..." : "");

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        `SELECT 
          location_city,
          address_state as location_state,
          location_county,
          ST_X(location::geometry) as user_longitude,
          ST_Y(location::geometry) as user_latitude
        FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];

      const postLat = latitude || user.user_latitude;
      const postLng = longitude || user.user_longitude;
      const postCity = user.location_city;
      const postState = user.location_state;
      const postCounty = user.location_county;

      if (!postLat || !postLng) {
        return res.status(400).json({
          message: "Location required. Please complete your profile setup.",
        });
      }

      let locationQuery = "";
      let locationValue = null;
      const values = [
        userId,
        title,
        content,
        postType,
        priority,
        isEmergency,
        postCity,
        postState,
        postCounty,
        images,
        tags,
        expiresAt,
        metadata,
      ];

      if (postLat && postLng) {
        locationQuery = ", location";
        locationValue = `ST_SetSRID(ST_MakePoint(${postLng}, ${postLat}), 4326)`;
      }

      const insertQuery = `
        INSERT INTO posts (
          user_id, title, content, post_type, priority, is_emergency,
          location_city, location_state, location_county,
          images, tags, expires_at, metadata
          ${locationQuery}
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ${locationValue ? `, ${locationValue}` : ""}
        ) RETURNING id, created_at
      `;

      const result = await client.query(insertQuery, values);
      const newPost = result.rows[0];

      // TODO: Send real-time notification to nearby users
      if (req.io) {
        req.io.emit("new-post", {
          postId: newPost.id,
          city: postCity,
          state: postState,
          postType,
          isEmergency,
          userId,
        });
      }

      res.status(201).json({
        message: "Post created successfully",
        post: {
          id: newPost.id,
          createdAt: newPost.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error creating post" });
  }
};

const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title,
      content,
      priority,
      isResolved,
      latitude,
      longitude,
      images,
      tags,
      expiresAt,
      metadata,
    } = req.body;

    const client = await pool.connect();

    try {
      const postCheck = await client.query(
        "SELECT user_id FROM posts WHERE id = $1",
        [id]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this post" });
      }

      const updates = [];
      const values = [];
      let paramCount = 0;

      if (title !== undefined) {
        paramCount++;
        updates.push(`title = $${paramCount}`);
        values.push(title);
      }

      if (content !== undefined) {
        paramCount++;
        updates.push(`content = $${paramCount}`);
        values.push(content);
      }

      if (priority !== undefined) {
        paramCount++;
        updates.push(`priority = $${paramCount}`);
        values.push(priority);
      }

      if (isResolved !== undefined) {
        paramCount++;
        updates.push(`is_resolved = $${paramCount}`);
        values.push(isResolved);
      }

      if (images !== undefined) {
        paramCount++;
        updates.push(`images = $${paramCount}`);
        values.push(images);
      }

      if (tags !== undefined) {
        paramCount++;
        updates.push(`tags = $${paramCount}`);
        values.push(tags);
      }

      if (expiresAt !== undefined) {
        paramCount++;
        updates.push(`expires_at = $${paramCount}`);
        values.push(expiresAt);
      }

      if (metadata !== undefined) {
        paramCount++;
        updates.push(`metadata = $${paramCount}`);
        values.push(metadata);
      }

      if (latitude && longitude) {
        updates.push(
          `location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`
        );
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      updates.push("updated_at = NOW()");

      paramCount++;
      values.push(id);

      const updateQuery = `
        UPDATE posts 
        SET ${updates.join(", ")}
        WHERE id = $${paramCount}
        RETURNING updated_at
      `;

      const result = await client.query(updateQuery, values);

      res.json({
        message: "Post updated successfully",
        updatedAt: result.rows[0].updated_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Server error updating post" });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const postCheck = await client.query(
        "SELECT user_id FROM posts WHERE id = $1",
        [id]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this post" });
      }

      await client.query("DELETE FROM posts WHERE id = $1", [id]);

      res.json({
        message: "Post deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error deleting post" });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          c.id, c.content, c.parent_comment_id, c.images,
          c.created_at, c.updated_at,
          u.id as user_id, u.first_name, u.last_name, u.profile_image_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await client.query(query, [postId, limit, offset]);

      const comments = result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        parentCommentId: row.parent_comment_id,
        images: row.images || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        },
      }));

      res.json({ comments });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error fetching comments" });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { content, parentCommentId, images = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const client = await pool.connect();

    try {
      const postCheck = await client.query(
        "SELECT id FROM posts WHERE id = $1",
        [postId]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      const insertQuery = `
        INSERT INTO comments (post_id, user_id, content, parent_comment_id, images)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `;

      const result = await client.query(insertQuery, [
        postId,
        userId,
        content.trim(),
        parentCommentId || null,
        images,
      ]);

      res.status(201).json({
        message: "Comment created successfully",
        comment: {
          id: result.rows[0].id,
          createdAt: result.rows[0].created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Server error creating comment" });
  }
};

const addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { reactionType } = req.body;

    const validReactionTypes = [
      "like",
      "love",
      "helpful",
      "concerned",
      "angry",
    ];
    if (!validReactionTypes.includes(reactionType)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const client = await pool.connect();

    try {
      const existingReaction = await client.query(
        "SELECT id, reaction_type FROM reactions WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      if (existingReaction.rows.length > 0) {
        if (existingReaction.rows[0].reaction_type === reactionType) {
          await client.query(
            "DELETE FROM reactions WHERE user_id = $1 AND post_id = $2",
            [userId, postId]
          );
          console.log(
            `User ${userId} removed ${reactionType} from post ${postId}`
          );
          return res.json({
            message: "Reaction removed successfully",
            action: "removed",
          });
        } else {
          await client.query(
            "UPDATE reactions SET reaction_type = $1 WHERE user_id = $2 AND post_id = $3",
            [reactionType, userId, postId]
          );
          console.log(
            `User ${userId} changed reaction to ${reactionType} on post ${postId}`
          );
          return res.json({
            message: "Reaction updated successfully",
            action: "updated",
          });
        }
      } else {
        await client.query(
          "INSERT INTO reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)",
          [userId, postId, reactionType]
        );
        console.log(`User ${userId} added ${reactionType} to post ${postId}`);
        return res.json({
          message: "Reaction added successfully",
          action: "added",
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({ message: "Server error adding reaction" });
  }
};

const removeReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      await client.query(
        "DELETE FROM reactions WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      res.json({
        message: "Reaction removed successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({ message: "Server error removing reaction" });
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  addReaction,
  removeReaction,
};
