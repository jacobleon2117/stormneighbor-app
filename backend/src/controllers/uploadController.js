const { pool } = require("../config/database");
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary");

const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.info("Profile image upload request for user:", userId);

    if (!req.file) {
      logger.error("No image file provided");
      return res.status(400).json({
        message: "No image file provided",
        success: false,
      });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    logger.info("Uploaded to Cloudinary:", {
      url: imageUrl,
      publicId: publicId,
      size: req.file.size,
    });

    const client = await pool.connect();

    try {
      const currentUser = await client.query("SELECT profile_image_url FROM users WHERE id = $1", [
        userId,
      ]);

      const result = await client.query(
        "UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_image_url, first_name, last_name",
        [imageUrl, userId]
      );

      if (result.rows.length === 0) {
        logger.error("User not found for ID:", userId);
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      if (
        currentUser.rows[0]?.profile_image_url &&
        currentUser.rows[0].profile_image_url !== imageUrl
      ) {
        const oldPublicId = getPublicIdFromUrl(currentUser.rows[0].profile_image_url);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
            logger.info("Deleted old profile image:", oldPublicId);
          } catch (error) {
            logger.error("Failed to delete old profile image:", error.message);
          }
        }
      }

      const updatedUser = result.rows[0];

      logger.info(
        "Profile image updated successfully for user:",
        updatedUser.first_name,
        updatedUser.last_name
      );

      res.json({
        success: true,
        message: "Profile image uploaded successfully",
        data: {
          imageUrl: updatedUser.profile_image_url,
          publicId: publicId,
          user: {
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            profileImageUrl: updatedUser.profile_image_url,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Upload profile image error:", error);

    if (req.file?.filename) {
      try {
        await deleteImage(req.file.filename);
        logger.info("Cleaned up failed upload:", req.file.filename);
      } catch (cleanupError) {
        logger.error("Failed to cleanup failed upload:", cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading profile image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const uploadPostImage = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    logger.info("Post image upload request for post:", postId, "by user:", userId);

    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
        success: false,
      });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    logger.info("Post image uploaded to Cloudinary:", {
      url: imageUrl,
      publicId: publicId,
      size: req.file.size,
    });

    const client = await pool.connect();

    try {
      const postCheck = await client.query("SELECT user_id, images FROM posts WHERE id = $1", [
        postId,
      ]);

      if (postCheck.rows.length === 0) {
        await deleteImage(publicId);
        return res.status(404).json({
          message: "Post not found",
          success: false,
        });
      }

      if (postCheck.rows[0].user_id !== userId) {
        await deleteImage(publicId);
        return res.status(403).json({
          message: "Not authorized to add images to this post",
          success: false,
        });
      }

      const currentImages = postCheck.rows[0].images || [];
      const updatedImages = [...currentImages, imageUrl];

      const result = await client.query(
        "UPDATE posts SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images",
        [updatedImages, postId]
      );

      logger.info("Post image added successfully to post:", postId);

      res.json({
        success: true,
        message: "Post image uploaded successfully",
        data: {
          imageUrl: imageUrl,
          publicId: publicId,
          images: result.rows[0].images,
          postId: parseInt(postId),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Upload post image error:", error);

    if (req.file?.filename) {
      try {
        await deleteImage(req.file.filename);
      } catch (cleanupError) {
        logger.error("Failed to cleanup failed upload:", cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading post image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const uploadCommentImage = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    logger.info("Comment image upload request for comment:", commentId, "by user:", userId);

    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
        success: false,
      });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    logger.info("Comment image uploaded to Cloudinary:", {
      url: imageUrl,
      publicId: publicId,
      size: req.file.size,
    });

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT user_id, images FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        await deleteImage(publicId);
        return res.status(404).json({
          message: "Comment not found",
          success: false,
        });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        await deleteImage(publicId);
        return res.status(403).json({
          message: "Not authorized to add images to this comment",
          success: false,
        });
      }

      const currentImages = commentCheck.rows[0].images || [];
      const updatedImages = [...currentImages, imageUrl];

      const result = await client.query(
        "UPDATE comments SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images",
        [updatedImages, commentId]
      );

      logger.info("Comment image added successfully to comment:", commentId);

      res.json({
        success: true,
        message: "Comment image uploaded successfully",
        data: {
          imageUrl: imageUrl,
          publicId: publicId,
          images: result.rows[0].images,
          commentId: parseInt(commentId),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Upload comment image error:", error);

    if (req.file?.filename) {
      try {
        await deleteImage(req.file.filename);
      } catch (cleanupError) {
        logger.error("Failed to cleanup failed upload:", cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading comment image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteImageById = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user.userId;

    logger.info("Delete image request for publicId:", publicId, "by user:", userId);

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const result = await deleteImage(publicId);

    if (result.result === "ok") {
      logger.info("Image deleted successfully:", publicId);
      res.json({
        success: true,
        message: "Image deleted successfully",
        data: { publicId, result },
      });
    } else {
      logger.info("Image deletion failed:", result);
      res.status(400).json({
        success: false,
        message: "Failed to delete image",
        data: { result },
      });
    }
  } catch (error) {
    logger.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUploadStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const postImages = await client.query(
        "SELECT array_length(images, 1) as image_count FROM posts WHERE user_id = $1 AND images IS NOT NULL",
        [userId]
      );

      const commentImages = await client.query(
        "SELECT array_length(images, 1) as image_count FROM comments WHERE user_id = $1 AND images IS NOT NULL",
        [userId]
      );

      const profileImage = await client.query(
        "SELECT profile_image_url FROM users WHERE id = $1 AND profile_image_url IS NOT NULL",
        [userId]
      );

      const stats = {
        postImages: postImages.rows.reduce((sum, row) => sum + (row.image_count || 0), 0),
        commentImages: commentImages.rows.reduce((sum, row) => sum + (row.image_count || 0), 0),
        hasProfileImage: profileImage.rows.length > 0,
        profileImageUrl: profileImage.rows[0]?.profile_image_url || null,
        totalImages: 0,
      };

      stats.totalImages = stats.postImages + stats.commentImages + (stats.hasProfileImage ? 1 : 0);

      res.json({
        success: true,
        message: "Upload stats retrieved successfully",
        data: { stats },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Get upload stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting upload stats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const testUploadSystem = async (_req, res) => {
  try {
    const { cloudinary } = require("../config/cloudinary");
    const logger = require("../utils/logger");

    const ping = await cloudinary.api.ping();

    res.json({
      success: true,
      message: "Upload system is working!",
      data: {
        cloudinary: {
          connected: true,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          ping: ping.status,
        },
        endpoints: {
          profileUpload: "/api/v1/upload/profile",
          postUpload: "/api/v1/upload/post/:postId",
          commentUpload: "/api/v1/upload/comment/:commentId",
          deleteImage: "/api/v1/upload/image/:publicId",
          stats: "/api/v1/upload/stats",
        },
        limits: {
          profileImage: "5MB",
          postImage: "10MB",
          commentImage: "5MB",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Upload system test error:", error);
    res.status(500).json({
      success: false,
      message: "Upload system test failed",
      error: error.message,
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadPostImage,
  uploadCommentImage,
  deleteImageById,
  getUploadStats,
  testUploadSystem,
};
