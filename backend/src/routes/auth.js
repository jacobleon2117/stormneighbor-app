const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { testEmailService, sendEmail } = require("../services/emailService");
const { handleValidationErrors, validateCoordinates } = require("../middleware/validation");
const securityMiddleware = require("../middleware/security");

const router = express.Router();

const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 255 })
    .withMessage("Email must be less than 255 characters")
    .custom((value) => {
      const disposableDomains = ["tempmail.org", "10minutemail.com", "guerrillamail.com"];
      const domain = value.split("@")[1];
      if (disposableDomains.includes(domain)) {
        throw new Error("Disposable email addresses are not allowed");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),

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
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 255 })
    .withMessage("Email too long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 128 })
    .withMessage("Password too long"),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 255 })
    .withMessage("Email too long"),
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

  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Verification code must be 6 digits"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
];

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("First name can only contain letters, spaces, hyphens, and apostrophes"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes"),

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

const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isLength({ min: 20, max: 512 })
    .withMessage("Invalid refresh token format")
    .matches(/^[a-f0-9]+$/)
    .withMessage("Invalid refresh token format"),
];

const logoutValidation = [
  body("refreshToken")
    .optional()
    .isLength({ min: 20, max: 512 })
    .withMessage("Invalid refresh token format")
    .matches(/^[a-f0-9]+$/)
    .withMessage("Invalid refresh token format"),
];

const revokeSessionValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isLength({ min: 20, max: 512 })
    .withMessage("Invalid refresh token format")
    .matches(/^[a-f0-9]+$/)
    .withMessage("Invalid refresh token format"),
];

router.post(
  "/register",
  securityMiddleware.registrationProtection(),
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  "/login",
  securityMiddleware.loginBruteForceProtection(),
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.post(
  "/forgot-password",
  securityMiddleware.passwordResetProtection(),
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
  securityMiddleware.passwordResetProtection(),
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

router.post(
  "/refresh-token",
  refreshTokenValidation,
  handleValidationErrors,
  authController.refreshToken
);

router.post("/logout", logoutValidation, handleValidationErrors, authController.logout);

router.post("/logout-all", auth, authController.logoutAll);

router.get("/sessions", auth, authController.getActiveSessions);

router.delete(
  "/sessions",
  auth,
  revokeSessionValidation,
  handleValidationErrors,
  authController.revokeSession
);

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

if (process.env.NODE_ENV === "development") {
  router.get("/security-stats", (req, res) => {
    res.json({
      success: true,
      message: "Security monitoring stats",
      data: {
        note: "In production, use proper monitoring tools like Sentry or DataDog",
        environment: process.env.NODE_ENV,
      },
    });
  });
}

module.exports = router;
