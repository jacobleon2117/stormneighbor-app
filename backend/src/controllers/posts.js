const { pool } = require("../config/database");
const {
  handleDatabaseError: _handleDatabaseError,
  handleNotFoundError: _handleNotFoundError,
  handleServerError,
  createSuccessResponse,
} = require("../middleware/errorHandler");

const getPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0, postType, priority, city, state } = req.query;

    const client = await req.getDbClient();

    try {
      let userCity = city;
      let userState = state;

      if (!userCity || !userState) {
        const userResult = await client.query(
          "SELECT home_city, home_state, location_city, address_state FROM users WHERE id = $1",
          [req.user.userId]
        );

        if (userResult.rows.length > 0) {
          userCity = userCity || userResult.rows[0].home_city || userResult.rows[0].location_city;
          userState = userState || userResult.rows[0].home_state || userResult.rows[0].address_state;
        }
      }

      let query = `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority, p.is_emergency,
          p.location_city, p.location_state, p.images, p.tags, p.is_resolved,
          p.created_at, p.updated_at,
          u.id as user_id, u.first_name, u.last_name, u.profile_image_url,
          COALESCE(comment_counts.comment_count, 0) as comment_count,
          COALESCE(reaction_counts.like_count, 0) as like_count,
          COALESCE(reaction_counts.total_count, 0) as total_reactions,
          CASE WHEN user_reactions.reaction_type IS NOT NULL THEN true ELSE false END as user_has_liked,
          user_reactions.reaction_type as user_reaction_type
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comment_count
          FROM comments 
          GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        LEFT JOIN (
          SELECT 
            post_id,
            COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
            COUNT(*) as total_count
          FROM reactions 
          WHERE post_id IS NOT NULL
          GROUP BY post_id
        ) reaction_counts ON p.id = reaction_counts.post_id
        LEFT JOIN reactions user_reactions ON p.id = user_reactions.post_id AND user_reactions.user_id = $1
        WHERE u.is_active = true
      `;

      const params = [req.user.userId];
      let paramIndex = 2;

      if (userCity && userState) {
        query += ` AND p.location_city = $${paramIndex} AND p.location_state = $${paramIndex + 1}`;
        params.push(userCity, userState);
        paramIndex += 2;
      }

      if (postType) {
        query += ` AND p.post_type = $${paramIndex}`;
        params.push(postType);
        paramIndex++;
      }

      if (priority) {
        query += ` AND p.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      query += ` 
        ORDER BY 
          p.created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const posts = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        postType: row.post_type,
        priority: row.priority,
        isEmergency: row.is_emergency,
        location: {
          city: row.location_city,
          state: row.location_state,
        },
        images: row.images || [],
        tags: row.tags || [],
        isResolved: row.is_resolved,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        commentCount: parseInt(row.comment_count),
        likeCount: parseInt(row.like_count),
        totalReactions: parseInt(row.total_count),
        userHasLiked: row.user_has_liked,
        userReactionType: row.user_reaction_type,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        },
      }));

      res.json(
        createSuccessResponse("Posts retrieved successfully", {
          posts,
          location: userCity && userState ? { city: userCity, state: userState } : null,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            count: posts.length,
          },
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    return handleServerError(error, req, res, "fetching posts");
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority, p.is_emergency,
          p.location_city, p.location_state, p.images, p.tags, p.is_resolved,
          p.created_at, p.updated_at,
          u.id as user_id, u.first_name, u.last_name, u.profile_image_url,
          COALESCE(comment_counts.comment_count, 0) as comment_count,
          COALESCE(reaction_counts.like_count, 0) as like_count,
          COALESCE(reaction_counts.total_count, 0) as total_reactions,
          CASE WHEN user_reactions.reaction_type IS NOT NULL THEN true ELSE false END as user_has_liked,
          user_reactions.reaction_type as user_reaction_type
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comment_count
          FROM comments 
          GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        LEFT JOIN (
          SELECT 
            post_id,
            COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
            COUNT(*) as total_count
          FROM reactions 
          WHERE post_id IS NOT NULL
          GROUP BY post_id
        ) reaction_counts ON p.id = reaction_counts.post_id
        LEFT JOIN reactions user_reactions ON p.id = user_reactions.post_id AND user_reactions.user_id = $2
        WHERE p.id = $1 AND u.is_active = true
      `;

      const result = await client.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const row = result.rows[0];
      const post = {
        id: row.id,
        title: row.title,
        content: row.content,
        postType: row.post_type,
        priority: row.priority,
        isEmergency: row.is_emergency,
        location: {
          city: row.location_city,
          state: row.location_state,
        },
        images: row.images || [],
        tags: row.tags || [],
        isResolved: row.is_resolved,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        commentCount: parseInt(row.comment_count),
        likeCount: parseInt(row.like_count),
        totalReactions: parseInt(row.total_count),
        userHasLiked: row.user_has_liked,
        userReactionType: row.user_reaction_type,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        },
      };

      res.json({
        success: true,
        message: "Post retrieved successfully",
        data: { post },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      content,
      postType,
      priority = "normal",
      isEmergency = false,
      images = [],
      tags = [],
    } = req.body;

    console.log("Create post request body:", req.body);

    if (!content || !content.trim()) {
      console.log("Content validation failed:", content);
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    if (!postType) {
      console.log("PostType validation failed:", postType);
      return res.status(400).json({
        success: false,
        message: "Post type is required",
      });
    }

    const client = await pool.connect();

    try {
      const userQuery = await client.query(
        "SELECT location_city, address_state FROM users WHERE id = $1",
        [userId]
      );

      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = userQuery.rows[0];
      console.log("User location data:", user);
      if (!user.location_city || !user.address_state) {
        console.log("Missing location data - location_city:", user.location_city, "address_state:", user.address_state);
        return res.status(400).json({
          success: false,
          message: "Please complete your profile with city and state information to create posts",
        });
      }

      const query = `
        INSERT INTO posts (
          user_id, title, content, post_type, priority, is_emergency,
          location_city, location_state, images, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING *
      `;

      const result = await client.query(query, [
        userId,
        title || null,
        content,
        postType,
        priority,
        isEmergency,
        user.location_city,
        user.address_state,
        Array.isArray(images) && images.length > 0 ? images : null,
        Array.isArray(tags) && tags.length > 0 ? tags : null,
      ]);

      const newPost = result.rows[0];

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: {
          post: {
            id: newPost.id,
            title: newPost.title,
            content: newPost.content,
            postType: newPost.post_type,
            priority: newPost.priority,
            isEmergency: newPost.is_emergency,
            location: {
              city: newPost.location_city,
              state: newPost.location_state,
            },
            images: newPost.images || [],
            tags: newPost.tags || [],
            createdAt: newPost.created_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create post error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    
    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid post data - check constraint violation",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error creating post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const client = await pool.connect();

    try {
      const postCheck = await client.query("SELECT user_id FROM posts WHERE id = $1", [id]);

      if (postCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this post",
        });
      }

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      const allowedFields = ["title", "content", "priority", "is_resolved", "images", "tags"];

      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      updateFields.push("updated_at = NOW()");
      values.push(id);

      const query = `
        UPDATE posts 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedPost = result.rows[0];

      res.json({
        success: true,
        message: "Post updated successfully",
        data: {
          post: {
            id: updatedPost.id,
            title: updatedPost.title,
            content: updatedPost.content,
            postType: updatedPost.post_type,
            priority: updatedPost.priority,
            isResolved: updatedPost.is_resolved,
            location: {
              city: updatedPost.location_city,
              state: updatedPost.location_state,
            },
            images: updatedPost.images || [],
            tags: updatedPost.tags || [],
            updatedAt: updatedPost.updated_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const postCheck = await client.query("SELECT user_id FROM posts WHERE id = $1", [id]);

      if (postCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this post",
        });
      }

      await client.query("DELETE FROM posts WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          c.id, c.content, c.parent_comment_id, c.images, c.is_edited,
          c.created_at, c.updated_at,
          u.id as user_id, u.first_name, u.last_name, u.profile_image_url,
          COALESCE(reaction_counts.like_count, 0) as like_count,
          COALESCE(reaction_counts.total_count, 0) as total_reactions,
          CASE WHEN user_reactions.reaction_type IS NOT NULL THEN true ELSE false END as user_has_liked,
          user_reactions.reaction_type as user_reaction_type
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN (
          SELECT 
            comment_id,
            COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
            COUNT(*) as total_count
          FROM reactions 
          WHERE comment_id IS NOT NULL
          GROUP BY comment_id
        ) reaction_counts ON c.id = reaction_counts.comment_id
        LEFT JOIN reactions user_reactions ON c.id = user_reactions.comment_id AND user_reactions.user_id = $2
        WHERE c.post_id = $1 AND u.is_active = true
        ORDER BY c.created_at ASC
        LIMIT $3 OFFSET $4
      `;

      const result = await client.query(query, [postId, userId, limit, offset]);

      const comments = result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        parentCommentId: row.parent_comment_id,
        images: row.images || [],
        isEdited: row.is_edited,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        likeCount: parseInt(row.like_count),
        totalReactions: parseInt(row.total_count),
        userHasLiked: row.user_has_liked,
        userReactionType: row.user_reaction_type,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        },
      }));

      res.json({
        success: true,
        message: "Comments retrieved successfully",
        data: {
          comments,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            count: comments.length,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const client = await pool.connect();

    try {
      const postCheck = await client.query("SELECT id FROM posts WHERE id = $1", [postId]);
      if (postCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const query = `
        INSERT INTO comments (post_id, user_id, content, parent_comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(query, [
        parseInt(postId),
        userId,
        content.trim(),
        parentCommentId ? parseInt(parentCommentId) : null,
      ]);

      const newComment = result.rows[0];

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: {
          comment: {
            id: newComment.id,
            content: newComment.content,
            parentCommentId: newComment.parent_comment_id,
            images: [],
            isEdited: false,
            createdAt: newComment.created_at,
            likeCount: 0,
            userHasLiked: false,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT user_id FROM comments WHERE id = $1 AND post_id = $2",
        [commentId, postId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this comment",
        });
      }

      const updateQuery = `
        UPDATE comments 
        SET content = $1, is_edited = TRUE, updated_at = NOW()
        WHERE id = $2 AND post_id = $3
        RETURNING updated_at
      `;

      const result = await client.query(updateQuery, [content.trim(), commentId, postId]);

      res.json({
        success: true,
        message: "Comment updated successfully",
        data: {
          updatedAt: result.rows[0].updated_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT user_id FROM comments WHERE id = $1 AND post_id = $2",
        [commentId, postId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this comment",
        });
      }

      await client.query("DELETE FROM comments WHERE id = $1", [commentId]);

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { reactionType } = req.body;

    const validReactionTypes = ["like", "love", "helpful", "concerned", "angry"];
    if (!validReactionTypes.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type",
      });
    }

    const client = await pool.connect();

    try {
      const existingReaction = await client.query(
        "SELECT id, reaction_type FROM reactions WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      if (existingReaction.rows.length > 0) {
        if (existingReaction.rows[0].reaction_type === reactionType) {
          await client.query("DELETE FROM reactions WHERE user_id = $1 AND post_id = $2", [
            userId,
            postId,
          ]);
          return res.json({
            success: true,
            message: "Reaction removed successfully",
            data: { action: "removed" },
          });
        } else {
          await client.query(
            "UPDATE reactions SET reaction_type = $1 WHERE user_id = $2 AND post_id = $3",
            [reactionType, userId, postId]
          );
          return res.json({
            success: true,
            message: "Reaction updated successfully",
            data: { action: "updated" },
          });
        }
      } else {
        await client.query(
          "INSERT INTO reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)",
          [userId, postId, reactionType]
        );
        return res.json({
          success: true,
          message: "Reaction added successfully",
          data: { action: "added" },
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reaction",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const removeReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      await client.query("DELETE FROM reactions WHERE user_id = $1 AND post_id = $2", [
        userId,
        postId,
      ]);

      res.json({
        success: true,
        message: "Reaction removed successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing reaction",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    const { reactionType } = req.body;

    const validReactionTypes = ["like", "love", "helpful", "concerned", "angry"];
    if (!validReactionTypes.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type",
      });
    }

    const client = await pool.connect();

    try {
      const commentCheck = await client.query("SELECT id FROM comments WHERE id = $1", [commentId]);

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const existingReaction = await client.query(
        "SELECT id, reaction_type FROM reactions WHERE user_id = $1 AND comment_id = $2",
        [userId, commentId]
      );

      if (existingReaction.rows.length > 0) {
        if (existingReaction.rows[0].reaction_type === reactionType) {
          await client.query("DELETE FROM reactions WHERE user_id = $1 AND comment_id = $2", [
            userId,
            commentId,
          ]);
          return res.json({
            success: true,
            message: "Reaction removed successfully",
            data: { action: "removed" },
          });
        } else {
          await client.query(
            "UPDATE reactions SET reaction_type = $1 WHERE user_id = $2 AND comment_id = $3",
            [reactionType, userId, commentId]
          );
          return res.json({
            success: true,
            message: "Reaction updated successfully",
            data: { action: "updated" },
          });
        }
      } else {
        await client.query(
          "INSERT INTO reactions (user_id, comment_id, reaction_type) VALUES ($1, $2, $3)",
          [userId, commentId, reactionType]
        );
        return res.json({
          success: true,
          message: "Reaction added successfully",
          data: { action: "added" },
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Add comment reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reaction",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const removeCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      await client.query("DELETE FROM reactions WHERE user_id = $1 AND comment_id = $2", [
        userId,
        commentId,
      ]);

      res.json({
        success: true,
        message: "Reaction removed successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove comment reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing reaction",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  addCommentReaction,
  removeCommentReaction,
};
