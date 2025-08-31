const { pool } = require("../config/database");
const {
  handleDatabaseError: _handleDatabaseError,
  handleNotFoundError: _handleNotFoundError,
  handleServerError: _handleServerError,
  createSuccessResponse: _createSuccessResponse,
} = require("../middleware/errorHandler");
const feedbackLogger = require("../utils/feedbackLogger");
const logger = require("../utils/logger");

exports.createFeedback = async (req, res) => {
  try {
    const {
      feedbackType,
      title,
      description,
      priority = "normal",
      appVersion,
      deviceInfo,
    } = req.body;

    const userId = req.user.userId;

    if (!feedbackType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: feedbackType, title, description",
      });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        INSERT INTO user_feedback (user_id, feedback_type, title, description, priority, app_version, device_info)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
      `,
        [userId, feedbackType, title, description, priority, appVersion, deviceInfo]
      );

      const feedbackRecord = result.rows[0];

      const _loggedFeedback = await feedbackLogger.logFeedback({
        userId,
        feedbackType,
        title,
        description,
        priority,
        appVersion,
        deviceInfo,
      });

      logger.info("Feedback received and logged:", {
        id: feedbackRecord.id,
        userId,
        feedbackType,
        title: title.substring(0, 50) + (title.length > 50 ? "..." : ""),
        priority,
        timestamp: feedbackRecord.created_at,
      });

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        data: {
          id: feedbackRecord.id,
          userId,
          feedbackType,
          title,
          description,
          priority,
          appVersion,
          deviceInfo,
          status: "new",
          createdAt: feedbackRecord.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error creating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status, feedbackType } = req.query;
    const offset = (page - 1) * limit;

    const client = await pool.connect();

    try {
      let whereClause = "WHERE user_id = $1";
      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (feedbackType) {
        paramCount++;
        whereClause += ` AND feedback_type = $${paramCount}`;
        params.push(feedbackType);
      }

      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM user_feedback ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const result = await client.query(
        `
        SELECT id, feedback_type, title, description, priority, status, 
               app_version, device_info, created_at, updated_at
        FROM user_feedback 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: {
          feedback: result.rows.map((row) => ({
            id: row.id,
            feedbackType: row.feedback_type,
            title: row.title,
            description: row.description,
            priority: row.priority,
            status: row.status,
            appVersion: row.app_version,
            deviceInfo: row.device_info,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error getting user feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, feedbackType, priority } = req.query;
    const offset = (page - 1) * limit;

    const client = await pool.connect();

    try {
      let whereClause = "WHERE 1=1";
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (feedbackType) {
        paramCount++;
        whereClause += ` AND feedback_type = $${paramCount}`;
        params.push(feedbackType);
      }

      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        params.push(priority);
      }

      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM user_feedback f ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const result = await client.query(
        `
        SELECT f.id, f.feedback_type, f.title, f.description, f.priority, f.status, 
               f.app_version, f.device_info, f.created_at, f.updated_at,
               u.id as user_id, u.first_name, u.last_name, u.email
        FROM user_feedback f
        JOIN users u ON f.user_id = u.id
        ${whereClause}
        ORDER BY 
          CASE f.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
          END,
          f.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: {
          feedback: result.rows.map((row) => ({
            id: row.id,
            feedbackType: row.feedback_type,
            title: row.title,
            description: row.description,
            priority: row.priority,
            status: row.status,
            appVersion: row.app_version,
            deviceInfo: row.device_info,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            user: {
              id: row.user_id,
              firstName: row.first_name,
              lastName: row.last_name,
              email: row.email,
            },
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user.userId;

    if (!status || !["new", "in_review", "addressed", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (new, in_review, addressed, closed)",
      });
    }

    const client = await pool.connect();

    try {
      const checkResult = await client.query(
        "SELECT id, status, user_id FROM user_feedback WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const currentFeedback = checkResult.rows[0];

      const updateResult = await client.query(
        `
        UPDATE user_feedback 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, updated_at
      `,
        [status, id]
      );

      const updatedFeedback = updateResult.rows[0];

      logger.info(
        `Feedback ${id} status updated from ${currentFeedback.status} to ${status} by admin ${adminUserId}`
      );

      res.json({
        success: true,
        message: "Feedback status updated successfully",
        data: {
          id: updatedFeedback.id,
          status: updatedFeedback.status,
          previousStatus: currentFeedback.status,
          updatedAt: updatedFeedback.updated_at,
          updatedBy: adminUserId,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error updating feedback status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.userId;

    const client = await pool.connect();

    try {
      const checkResult = await client.query(
        "SELECT id, title, user_id, feedback_type FROM user_feedback WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const feedback = checkResult.rows[0];

      await client.query("DELETE FROM user_feedback WHERE id = $1", [id]);

      logger.info(`Feedback ${id} (${feedback.title}) deleted by admin ${adminUserId}`);

      res.json({
        success: true,
        message: "Feedback deleted successfully",
        data: {
          deletedId: feedback.id,
          deletedTitle: feedback.title,
          deletedBy: adminUserId,
          deletedAt: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getFeedbackStats = async (_req, res) => {
  try {
    const client = await pool.connect();

    try {
      const totalResult = await client.query("SELECT COUNT(*) as total FROM user_feedback");
      const total = parseInt(totalResult.rows[0].total);

      const recentResult = await client.query(
        "SELECT COUNT(*) as recent FROM user_feedback WHERE created_at > NOW() - INTERVAL '7 days'"
      );
      const recent = parseInt(recentResult.rows[0].recent);

      const byTypeResult = await client.query(`
        SELECT feedback_type, COUNT(*) as count
        FROM user_feedback
        GROUP BY feedback_type
        ORDER BY count DESC
      `);

      const byStatusResult = await client.query(`
        SELECT status, COUNT(*) as count
        FROM user_feedback
        GROUP BY status
        ORDER BY 
          CASE status
            WHEN 'new' THEN 1
            WHEN 'in_review' THEN 2
            WHEN 'addressed' THEN 3
            WHEN 'closed' THEN 4
          END
      `);

      const byPriorityResult = await client.query(`
        SELECT priority, COUNT(*) as count
        FROM user_feedback
        GROUP BY priority
        ORDER BY 
          CASE priority
            WHEN 'high' THEN 1
            WHEN 'normal' THEN 2
            WHEN 'low' THEN 3
          END
      `);

      res.json({
        success: true,
        data: {
          total,
          recent,
          byType: byTypeResult.rows.map((row) => ({
            type: row.feedback_type,
            count: parseInt(row.count),
          })),
          byStatus: byStatusResult.rows.map((row) => ({
            status: row.status,
            count: parseInt(row.count),
          })),
          byPriority: byPriorityResult.rows.map((row) => ({
            priority: row.priority,
            count: parseInt(row.count),
          })),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
