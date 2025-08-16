// File: backend/src/config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const testCloudinaryConnection = async () => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("ERROR: Missing Cloudinary environment variables");
      console.log(
        "Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
      );
      return false;
    }

    const _result = await cloudinary.api.ping();
    console.log("SUCCESS: Cloudinary connection successful");
    console.log("INFO: Cloudinary account:", process.env.CLOUDINARY_CLOUD_NAME);
    return true;
  } catch (error) {
    console.error("ERROR: Cloudinary connection failed:", error.message);
    if (error.http_code === 401) {
      console.error("INFO: Check your API credentials");
    }
    return false;
  }
};

const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stormneighbor/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },
      { width: 400, height: 400, crop: "fill", gravity: "face" },
    ],
    public_id: (req, _file) => {
      const timestamp = Date.now();
      const userId = req.user?.userId || "unknown";
      return `profile_${userId}_${timestamp}`;
    },
  },
});

const postImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stormneighbor/posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },
      { width: 800, height: 600, crop: "limit" },
    ],
    public_id: (req, _file) => {
      const timestamp = Date.now();
      const postId = req.params.postId || "new";
      return `post_${postId}_${timestamp}`;
    },
  },
});

const commentImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stormneighbor/comments",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },
      { width: 600, height: 400, crop: "limit" },
    ],
    public_id: (req, _file) => {
      const timestamp = Date.now();
      const commentId = req.params.commentId || "new";
      return `comment_${commentId}_${timestamp}`;
    },
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INFO: Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
    }
  },
});

const postImageUpload = multer({
  storage: postImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INFO: Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
    }
  },
});

const commentImageUpload = multer({
  storage: commentImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INFO: Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
    }
  },
});

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const matches = url.match(/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i);
    if (matches && matches[1]) {
      const pathMatches = url.match(/stormneighbor\/[^/]+\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i);
      if (pathMatches) {
        const folder = url.includes("/profiles/")
          ? "stormneighbor/profiles/"
          : url.includes("/posts/")
            ? "stormneighbor/posts/"
            : url.includes("/comments/")
              ? "stormneighbor/comments/"
              : "";
        return folder + matches[1];
      }
      return matches[1];
    }
    return null;
  } catch (error) {
    console.error("ERROR: Error extracting public_id from URL:", error);
    return null;
  }
};

const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("No public_id provided");
    }

    console.log("WORKING: Deleting image with public_id:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("INFO: Image deletion result:", result);
    return result;
  } catch (error) {
    console.error("ERROR: Error deleting image:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  profileImageUpload,
  postImageUpload,
  commentImageUpload,
  testCloudinaryConnection,
  getPublicIdFromUrl,
  deleteImage,
};
