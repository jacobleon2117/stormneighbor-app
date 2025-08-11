// File: backend/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/emailService");
const tokenService = require("../services/tokenService");

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateTokens = async (userId, req) => {
  return tokenService.createSession(userId, req);
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      latitude,
      longitude,
      address,
      city,
      state,
      zipCode,
    } = req.body;

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates provided",
        });
      }
    }

    const client = await pool.connect();

    try {
      const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      let insertQuery = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, phone,
          location_city, address_state, zip_code, address,
          email_verification_code, email_verification_expires
      `;

      let valuesClause = `
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      `;

      const values = [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        city || null,
        state || null,
        zipCode || null,
        address || null,
        verificationCode,
        codeExpiry,
      ];

      if (latitude !== undefined && longitude !== undefined) {
        insertQuery += ", location";
        valuesClause += ", ST_SetSRID(ST_MakePoint($12, $13), 4326)";
        values.push(parseFloat(longitude), parseFloat(latitude));
      }

      insertQuery += valuesClause + ") RETURNING id, email, first_name, last_name, created_at";

      const result = await client.query(insertQuery, values);
      const newUser = result.rows[0];

      const emailResult = await sendVerificationEmail(email, verificationCode);

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
      }

      const tokens = await generateTokens(newUser.id, req);

      res.status(201).json({
        success: true,
        message: emailResult.success
          ? "User registered successfully. Please check your email for verification code."
          : "User registered successfully. There was an issue sending the verification email, but you can request a new code.",
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            emailVerified: false,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT id, email, password_hash, email_verified, first_name, last_name, is_active FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const tokens = await generateTokens(user.id, req);

      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        isActive: user.is_active,
      };

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const standardMessage =
      "If an account with that email exists, we've sent a password reset code.";

    const client = await pool.connect();

    try {
      const user = await client.query("SELECT id FROM users WHERE email = $1", [email]);

      if (user.rows.length === 0) {
        return res.json({
          success: true,
          message: standardMessage,
        });
      }

      const resetCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET password_reset_code = $1, password_reset_expires = $2 WHERE email = $3",
        [resetCode, codeExpiry, email]
      );

      const emailResult = await sendPasswordResetEmail(email, resetCode);

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
      }

      res.json({
        success: true,
        message: standardMessage,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing request",
    });
  }
};

const verifyCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, code } = req.body;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, email_verification_code, email_verification_expires 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }

      const user = result.rows[0];

      if (user.email_verification_code !== code) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }

      if (new Date() > user.email_verification_expires) {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired",
        });
      }

      await client.query(
        `UPDATE users SET 
         email_verified = true, 
         email_verification_code = NULL, 
         email_verification_expires = NULL 
         WHERE email = $1`,
        [email]
      );

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying code",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, code, newPassword } = req.body;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, password_reset_code, password_reset_expires 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset code",
        });
      }

      const user = result.rows[0];

      if (user.password_reset_code !== code) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset code",
        });
      }

      if (new Date() > user.password_reset_expires) {
        return res.status(400).json({
          success: false,
          message: "Reset code has expired",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await client.query(
        `UPDATE users SET 
         password_hash = $1, 
         password_reset_code = NULL, 
         password_reset_expires = NULL 
         WHERE email = $2`,
        [hashedPassword, email]
      );

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const client = await pool.connect();

    try {
      const user = await client.query("SELECT id, email_verified FROM users WHERE email = $1", [
        email,
      ]);

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.rows[0].email_verified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET email_verification_code = $1, email_verification_expires = $2 WHERE email = $3",
        [verificationCode, codeExpiry, email]
      );

      const emailResult = await sendVerificationEmail(email, verificationCode);

      if (!emailResult.success) {
        console.error("Failed to resend verification email:", emailResult.error);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please try again later.",
        });
      }

      res.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resending verification code",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, email, first_name, last_name, phone, bio, profile_image,
                location_city, address_state, zip_code, address,
                ST_X(location) as longitude, ST_Y(location) as latitude,
                email_verified, notification_preferences, created_at, updated_at
         FROM users WHERE id = $1`,
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
        message: "Profile retrieved successfully",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          bio: user.bio,
          profileImage: user.profile_image,
          location: {
            city: user.location_city,
            state: user.address_state,
            zipCode: user.zip_code,
            address: user.address,
            coordinates:
              user.longitude && user.latitude
                ? {
                  longitude: parseFloat(user.longitude),
                  latitude: parseFloat(user.latitude),
                }
                : null,
          },
          emailVerified: user.email_verified,
          notificationPreferences: user.notification_preferences || {},
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { firstName, lastName, phone, bio, latitude, longitude, address, city, state, zipCode } =
      req.body;

    const client = await pool.connect();

    try {
      let updateQuery = `
        UPDATE users SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        bio = COALESCE($4, bio),
        location_city = COALESCE($5, location_city),
        address_state = COALESCE($6, address_state),
        zip_code = COALESCE($7, zip_code),
        address = COALESCE($8, address),
        updated_at = NOW()
      `;

      const values = [firstName, lastName, phone, bio, city, state, zipCode, address, userId];

      if (latitude !== undefined && longitude !== undefined) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          updateQuery += ", location = ST_SetSRID(ST_MakePoint($10, $11), 4326)";
          values.splice(-1, 0, lng, lat);
        }
      }

      updateQuery += " WHERE id = $" + values.length + " RETURNING id";

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const client = await pool.connect();

    try {
      const result = await client.query("SELECT password_hash FROM users WHERE id = $1", [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
        hashedNewPassword,
        userId,
      ]);

      await tokenService.revokeAllUserSessions(userId);

      res.json({
        success: true,
        message: "Password changed successfully. Please log in again on other devices.",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};

const checkEmailVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query("SELECT email_verified FROM users WHERE id = $1", [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        message: "Email verification status retrieved",
        data: {
          verified: user.email_verified,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Check email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking verification status",
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query("SELECT email, email_verified FROM users WHERE id = $1", [
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = result.rows[0];

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET email_verification_code = $1, email_verification_expires = $2 WHERE id = $3",
        [verificationCode, codeExpiry, userId]
      );

      const emailResult = await sendVerificationEmail(user.email, verificationCode);

      if (!emailResult.success) {
        console.error("Failed to resend verification email:", emailResult.error);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please try again later.",
        });
      }

      res.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resending verification email",
    });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationPreferences } = req.body;

    const client = await pool.connect();

    try {
      await client.query(
        "UPDATE users SET notification_preferences = $1, updated_at = NOW() WHERE id = $2",
        [JSON.stringify(notificationPreferences), userId]
      );

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notification preferences",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
        code: "NO_REFRESH_TOKEN",
      });
    }

    try {
      const result = await tokenService.refreshAccessToken(refreshToken, req);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken || refreshToken,
        },
      });
    } catch (error) {
      console.error("Token refresh error:", error);

      if (error.message.includes("Invalid or expired")) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to refresh token",
        code: "REFRESH_ERROR",
      });
    }
  } catch (error) {
    console.error("Refresh token endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error refreshing token",
      code: "SERVER_ERROR",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      try {
        await tokenService.revokeSession(refreshToken);
      } catch (error) {
        console.error("Error revoking session:", error);
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

const logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    try {
      const revokedCount = await tokenService.revokeAllUserSessions(userId);

      res.json({
        success: true,
        message: `Logged out from ${revokedCount} devices successfully`,
        data: {
          revokedSessions: revokedCount,
        },
      });
    } catch (error) {
      console.error("Error revoking all sessions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to logout from all devices",
      });
    }
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    try {
      const sessions = await tokenService.getUserSessions(userId);

      res.json({
        success: true,
        message: "Active sessions retrieved successfully",
        data: {
          sessions,
          count: sessions.length,
        },
      });
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get active sessions",
      });
    }
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting sessions",
    });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    try {
      const client = await pool.connect();

      try {
        const sessionResult = await client.query(
          "SELECT user_id FROM user_sessions WHERE refresh_token = $1 AND is_active = true",
          [refreshToken]
        );

        if (sessionResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Session not found",
          });
        }

        if (sessionResult.rows[0].user_id !== userId) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to revoke this session",
          });
        }

        const revoked = await tokenService.revokeSession(refreshToken);

        if (revoked) {
          res.json({
            success: true,
            message: "Session revoked successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Session not found or already revoked",
          });
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to revoke session",
      });
    }
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error revoking session",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyCode,
  resetPassword,
  resendVerificationCode,
  getProfile,
  updateProfile,
  changePassword,
  checkEmailVerification,
  resendVerificationEmail,
  updateNotificationPreferences,
  refreshToken,
  logout,
  logoutAll,
  getActiveSessions,
  revokeSession,
};
