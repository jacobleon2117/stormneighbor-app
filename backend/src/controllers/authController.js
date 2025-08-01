const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const sendEmail = async (to, subject, text) => {
  // TODO: Implement actual email sending (using SendGrid, AWS SES, etc.)
  console.log(`Email to ${to}: ${subject} - ${text}`);
  return true;
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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

    const client = await pool.connect();

    try {
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      let locationQuery = "";
      let locationValue = "";
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

      if (latitude && longitude) {
        locationQuery = ", location";
        locationValue = `, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
      }

      const insertQuery = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, phone,
          location_city, address_state, zip_code, address,
          email_verification_code, email_verification_expires
          ${locationQuery}
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ${locationValue}
        ) RETURNING id, email, first_name, last_name, created_at
      `;

      const result = await client.query(insertQuery, values);
      const newUser = result.rows[0];

      await sendEmail(
        email,
        "Verify your email address",
        `Your verification code is: ${verificationCode}`
      );

      const token = generateToken(newUser.id);

      res.status(201).json({
        message:
          "User registered successfully. Please check your email for verification code.",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          emailVerified: false,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name,
          email_verified, is_active, created_at
        FROM users 
        WHERE email = $1
      `;

      const result = await client.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(user.id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const client = await pool.connect();

    try {
      const user = await client.query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);

      if (user.rows.length === 0) {
        return res.json({
          message:
            "If an account with that email exists, a reset code has been sent.",
        });
      }

      const resetCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET password_reset_code = $1, password_reset_expires = $2 WHERE email = $3",
        [resetCode, codeExpiry, email]
      );

      await sendEmail(
        email,
        "Password Reset Code",
        `Your password reset code is: ${resetCode}. This code expires in 1 hour.`
      );

      res.json({
        message:
          "If an account with that email exists, a reset code has been sent.",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error processing request" });
  }
};

const verifyCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const user = result.rows[0];

      if (user.email_verification_code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (new Date() > user.email_verification_expires) {
        return res
          .status(400)
          .json({ message: "Verification code has expired" });
      }

      await client.query(
        `UPDATE users SET 
         email_verified = true, 
         email_verification_code = NULL, 
         email_verification_expires = NULL 
         WHERE email = $1`,
        [email]
      );

      res.json({ message: "Email verified successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error verifying code" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
        return res.status(400).json({ message: "Invalid reset code" });
      }

      const user = result.rows[0];

      if (user.password_reset_code !== code) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      if (new Date() > user.password_reset_expires) {
        return res.status(400).json({ message: "Reset code has expired" });
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

      res.json({ message: "Password reset successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const client = await pool.connect();

    try {
      const user = await client.query(
        "SELECT id, email_verified FROM users WHERE email = $1",
        [email]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.rows[0].email_verified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET email_verification_code = $1, email_verification_expires = $2 WHERE email = $3",
        [verificationCode, codeExpiry, email]
      );

      await sendEmail(
        email,
        "Verify your email address",
        `Your new verification code is: ${verificationCode}`
      );

      res.json({ message: "Verification code sent successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification code error:", error);
    res
      .status(500)
      .json({ message: "Server error resending verification code" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          id, email, first_name, last_name, phone, profile_image_url,
          location_city, address_state, zip_code, address,
          location_radius_miles, show_city_only, email_verified,
          notification_preferences, created_at,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude
        FROM users WHERE id = $1
      `;

      const result = await client.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];

      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        profileImageUrl: user.profile_image_url,

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
          radiusMiles: user.location_radius_miles || 10.0,
          showCityOnly: user.show_city_only || false,
        },

        location_city: user.location_city,
        address_state: user.address_state,

        emailVerified: user.email_verified,
        notificationPreferences: user.notification_preferences || {},
        createdAt: user.created_at,
      };

      res.json(profile);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      phone,
      profileImageUrl,
      city,
      state,
      zipCode,
      address,
      latitude,
      longitude,
      radiusMiles,
      showCityOnly,
      notificationPreferences,
      bio,
    } = req.body;

    console.log("updateProfile called with data:", req.body);

    const client = await pool.connect();

    try {
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (
        firstName !== undefined &&
        firstName !== null &&
        firstName.trim() !== ""
      ) {
        paramCount++;
        updates.push(`first_name = $${paramCount}`);
        values.push(firstName.trim());
      }

      if (
        lastName !== undefined &&
        lastName !== null &&
        lastName.trim() !== ""
      ) {
        paramCount++;
        updates.push(`last_name = $${paramCount}`);
        values.push(lastName.trim());
      }

      if (phone !== undefined && phone !== null) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (profileImageUrl !== undefined && profileImageUrl !== null) {
        paramCount++;
        updates.push(`profile_image_url = $${paramCount}`);
        values.push(profileImageUrl);
      }

      if (city !== undefined && city !== null && city.trim() !== "") {
        paramCount++;
        updates.push(`location_city = $${paramCount}`);
        values.push(city.trim());
      }

      if (state !== undefined && state !== null && state.trim() !== "") {
        paramCount++;
        updates.push(`address_state = $${paramCount}`);
        values.push(state.trim());
      }

      if (zipCode !== undefined && zipCode !== null && zipCode.trim() !== "") {
        paramCount++;
        updates.push(`zip_code = $${paramCount}`);
        values.push(zipCode.trim());
      }

      if (address !== undefined && address !== null) {
        paramCount++;
        updates.push(`address = $${paramCount}`);
        values.push(address);
      }

      if (radiusMiles !== undefined && radiusMiles !== null) {
        paramCount++;
        updates.push(`location_radius_miles = $${paramCount}`);
        values.push(radiusMiles);
      }

      if (showCityOnly !== undefined && showCityOnly !== null) {
        paramCount++;
        updates.push(`show_city_only = $${paramCount}`);
        values.push(showCityOnly);
      }

      if (bio !== undefined && bio !== null) {
        paramCount++;
        updates.push(`bio = $${paramCount}`);
        values.push(bio);
      }

      if (
        latitude !== undefined &&
        latitude !== null &&
        longitude !== undefined &&
        longitude !== null &&
        !isNaN(latitude) &&
        !isNaN(longitude)
      ) {
        updates.push(
          `location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`
        );
      }

      if (
        notificationPreferences !== undefined &&
        notificationPreferences !== null
      ) {
        paramCount++;
        updates.push(`notification_preferences = $${paramCount}`);
        values.push(JSON.stringify(notificationPreferences));
      }

      updates.push("updated_at = NOW()");

      if (updates.length === 1) {
        console.log("No profile fields to update, just updating timestamp");
      }

      paramCount++;
      values.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(", ")}
        WHERE id = $${paramCount}
        RETURNING 
          id, email, first_name, last_name, phone, profile_image_url,
          location_city, address_state, zip_code, address, bio,
          location_radius_miles, show_city_only, email_verified,
          notification_preferences, updated_at,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude
      `;

      console.log("Executing update query:", updateQuery);
      console.log("With values:", values);

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = result.rows[0];

      const profile = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        profileImageUrl: updatedUser.profile_image_url,
        bio: updatedUser.bio,

        location: {
          city: updatedUser.location_city,
          state: updatedUser.address_state,
          zipCode: updatedUser.zip_code,
          address: updatedUser.address,
          coordinates:
            updatedUser.longitude && updatedUser.latitude
              ? {
                  longitude: parseFloat(updatedUser.longitude),
                  latitude: parseFloat(updatedUser.latitude),
                }
              : null,
          radiusMiles: updatedUser.location_radius_miles || 10.0,
          showCityOnly: updatedUser.show_city_only || false,
        },

        location_city: updatedUser.location_city,
        address_state: updatedUser.address_state,

        emailVerified: updatedUser.email_verified,
        notificationPreferences: updatedUser.notification_preferences || {},
        updatedAt: updatedUser.updated_at,
      };

      res.json({
        message: "Profile updated successfully",
        user: profile,
        updatedAt: result.rows[0].updated_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [hashedPassword, userId]
      );

      res.json({ message: "Password changed successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error changing password" });
  }
};

const checkEmailVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT email_verified FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ emailVerified: result.rows[0].email_verified });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Check email verification error:", error);
    res
      .status(500)
      .json({ message: "Server error checking verification status" });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT email, email_verified FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];

      if (user.email_verified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const verificationCode = generateVerificationCode();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(
        "UPDATE users SET email_verification_code = $1, email_verification_expires = $2 WHERE id = $3",
        [verificationCode, codeExpiry, userId]
      );

      await sendEmail(
        user.email,
        "Verify your email address",
        `Your verification code is: ${verificationCode}`
      );

      res.json({ message: "Verification email sent successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification email error:", error);
    res
      .status(500)
      .json({ message: "Server error resending verification email" });
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

      res.json({ message: "Notification preferences updated successfully" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res
      .status(500)
      .json({ message: "Server error updating notification preferences" });
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
};
