// File: backend/src/routes/upload.js
const express = require("express");
const { auth } = require("../middleware/auth");
const {
  uploadProfileImage,
  uploadPostImage,
  uploadCommentImage,
  deleteImageById,
  getUploadStats,
} = require("../controllers/uploadController");
const { profileImageUpload, postImageUpload, commentImageUpload } = require("../config/cloudinary");

const router = express.Router();

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

router.use((error, req, res, _next) => {
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
