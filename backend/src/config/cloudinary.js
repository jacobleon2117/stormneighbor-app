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
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful");
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
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
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  cloudinary,
  profileImageUpload,
  testCloudinaryConnection,
};
