// File: backend/src/controllers/reportsController.js
const { pool: _pool } = require("../config/database");
const {
  handleDatabaseError,
  handleNotFoundError,
  createSuccessResponse,
} = require("../middleware/errorHandler");

const getReports = async (req, res) => {
  try {
    const { status = "pending", limit = 50, offset = 0, type } = req.query;

    const client = await req.getDbClient();

    try {
      let query = `
        SELECT 
          'post' as report_type,
          pr.id,
          pr.post_id as content_id,
          pr.reported_by,
          pr.report_reason,
          pr.report_description,
          pr.status,
          pr.reviewed_by,
          pr.reviewed_at,
          pr.created_at,
          u.first_name || ' ' || u.last_name as reporter_name,
          u.email as reporter_email,
          p.title as content_title,
          p.content as content_text,
          p.user_id as content_author_id,
          au.first_name || ' ' || au.last_name as content_author_name
        FROM post_reports pr
        JOIN users u ON pr.reported_by = u.id
        JOIN posts p ON pr.post_id = p.id
        JOIN users au ON p.user_id = au.id
        WHERE pr.status = $1
        
        UNION ALL
        
        SELECT 
          'comment' as report_type,
          cr.id,
          cr.comment_id as content_id,
          cr.reported_by,
          cr.report_reason,
          cr.report_description,
          cr.status,
          cr.reviewed_by,
          cr.reviewed_at,
          cr.created_at,
          u.first_name || ' ' || u.last_name as reporter_name,
          u.email as reporter_email,
          NULL as content_title,
          c.content as content_text,
          c.user_id as content_author_id,
          au.first_name || ' ' || au.last_name as content_author_name
        FROM comment_reports cr
        JOIN users u ON cr.reported_by = u.id
        JOIN comments c ON cr.comment_id = c.id
        JOIN users au ON c.user_id = au.id
        WHERE cr.status = $1
        
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const queryParams = [status, limit, offset];

      if (type && (type === "post" || type === "comment")) {
        if (type === "post") {
          query = `
            SELECT 
              'post' as report_type,
              pr.id,
              pr.post_id as content_id,
              pr.reported_by,
              pr.report_reason,
              pr.report_description,
              pr.status,
              pr.reviewed_by,
              pr.reviewed_at,
              pr.created_at,
              u.first_name || ' ' || u.last_name as reporter_name,
              u.email as reporter_email,
              p.title as content_title,
              p.content as content_text,
              p.user_id as content_author_id,
              au.first_name || ' ' || au.last_name as content_author_name
            FROM post_reports pr
            JOIN users u ON pr.reported_by = u.id
            JOIN posts p ON pr.post_id = p.id
            JOIN users au ON p.user_id = au.id
            WHERE pr.status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
        } else {
          query = `
            SELECT 
              'comment' as report_type,
              cr.id,
              cr.comment_id as content_id,
              cr.reported_by,
              cr.report_reason,
              cr.report_description,
              cr.status,
              cr.reviewed_by,
              cr.reviewed_at,
              cr.created_at,
              u.first_name || ' ' || u.last_name as reporter_name,
              u.email as reporter_email,
              NULL as content_title,
              c.content as content_text,
              c.user_id as content_author_id,
              au.first_name || ' ' || au.last_name as content_author_name
            FROM comment_reports cr
            JOIN users u ON cr.reported_by = u.id
            JOIN comments c ON cr.comment_id = c.id
            JOIN users au ON c.user_id = au.id
            WHERE cr.status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
        }
      }

      const reports = await client.query(query, queryParams);

      let countQuery = `
        SELECT 
          (SELECT COUNT(*) FROM post_reports WHERE status = $1) +
          (SELECT COUNT(*) FROM comment_reports WHERE status = $1) as total
      `;

      if (type === "post") {
        countQuery = "SELECT COUNT(*) as total FROM post_reports WHERE status = $1";
      } else if (type === "comment") {
        countQuery = "SELECT COUNT(*) as total FROM comment_reports WHERE status = $1";
      }

      const countResult = await client.query(countQuery, [status]);
      const total = parseInt(countResult.rows[0].total);

      res.json(
        createSuccessResponse("Reports retrieved successfully", {
          reports: reports.rows,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total,
          },
          filters: {
            status,
            type: type || "all",
          },
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get reports error:", error);
    return handleDatabaseError(error, req, res, "fetching reports");
  }
};

const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const adminUserId = req.user.userId;

    const client = await req.getDbClient();

    try {
      const postReportCheck = await client.query(
        "SELECT id, post_id, status FROM post_reports WHERE id = $1",
        [id]
      );

      const commentReportCheck = await client.query(
        "SELECT id, comment_id, status FROM comment_reports WHERE id = $1",
        [id]
      );

      let reportType, reportData, updateQuery;

      if (postReportCheck.rows.length > 0) {
        reportType = "post";
        reportData = postReportCheck.rows[0];
        updateQuery = `
          UPDATE post_reports 
          SET status = $1, reviewed_by = $2, reviewed_at = NOW()
          WHERE id = $3
          RETURNING id, status, reviewed_at
        `;
      } else if (commentReportCheck.rows.length > 0) {
        reportType = "comment";
        reportData = commentReportCheck.rows[0];
        updateQuery = `
          UPDATE comment_reports 
          SET status = $1, reviewed_by = $2, reviewed_at = NOW()
          WHERE id = $3
          RETURNING id, status, reviewed_at
        `;
      } else {
        return handleNotFoundError(res, "Report");
      }

      const result = await client.query(updateQuery, [action, adminUserId, id]);

      // If approved and it's a serious violation, we might want to take action on the content
      // For now, we'll just log it
      if (action === "approved") {
        console.log(
          `Report ${id} approved by admin ${adminUserId} for ${reportType} ${reportData[`${reportType}_id`]}`
        );
        // TODO: Add logic to handle content based on report reason
        // e.g., hide content, warn user, suspend user, etc.
      }

      res.json(
        createSuccessResponse("Report reviewed successfully", {
          reportId: parseInt(id),
          reportType,
          status: result.rows[0].status,
          reviewedAt: result.rows[0].reviewed_at,
          reviewedBy: adminUserId,
          action,
          reason: reason || null,
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Review report error:", error);
    return handleDatabaseError(error, req, res, "reviewing report");
  }
};

const getReportStats = async (req, res) => {
  try {
    const client = await req.getDbClient();

    try {
      const stats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM post_reports WHERE status = 'pending') as pending_post_reports,
          (SELECT COUNT(*) FROM comment_reports WHERE status = 'pending') as pending_comment_reports,
          (SELECT COUNT(*) FROM post_reports WHERE status = 'approved') as approved_post_reports,
          (SELECT COUNT(*) FROM comment_reports WHERE status = 'approved') as approved_comment_reports,
          (SELECT COUNT(*) FROM post_reports WHERE status = 'rejected') as rejected_post_reports,
          (SELECT COUNT(*) FROM comment_reports WHERE status = 'rejected') as rejected_comment_reports,
          (SELECT COUNT(*) FROM post_reports WHERE created_at > NOW() - INTERVAL '24 hours') as post_reports_24h,
          (SELECT COUNT(*) FROM comment_reports WHERE created_at > NOW() - INTERVAL '24 hours') as comment_reports_24h,
          (SELECT COUNT(*) FROM post_reports WHERE created_at > NOW() - INTERVAL '7 days') as post_reports_7d,
          (SELECT COUNT(*) FROM comment_reports WHERE created_at > NOW() - INTERVAL '7 days') as comment_reports_7d
      `);

      const result = stats.rows[0];

      const formattedStats = {
        pending: {
          posts: parseInt(result.pending_post_reports),
          comments: parseInt(result.pending_comment_reports),
          total: parseInt(result.pending_post_reports) + parseInt(result.pending_comment_reports),
        },
        approved: {
          posts: parseInt(result.approved_post_reports),
          comments: parseInt(result.approved_comment_reports),
          total: parseInt(result.approved_post_reports) + parseInt(result.approved_comment_reports),
        },
        rejected: {
          posts: parseInt(result.rejected_post_reports),
          comments: parseInt(result.rejected_comment_reports),
          total: parseInt(result.rejected_post_reports) + parseInt(result.rejected_comment_reports),
        },
        recent: {
          last24Hours: {
            posts: parseInt(result.post_reports_24h),
            comments: parseInt(result.comment_reports_24h),
            total: parseInt(result.post_reports_24h) + parseInt(result.comment_reports_24h),
          },
          last7Days: {
            posts: parseInt(result.post_reports_7d),
            comments: parseInt(result.comment_reports_7d),
            total: parseInt(result.post_reports_7d) + parseInt(result.comment_reports_7d),
          },
        },
      };

      res.json(
        createSuccessResponse("Report statistics retrieved successfully", {
          stats: formattedStats,
          generatedAt: new Date().toISOString(),
        })
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get report stats error:", error);
    return handleDatabaseError(error, req, res, "fetching report statistics");
  }
};

module.exports = {
  getReports,
  reviewReport,
  getReportStats,
};
