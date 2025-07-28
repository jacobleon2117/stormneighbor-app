// File: backend/src/controllers/upload.js
const { Pool } = require("pg");
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = req.file.path;
    console.log("Uploaded profile image:", imageUrl);

    const client = await pool.connect();

    try {
      const currentUser = await client.query(
        "SELECT profile_image_url FROM users WHERE id = $1",
        [userId]
      );

      const result = await client.query(
        "UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_image_url",
        [imageUrl, userId]
      );

      if (currentUser.rows[0]?.profile_image_url) {
        const oldPublicId = getPublicIdFromUrl(
          currentUser.rows[0].profile_image_url
        );
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
            console.log("Deleted old profile image:", oldPublicId);
          } catch (error) {
            console.error("Failed to delete old profile image:", error);
          }
        }
      }

      res.json({
        message: "Profile image uploaded successfully",
        imageUrl: result.rows[0].profile_image_url,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({ message: "Server error uploading profile image" });
  }
};

const uploadPostImage = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = req.file.path;
    console.log("Uploaded post image:", imageUrl);

    const client = await pool.connect();

    try {
      const postCheck = await client.query(
        "SELECT user_id, images FROM posts WHERE id = $1",
        [postId]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to add images to this post" });
      }

      const currentImages = postCheck.rows[0].images || [];
      const updatedImages = [...currentImages, imageUrl];

      const result = await client.query(
        "UPDATE posts SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images",
        [updatedImages, postId]
      );

      res.json({
        message: "Post image uploaded successfully",
        imageUrl: imageUrl,
        images: result.rows[0].images,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Upload post image error:", error);
    res.status(500).json({ message: "Server error uploading post image" });
  }
};

const uploadCommentImage = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = req.file.path;
    console.log("Uploaded comment image:", imageUrl);

    const client = await pool.connect();

    try {
      const commentCheck = await client.query(
        "SELECT user_id, images FROM comments WHERE id = $1",
        [commentId]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to add images to this comment" });
      }

      const currentImages = commentCheck.rows[0].images || [];
      const updatedImages = [...currentImages, imageUrl];

      const result = await client.query(
        "UPDATE comments SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images",
        [updatedImages, commentId]
      );

      res.json({
        message: "Comment image uploaded successfully",
        imageUrl: imageUrl,
        images: result.rows[0].images,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Upload comment image error:", error);
    res.status(500).json({ message: "Server error uploading comment image" });
  }
};

const deleteImageById = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user.userId;

    const result = await deleteImage(publicId);

    if (result.result === "ok") {
      res.json({
        message: "Image deleted successfully",
      });
    } else {
      res.status(400).json({
        message: "Failed to delete image",
        result: result,
      });
    }
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ message: "Server error deleting image" });
  }
};

const getUploadStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await pool.connect();

    try {
      const postImages = await client.query(
        `SELECT array_length(images, 1) as image_count FROM posts WHERE user_id = $1 AND images IS NOT NULL`,
        [userId]
      );

      const commentImages = await client.query(
        `SELECT array_length(images, 1) as image_count FROM comments WHERE user_id = $1 AND images IS NOT NULL`,
        [userId]
      );

      const profileImage = await client.query(
        `SELECT profile_image_url FROM users WHERE id = $1 AND profile_image_url IS NOT NULL`,
        [userId]
      );

      const stats = {
        postImages: postImages.rows.reduce(
          (sum, row) => sum + (row.image_count || 0),
          0
        ),
        commentImages: commentImages.rows.reduce(
          (sum, row) => sum + (row.image_count || 0),
          0
        ),
        hasProfileImage: profileImage.rows.length > 0,
        totalImages: 0,
      };

      stats.totalImages =
        stats.postImages +
        stats.commentImages +
        (stats.hasProfileImage ? 1 : 0);

      res.json({
        message: "Upload stats retrieved successfully",
        stats: stats,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get upload stats error:", error);
    res.status(500).json({ message: "Server error getting upload stats" });
  }
};

module.exports = {
  uploadProfileImage,
  uploadPostImage,
  uploadCommentImage,
  deleteImageById,
  getUploadStats,
};
