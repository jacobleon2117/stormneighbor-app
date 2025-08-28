const { pool } = require("../config/database");
const {
  handleDatabaseError: _handleDatabaseError,
  handleNotFoundError: _handleNotFoundError,
  handleServerError,
  createSuccessResponse,
} = require("../middleware/errorHandler");
const feedbackLogger = require("../utils/feedbackLogger");

// Create new feedback
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

    const userId = req.user.id;

    // Validate required fields
    if (!feedbackType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: feedbackType, title, description",
      });
    }

    // Log feedback to files (JSON and Markdown)
    const loggedFeedback = await feedbackLogger.logFeedback({
      userId,
      feedbackType,
      title,
      description,
      priority,
      appVersion,
      deviceInfo,
    });

    console.log("Feedback received and logged:", {
      id: loggedFeedback.id,
      userId,
      feedbackType,
      title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
      priority,
      timestamp: loggedFeedback.submittedAt,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        id: loggedFeedback.id,
        userId,
        feedbackType,
        title,
        description,
        priority,
        appVersion,
        deviceInfo,
        status: "new",
        createdAt: loggedFeedback.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user's own feedback (placeholder)
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Return empty array for now
    res.json({
      success: true,
      data: {
        feedback: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all feedback (admin only - placeholder)
exports.getAllFeedback = async (req, res) => {
  try {
    // Return empty array for now
    res.json({
      success: true,
      data: {
        feedback: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update feedback status (admin only - placeholder)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    res.json({
      success: true,
      message: "Feedback status updated successfully (placeholder)",
      data: { id, status },
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete feedback (placeholder)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: "Feedback deleted successfully (placeholder)",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get feedback statistics (admin only - placeholder)
exports.getFeedbackStats = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total: 0,
        recent: 0,
        byType: [],
        byStatus: [],
        byPriority: [],
      },
    });
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};