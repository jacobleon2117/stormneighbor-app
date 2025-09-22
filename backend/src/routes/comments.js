const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

async function getComment(client, commentId) {
  const result = await client.query("SELECT * FROM comments WHERE id = $1", [commentId]);
  return result.rows[0] || null;
}

async function getReactionCounts(client, commentId) {
  const result = await client.query(
    `SELECT 
      COUNT(*) FILTER (WHERE reaction_type='like') AS like_count,
      COUNT(*) AS total_count
     FROM reactions WHERE comment_id=$1`,
    [commentId]
  );
  return result.rows[0] || { like_count: 0, total_count: 0 };
}

async function getCommentWithUserAndReactions(client, commentId, userId) {
  const result = await client.query(
    `
    SELECT c.*, u.id AS user_id, u.first_name, u.last_name, u.profile_image_url,
      COALESCE(reaction_counts.like_count, 0) AS like_count,
      COALESCE(reaction_counts.total_count, 0) AS total_reactions,
      CASE WHEN user_reactions.reaction_type IS NOT NULL THEN true ELSE false END AS user_has_liked,
      user_reactions.reaction_type AS user_reaction_type
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN (
      SELECT comment_id,
             COUNT(*) FILTER (WHERE reaction_type='like') AS like_count,
             COUNT(*) AS total_count
      FROM reactions
      GROUP BY comment_id
    ) reaction_counts ON c.id = reaction_counts.comment_id
    LEFT JOIN reactions user_reactions
      ON c.id=user_reactions.comment_id AND user_reactions.user_id=$2
    WHERE c.id=$1 AND u.is_active=true
  `,
    [commentId, userId]
  );
  return result.rows[0] || null;
}

function formatCommentRow(row) {
  return {
    id: row.id,
    content: row.content,
    parentCommentId: row.parent_comment_id,
    postId: row.post_id,
    images: row.images || [],
    isEdited: row.is_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: parseInt(row.like_count),
    totalReactions: parseInt(row.total_reactions),
    userHasLiked: row.user_has_liked,
    userReactionType: row.user_reaction_type,
    user: row.user_id
      ? {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
        }
      : undefined,
  };
}

router.get(
  "/:commentId",
  auth,
  [param("commentId").isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;
      const row = await getCommentWithUserAndReactions(client, commentId, userId);

      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });
      res.json({ success: true, data: { comment: formatCommentRow(row) } });
    } catch (error) {
      logger.error("Get comment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching comment", code: "COMMENT_FETCH_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.put(
  "/:commentId",
  auth,
  [param("commentId").isInt({ min: 1 }), body("content").trim().isLength({ min: 1, max: 500 })],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const comment = await getComment(client, commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });
      if (comment.user_id !== userId)
        return res
          .status(403)
          .json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });

      const result = await client.query(
        "UPDATE comments SET content=$1, updated_at=NOW(), is_edited=true WHERE id=$2 RETURNING *",
        [content.trim(), commentId]
      );

      res.json({
        success: true,
        message: "Comment updated successfully",
        data: { comment: result.rows[0] },
      });
    } catch (error) {
      logger.error("Update comment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error updating comment", code: "COMMENT_UPDATE_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:commentId",
  auth,
  [param("commentId").isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const comment = await getComment(client, commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });
      if (comment.user_id !== userId)
        return res
          .status(403)
          .json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });

      await client.query("DELETE FROM comments WHERE id=$1", [commentId]);
      res.json({
        success: true,
        message: "Comment deleted successfully",
        data: { commentId: parseInt(commentId), postId: comment.post_id },
      });
    } catch (error) {
      logger.error("Delete comment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting comment", code: "COMMENT_DELETE_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/:commentId/replies",
  auth,
  [
    param("commentId").isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const userId = req.user.userId;

      const parent = await getComment(client, commentId);
      if (!parent)
        return res
          .status(404)
          .json({ success: false, message: "Parent comment not found", code: "COMMENT_NOT_FOUND" });

      const result = await client.query(
        `
        SELECT c.*, u.id AS user_id, u.first_name, u.last_name, u.profile_image_url,
          COALESCE(reaction_counts.like_count,0) AS like_count,
          COALESCE(reaction_counts.total_count,0) AS total_reactions,
          CASE WHEN user_reactions.reaction_type IS NOT NULL THEN true ELSE false END AS user_has_liked,
          user_reactions.reaction_type AS user_reaction_type
        FROM comments c
        JOIN users u ON c.user_id=u.id
        LEFT JOIN (
          SELECT comment_id,
                 COUNT(*) FILTER (WHERE reaction_type='like') AS like_count,
                 COUNT(*) AS total_count
          FROM reactions
          GROUP BY comment_id
        ) reaction_counts ON c.id=reaction_counts.comment_id
        LEFT JOIN reactions user_reactions
          ON c.id=user_reactions.comment_id AND user_reactions.user_id=$2
        WHERE c.parent_comment_id=$1 AND u.is_active=true
        ORDER BY c.created_at ASC
        LIMIT $3 OFFSET $4
        `,
        [commentId, userId, limit, offset]
      );

      res.json({
        success: true,
        data: {
          replies: result.rows.map(formatCommentRow),
          pagination: { limit, offset, count: result.rows.length },
        },
      });
    } catch (error) {
      logger.error("Get replies error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching replies", code: "REPLIES_FETCH_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:commentId/reactions",
  auth,
  [
    param("commentId").isInt({ min: 1 }),
    body("reactionType").isIn(["like", "love", "helpful", "concerned", "angry"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const { reactionType } = req.body;
      const userId = req.user.userId;

      const comment = await getComment(client, commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });

      const existing = await client.query(
        "SELECT id FROM reactions WHERE comment_id=$1 AND user_id=$2",
        [commentId, userId]
      );
      if (existing.rows.length) {
        await client.query(
          "UPDATE reactions SET reaction_type=$1, created_at=NOW() WHERE comment_id=$2 AND user_id=$3",
          [reactionType, commentId, userId]
        );
      } else {
        await client.query(
          "INSERT INTO reactions (comment_id,user_id,reaction_type) VALUES($1,$2,$3)",
          [commentId, userId, reactionType]
        );
      }

      const counts = await getReactionCounts(client, commentId);
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
      logger.error("Add reaction error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error adding reaction", code: "REACTION_ADD_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:commentId/reactions",
  auth,
  [param("commentId").isInt({ min: 1 })],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const comment = await getComment(client, commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });

      const result = await client.query(
        "DELETE FROM reactions WHERE comment_id=$1 AND user_id=$2 RETURNING reaction_type",
        [commentId, userId]
      );
      if (!result.rows.length)
        return res.status(404).json({
          success: false,
          message: "No reaction found to remove",
          code: "REACTION_NOT_FOUND",
        });

      const counts = await getReactionCounts(client, commentId);
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
      logger.error("Remove reaction error:", error);
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
    param("commentId").isInt({ min: 1 }),
    body("reason").isIn(["spam", "harassment", "inappropriate", "misinformation", "other"]),
    body("description").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { commentId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user.userId;

      const comment = await getComment(client, commentId);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Comment not found", code: "COMMENT_NOT_FOUND" });
      if (comment.user_id === userId)
        return res.status(400).json({
          success: false,
          message: "Cannot report your own comment",
          code: "SELF_REPORT_ERROR",
        });

      const existing = await client.query(
        "SELECT id FROM comment_reports WHERE comment_id=$1 AND reported_by=$2",
        [commentId, userId]
      );
      if (existing.rows.length)
        return res
          .status(400)
          .json({ success: false, message: "Already reported", code: "ALREADY_REPORTED" });

      const result = await client.query(
        "INSERT INTO comment_reports (comment_id, reported_by, report_reason, report_description) VALUES($1,$2,$3,$4) RETURNING id, created_at",
        [commentId, userId, reason, description || null]
      );

      res.status(201).json({
        success: true,
        message: "Comment reported successfully",
        data: {
          reportId: result.rows[0].id,
          commentId: parseInt(commentId),
          reason,
          description: description || null,
          createdAt: result.rows[0].created_at,
        },
      });
    } catch (error) {
      logger.error("Report comment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error reporting comment", code: "COMMENT_REPORT_ERROR" });
    } finally {
      client.release();
    }
  }
);

router.get("/test/status", async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) AS total_comments,
        COUNT(*) FILTER (WHERE parent_comment_id IS NULL) AS top_level_comments,
        COUNT(*) FILTER (WHERE parent_comment_id IS NOT NULL) AS replies
      FROM comments
    `);
    res.json({
      success: true,
      message: "Comments routes are working!",
      data: { ...result.rows[0], timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error("Comments test endpoint error:", error);
    res
      .status(500)
      .json({ success: false, message: "Comments routes test failed", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
