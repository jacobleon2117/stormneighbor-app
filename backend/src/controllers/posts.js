// File: backend/src/controllers/posts.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
const getPosts = async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      postType,
      priority,
      latitude,
      longitude,
      radius = 10,
    } = req.query;

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          p.id, p.title, p.content, p.post_type, p.priority, p.is_emergency,
          p.latitude, p.longitude, p.images, p.tags, p.is_resolved,
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
        WHERE 1=1
      `;

      const params = [req.user.userId];
      let paramIndex = 2;

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

      if (latitude && longitude) {
        query += ` AND (
          6371 * acos(
            cos(radians($${paramIndex})) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($${paramIndex + 1})) +
            sin(radians($${paramIndex})) * sin(radians(p.latitude))
          )
        ) <= $${paramIndex + 2}`;
        params.push(latitude, longitude, radius);
        paramIndex += 3;
      }

      query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const posts = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        postType: row.post_type,
        priority: row.priority,
        isEmergency: row.is_emergency,
        latitude: row.latitude,
        longitude: row.longitude,
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

      res.json({ posts });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Server error fetching posts" });
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
          p.latitude, p.longitude, p.images, p.tags, p.is_resolved,
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
        WHERE p.id = $1
      `;

      const result = await client.query(query, [id, userId]);

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
        latitude: row.latitude,
        longitude: row.longitude,
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

      res.json({ post });
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
    const userId = req.user.userId;
    const {
      title,
      content,
      postType,
      priority = "normal",
      isEmergency = false,
      latitude,
      longitude,
      images = [],
      tags = [],
    } = req.body;

    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO posts (
          user_id, title, content, post_type, priority, is_emergency,
          latitude, longitude, images, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const imagesArray = Array.isArray(images) ? images : [];
      const tagsArray = Array.isArray(tags) ? tags : [];

      const values = [
        userId,
        title,
        content,
        postType,
        priority,
        isEmergency,
        latitude,
        longitude,
        imagesArray.length > 0 ? imagesArray : null,
        tagsArray.length > 0 ? tagsArray : null,
      ];

      const result = await client.query(query, values);
      const newPost = result.rows[0];

      res.status(201).json({
        message: "Post created successfully",
        post: {
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          postType: newPost.post_type,
          priority: newPost.priority,
          isEmergency: newPost.is_emergency,
          latitude: newPost.latitude,
          longitude: newPost.longitude,
          images: newPost.images || [],
          tags: newPost.tags || [],
          createdAt: newPost.created_at,
          commentCount: 0,
          likeCount: 0,
          userHasLiked: false,
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
    const { id } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

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

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      updateFields.push(`updated_at = NOW()`);
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
        message: "Post updated successfully",
        post: updatedPost,
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

      res.json({ message: "Post deleted successfully" });
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
        WHERE c.post_id = $1
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
    const { content, parentCommentId } = req.body;

    console.log("Creating comment:", {
      postId,
      userId,
      content,
      parentCommentId,
    });

    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO comments (post_id, user_id, content, parent_comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(query, [
        parseInt(postId),
        userId,
        content?.trim() || "",
        parentCommentId ? parseInt(parentCommentId) : null,
      ]);

      const newComment = result.rows[0];

      console.log("Comment created successfully:", newComment.id);

      res.status(201).json({
        message: "Comment created successfully",
        comment: {
          id: newComment.id,
          content: newComment.content,
          parentCommentId: newComment.parent_comment_id,
          images: [],
          createdAt: newComment.created_at,
          likeCount: 0,
          userHasLiked: false,
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
const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT user_id FROM comments WHERE id = $1 AND post_id = $2",
        [commentId, postId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this comment" });
      }

      const updateQuery = `
        UPDATE comments 
        SET content = $1, is_edited = TRUE, updated_at = NOW()
        WHERE id = $2 AND post_id = $3
        RETURNING updated_at
      `;

      const result = await client.query(updateQuery, [
        content.trim(),
        commentId,
        postId,
      ]);

      res.json({
        message: "Comment updated successfully",
        updatedAt: result.rows[0].updated_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Server error updating comment" });
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
        return res.status(404).json({ message: "Comment not found" });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
      }

      await client.query("DELETE FROM comments WHERE id = $1", [commentId]);

      res.json({ message: "Comment deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error deleting comment" });
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
          return res.json({
            message: "Reaction removed successfully",
            action: "removed",
          });
        } else {
          await client.query(
            "UPDATE reactions SET reaction_type = $1 WHERE user_id = $2 AND post_id = $3",
            [reactionType, userId, postId]
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

      res.json({ message: "Reaction removed successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({ message: "Server error removing reaction" });
  }
};
const addCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
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
      const commentCheck = await client.query(
        "SELECT id FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const existingReaction = await client.query(
        "SELECT id, reaction_type FROM reactions WHERE user_id = $1 AND comment_id = $2",
        [userId, commentId]
      );

      if (existingReaction.rows.length > 0) {
        if (existingReaction.rows[0].reaction_type === reactionType) {
          await client.query(
            "DELETE FROM reactions WHERE user_id = $1 AND comment_id = $2",
            [userId, commentId]
          );
          return res.json({
            message: "Reaction removed successfully",
            action: "removed",
          });
        } else {
          await client.query(
            "UPDATE reactions SET reaction_type = $1 WHERE user_id = $2 AND comment_id = $3",
            [reactionType, userId, commentId]
          );
          return res.json({
            message: "Reaction updated successfully",
            action: "updated",
          });
        }
      } else {
        await client.query(
          "INSERT INTO reactions (user_id, comment_id, reaction_type) VALUES ($1, $2, $3)",
          [userId, commentId, reactionType]
        );
        return res.json({
          message: "Reaction added successfully",
          action: "added",
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Add comment reaction error:", error);
    res.status(500).json({ message: "Server error adding reaction" });
  }
};
const removeCommentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      await client.query(
        "DELETE FROM reactions WHERE user_id = $1 AND comment_id = $2",
        [userId, commentId]
      );

      res.json({ message: "Reaction removed successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Remove comment reaction error:", error);
    res.status(500).json({ message: "Server error removing reaction" });
  }
};
const reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;

    const validReasons = ["inappropriate", "spam", "harassment", "other"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid report reason" });
    }

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT id FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      await client.query(
        `INSERT INTO comment_reports (comment_id, reporter_id, reason) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (comment_id, reporter_id) DO NOTHING`,
        [commentId, userId, reason]
      );

      res.json({ message: "Report submitted successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Report comment error:", error);
    res.status(500).json({ message: "Server error submitting report" });
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
  reportComment,
};
