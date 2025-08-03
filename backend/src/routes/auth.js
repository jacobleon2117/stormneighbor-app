// File: backend/src/routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const { testEmailService, sendEmail } = require("../services/emailService");
const { handleValidationErrors, validateCoordinates } = require("../middleware/validation");

const router = express.Router();

const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 255 })
    .withMessage("Email must be less than 255 characters"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    )
    .not()
    .contains(" ")
    .withMessage("Password cannot contain spaces"),

  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("First name can only contain letters, spaces, hyphens, and apostrophes"),

  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes"),

  body("phone")
    .optional()
    .isMobilePhone("any", { strictMode: false })
    .withMessage("Please provide a valid phone number"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be less than 100 characters"),

  body("state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State must be less than 50 characters"),

  body("zipCode")
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("ZIP code must be in format 12345 or 12345-6789"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 128 })
    .withMessage("Invalid password format"),
];

const forgotPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
];

const verifyCodeValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Verification code must be 6 digits"),
];

const resetPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Reset code must be 6 digits"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),

  body("phone")
    .optional()
    .isMobilePhone("any", { strictMode: false })
    .withMessage("Please provide a valid phone number"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),

  validateCoordinates,
];

router.post("/register", registerValidation, handleValidationErrors, authController.register);
router.post("/login", loginValidation, handleValidationErrors, authController.login);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  authController.forgotPassword
);
router.post(
  "/verify-code",
  verifyCodeValidation,
  handleValidationErrors,
  authController.verifyCode
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword
);
router.post(
  "/resend-code",
  forgotPasswordValidation,
  handleValidationErrors,
  authController.resendVerificationCode
);

router.get("/profile", auth, authController.getProfile);
router.put(
  "/profile",
  auth,
  updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);
router.post(
  "/change-password",
  auth,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);
router.get("/verify-status", auth, authController.checkEmailVerification);
router.post("/resend-verification", auth, authController.resendVerificationEmail);
router.put("/notification-preferences", auth, authController.updateNotificationPreferences);

router.get("/test-email", async (req, res) => {
  try {
    const testResult = await testEmailService();

    res.json({
      success: true,
      message: "Email service test completed",
      data: {
        configValid: testResult.success,
        error: testResult.error || null,
        environment: {
          resendConfigured: !!process.env.RESEND_API_KEY,
          fromEmailConfigured: !!process.env.FROM_EMAIL,
          fromNameConfigured: !!process.env.FROM_NAME,
        },
      },
    });
  } catch (error) {
    console.error("Email test error:", error);
    res.status(500).json({
      success: false,
      message: "Email service test failed",
      error: error.message,
    });
  }
});

router.post(
  "/send-test-email",
  [
    body("to").isEmail().normalizeEmail().withMessage("Valid recipient email required"),
    handleValidationErrors,
  ],
  async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "Test email endpoint only available in development",
      });
    }

    try {
      const { to } = req.body;

      const result = await sendEmail(
        to,
        "StormNeighbor Email Service Test",
        "This is a test email from your StormNeighbor backend. If you received this, your email service is working correctly!"
      );

      res.json({
        success: result.success,
        message: result.success ? "Test email sent successfully" : "Failed to send test email",
        data: {
          messageId: result.messageId || null,
          error: result.error || null,
        },
      });
    } catch (error) {
      console.error("Send test email error:", error);
      res.status(500).json({
        success: false,
        message: "Server error sending test email",
        error: error.message,
      });
    }
  }
);

module.exports = router;
