// File: backend/src/routes/comments.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");

router.get(
  "/:commentId",
  auth,
  [param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const result = await client.query(
        `
        SELECT 
          c.id, c.content, c.parent_comment_id, c.images, c.is_edited,
          c.created_at, c.updated_at, c.post_id,
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
        WHERE c.id = $1 AND u.is_active = true
      `,
        [commentId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const row = result.rows[0];
      const comment = {
        id: row.id,
        content: row.content,
        parentCommentId: row.parent_comment_id,
        postId: row.post_id,
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
      };

      res.json({
        success: true,
        data: { comment },
      });
    } catch (error) {
      console.error("Get comment error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching comment",
        code: "COMMENT_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.put(
  "/:commentId",
  auth,
  [
    param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Comment content is required and must be under 500 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const commentCheck = await client.query(
        "SELECT id, user_id, post_id FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const comment = commentCheck.rows[0];

      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to edit this comment",
          code: "UNAUTHORIZED",
        });
      }

      const result = await client.query(
        `
        UPDATE comments 
        SET content = $1, updated_at = NOW(), is_edited = true
        WHERE id = $2
        RETURNING *
      `,
        [content.trim(), commentId]
      );

      const updatedComment = result.rows[0];

      res.json({
        success: true,
        message: "Comment updated successfully",
        data: {
          comment: {
            id: updatedComment.id,
            content: updatedComment.content,
            parentCommentId: updatedComment.parent_comment_id,
            postId: updatedComment.post_id,
            images: updatedComment.images || [],
            isEdited: updatedComment.is_edited,
            createdAt: updatedComment.created_at,
            updatedAt: updatedComment.updated_at,
          },
        },
      });
    } catch (error) {
      console.error("Update comment error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating comment",
        code: "COMMENT_UPDATE_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:commentId",
  auth,
  [param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const commentCheck = await client.query(
        "SELECT id, user_id, post_id FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const comment = commentCheck.rows[0];

      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this comment",
          code: "UNAUTHORIZED",
        });
      }

      await client.query("DELETE FROM comments WHERE id = $1", [commentId]);

      res.json({
        success: true,
        message: "Comment deleted successfully",
        data: {
          commentId: parseInt(commentId),
          postId: comment.post_id,
        },
      });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting comment",
        code: "COMMENT_DELETE_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:commentId/replies",
  auth,
  [
    param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be non-negative"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.userId;

      const parentCheck = await client.query("SELECT id FROM comments WHERE id = $1", [commentId]);

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const result = await client.query(
        `
        SELECT 
          c.id, c.content, c.parent_comment_id, c.images, c.is_edited,
          c.created_at, c.updated_at, c.post_id,
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
        WHERE c.parent_comment_id = $1 AND u.is_active = true
        ORDER BY c.created_at ASC
        LIMIT $3 OFFSET $4
      `,
        [commentId, userId, limit, offset]
      );

      const replies = result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        parentCommentId: row.parent_comment_id,
        postId: row.post_id,
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
        data: {
          replies,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            count: replies.length,
          },
        },
      });
    } catch (error) {
      console.error("Get comment replies error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching comment replies",
        code: "REPLIES_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:commentId/reactions",
  auth,
  [
    param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required"),
    body("reactionType")
      .isIn(["like", "love", "helpful", "concerned", "angry"])
      .withMessage("Invalid reaction type"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const { reactionType } = req.body;
      const userId = req.user.userId;

      const commentCheck = await client.query("SELECT id, post_id FROM comments WHERE id = $1", [
        commentId,
      ]);

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const existingReaction = await client.query(
        "SELECT id, reaction_type FROM reactions WHERE comment_id = $1 AND user_id = $2",
        [commentId, userId]
      );

      if (existingReaction.rows.length > 0) {
        await client.query(
          "UPDATE reactions SET reaction_type = $1, created_at = NOW() WHERE comment_id = $2 AND user_id = $3",
          [reactionType, commentId, userId]
        );
      } else {
        await client.query(
          "INSERT INTO reactions (comment_id, user_id, reaction_type) VALUES ($1, $2, $3)",
          [commentId, userId, reactionType]
        );
      }

      const countsResult = await client.query(
        `
        SELECT 
          COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
          COUNT(*) as total_count
        FROM reactions 
        WHERE comment_id = $1
      `,
        [commentId]
      );

      const counts = countsResult.rows[0];

      res.json({
        success: true,
        message: "Reaction added successfully",
        data: {
          commentId: parseInt(commentId),
          reactionType,
          likeCount: parseInt(counts.like_count),
          totalReactions: parseInt(counts.total_count),
          userHasLiked: reactionType === "like",
        },
      });
    } catch (error) {
      console.error("Add comment reaction error:", error);
      res.status(500).json({
        success: false,
        message: "Error adding reaction",
        code: "REACTION_ADD_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:commentId/reactions",
  auth,
  [param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const commentCheck = await client.query("SELECT id FROM comments WHERE id = $1", [commentId]);

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const result = await client.query(
        "DELETE FROM reactions WHERE comment_id = $1 AND user_id = $2 RETURNING reaction_type",
        [commentId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No reaction found to remove",
          code: "REACTION_NOT_FOUND",
        });
      }

      const countsResult = await client.query(
        `
        SELECT 
          COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
          COUNT(*) as total_count
        FROM reactions 
        WHERE comment_id = $1
      `,
        [commentId]
      );

      const counts = countsResult.rows[0];

      res.json({
        success: true,
        message: "Reaction removed successfully",
        data: {
          commentId: parseInt(commentId),
          likeCount: parseInt(counts.like_count),
          totalReactions: parseInt(counts.total_count),
          userHasLiked: false,
        },
      });
    } catch (error) {
      console.error("Remove comment reaction error:", error);
      res.status(500).json({
        success: false,
        message: "Error removing reaction",
        code: "REACTION_REMOVE_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:commentId/report",
  auth,
  [
    param("commentId").isInt({ min: 1 }).withMessage("Valid comment ID is required"),
    body("reason")
      .isIn(["spam", "harassment", "inappropriate", "misinformation", "other"])
      .withMessage("Invalid report reason"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be under 500 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { commentId } = req.params;
      const { reason } = req.body;
      const userId = req.user.userId;

      const commentCheck = await client.query("SELECT id, user_id FROM comments WHERE id = $1", [
        commentId,
      ]);

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        });
      }

      const comment = commentCheck.rows[0];

      if (comment.user_id === userId) {
        return res.status(400).json({
          success: false,
          message: "Cannot report your own comment",
          code: "SELF_REPORT_ERROR",
        });
      }

      const existingReport = await client.query(
        "SELECT id FROM comment_reports WHERE comment_id = $1 AND reported_by = $2",
        [commentId, userId]
      );

      if (existingReport.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already reported this comment",
          code: "ALREADY_REPORTED",
        });
      }

      const reportResult = await client.query(
        "INSERT INTO comment_reports (comment_id, reported_by, report_reason, report_description) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
        [commentId, userId, reason, req.body.description || null]
      );

      res.status(201).json({
        success: true,
        message: "Comment reported successfully",
        data: {
          reportId: reportResult.rows[0].id,
          commentId: parseInt(commentId),
          reason,
          description: req.body.description || null,
          createdAt: reportResult.rows[0].created_at,
        },
      });
    } catch (error) {
      console.error("Report comment error:", error);
      res.status(500).json({
        success: false,
        message: "Error reporting comment",
        code: "COMMENT_REPORT_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/test/status", async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(*) FILTER (WHERE parent_comment_id IS NULL) as top_level_comments,
          COUNT(*) FILTER (WHERE parent_comment_id IS NOT NULL) as replies
        FROM comments
      `);

      res.json({
        success: true,
        message: "Comments routes are working!",
        data: {
          ...result.rows[0],
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Comments test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Comments routes test failed",
      error: error.message,
    });
  }
});

module.exports = router;
