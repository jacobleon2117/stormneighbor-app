const express = require("express");
const { auth } = require("../middleware/auth");
const {
  uploadProfileImage,
  uploadPostImage,
  uploadCommentImage,
  deleteImageById,
  getUploadStats,
  testUploadSystem,
} = require("../controllers/uploadController");
const { profileImageUpload, postImageUpload, commentImageUpload } = require("../config/cloudinary");
const logger = require("../utils/logger");

const router = express.Router();

const handleUpload = (uploadMiddleware, maxSizeMB) => (req, res, next) => {
  uploadMiddleware.single("image")(req, res, (err) => {
    if (err) {
      logger.error(`Multer upload error: ${err.message}`);

      let message = err.message;
      if (err.code === "LIMIT_FILE_SIZE") {
        message = `Image file too large. Maximum size is ${maxSizeMB}MB.`;
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }
    next();
  });
};

router.post("/profile", auth, handleUpload(profileImageUpload, 5), uploadProfileImage);

router.post("/post/:postId", auth, handleUpload(postImageUpload, 10), uploadPostImage);

router.post("/comment/:commentId", auth, handleUpload(commentImageUpload, 5), uploadCommentImage);

router.delete("/image/:publicId", auth, deleteImageById);

router.get("/stats", auth, getUploadStats);

router.get("/test", testUploadSystem);

router.use((error, _req, res, _next) => {
  logger.error("Upload route error:", error);

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
