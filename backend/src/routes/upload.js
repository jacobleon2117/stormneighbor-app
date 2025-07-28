// File: backend/src/routes/upload.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  profileImageUpload,
  testCloudinaryConnection,
} = require("../config/cloudinary");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

router.get("/test", async (req, res) => {
  const cloudinaryWorking = await testCloudinaryConnection();

  res.json({
    message: "Upload system is working!",
    cloudinary: {
      connected: cloudinaryWorking,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "missing",
      apiKey: process.env.CLOUDINARY_API_KEY ? "configured" : "missing",
      apiSecret: process.env.CLOUDINARY_API_SECRET ? "configured" : "missing",
    },
    timestamp: new Date().toISOString(),
    supportedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
  });
});

router.post(
  "/test-upload",
  profileImageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = req.file.path;
      console.log("Test image uploaded:", imageUrl);

      res.json({
        message: "Test image uploaded successfully!",
        imageUrl: imageUrl,
        publicId: req.file.public_id,
      });
    } catch (error) {
      console.error("Test upload error:", error);
      res.status(500).json({ message: "Server error uploading image" });
    }
  }
);

router.get("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT profile_image_url, first_name, last_name FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];

      res.json({
        message: "Profile image retrieved successfully",
        user: {
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          hasProfileImage: !!user.profile_image_url,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get profile image error:", error);
    res.status(500).json({ message: "Server error getting profile image" });
  }
});

router.post(
  "/profile",
  auth,
  profileImageUpload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = req.file.path;
      const publicId = req.file.public_id;

      console.log("Profile image uploaded for user:", userId);
      console.log("Image URL:", imageUrl);

      const client = await pool.connect();

      try {
        const result = await client.query(
          "UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_image_url, first_name, last_name",
          [imageUrl, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = result.rows[0];

        console.log(
          "Database updated for user:",
          updatedUser.first_name,
          updatedUser.last_name
        );

        res.json({
          message: "Profile image updated successfully!",
          imageUrl: updatedUser.profile_image_url,
          publicId: publicId,
          user: {
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            profileImageUrl: updatedUser.profile_image_url,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Profile upload error:", error);
      res.status(500).json({ message: "Server error uploading profile image" });
    }
  }
);

module.exports = router;
