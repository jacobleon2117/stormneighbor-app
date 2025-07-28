// File: backend/src/routes/upload.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  profileImageUpload,
  postImageUpload,
  commentImageUpload,
  testCloudinaryConnection,
} = require("../config/cloudinary");
const {
  uploadProfileImage,
  uploadPostImage,
  uploadCommentImage,
  deleteImageById,
  getUploadStats,
} = require("../controllers/upload");

router.get("/test", async (req, res) => {
  const cloudinaryWorking = await testCloudinaryConnection();

  res.json({
    success: true,
    message: "Upload system is working!",
    data: {
      cloudinary: {
        connected: cloudinaryWorking,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "missing",
        apiKey: process.env.CLOUDINARY_API_KEY ? "configured" : "missing",
        apiSecret: process.env.CLOUDINARY_API_SECRET ? "configured" : "missing",
      },
      endpoints: {
        profile: "POST /api/upload/profile",
        post: "POST /api/upload/post/:postId",
        comment: "POST /api/upload/comment/:commentId",
        delete: "DELETE /api/upload/image/:publicId",
        stats: "GET /api/upload/stats",
      },
      timestamp: new Date().toISOString(),
      supportedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      limits: {
        profile: "5MB",
        post: "10MB",
        comment: "5MB",
      },
    },
  });
});

router.post(
  "/test-upload",
  profileImageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      const imageUrl = req.file.path;
      const publicId = req.file.filename;

      console.log("Test image uploaded:", imageUrl);

      res.json({
        success: true,
        message: "Test image uploaded successfully!",
        data: {
          imageUrl: imageUrl,
          publicId: publicId,
          size: req.file.size,
          format: req.file.format,
        },
      });
    } catch (error) {
      console.error("Test upload error:", error);
      res.status(500).json({
        success: false,
        message: "Server error uploading image",
      });
    }
  }
);

router.get("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pool } = require("../config/database");
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT profile_image_url, first_name, last_name FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        message: "Profile image retrieved successfully",
        data: {
          user: {
            firstName: user.first_name,
            lastName: user.last_name,
            profileImageUrl: user.profile_image_url,
            hasProfileImage: !!user.profile_image_url,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting profile image",
    });
  }
});

router.post(
  "/profile",
  auth,
  (req, res, next) => {
    profileImageUpload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer profile upload error:", err.message);
        return res.status(400).json({
          success: false,
          message: err.message.includes("File too large")
            ? "Image file too large. Maximum size is 5MB."
            : err.message,
        });
      }
      next();
    });
  },
  uploadProfileImage
);

router.post(
  "/post/:postId",
  auth,
  (req, res, next) => {
    postImageUpload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer post upload error:", err.message);
        return res.status(400).json({
          success: false,
          message: err.message.includes("File too large")
            ? "Image file too large. Maximum size is 10MB."
            : err.message,
        });
      }
      next();
    });
  },
  uploadPostImage
);

router.post(
  "/comment/:commentId",
  auth,
  (req, res, next) => {
    commentImageUpload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer comment upload error:", err.message);
        return res.status(400).json({
          success: false,
          message: err.message.includes("File too large")
            ? "Image file too large. Maximum size is 5MB."
            : err.message,
        });
      }
      next();
    });
  },
  uploadCommentImage
);

router.delete("/image/:publicId", auth, deleteImageById);

router.get("/stats", auth, getUploadStats);

router.use((error, req, res, next) => {
  console.error("Upload route error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Please choose a smaller image.",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Only one image file is allowed.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Upload error occurred",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;
