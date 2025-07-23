const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("lastName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const verifyCodeValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Code must be 6 digits"),
];

const resetPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Code must be 6 digits"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
];

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.forgotPassword
);
router.post("/verify-code", verifyCodeValidation, authController.verifyCode);
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.resetPassword
);
router.post(
  "/resend-code",
  [body("email").isEmail().normalizeEmail()],
  authController.resendVerificationCode
);

router.get("/profile", auth, authController.getProfile);
router.put("/profile", auth, authController.updateProfile);
router.post(
  "/change-password",
  auth,
  changePasswordValidation,
  authController.changePassword
);
router.get("/verify-status", auth, authController.checkEmailVerification);
router.post(
  "/resend-verification",
  auth,
  authController.resendVerificationEmail
);
router.put(
  "/notification-preferences",
  auth,
  authController.updateNotificationPreferences
);

module.exports = router;
