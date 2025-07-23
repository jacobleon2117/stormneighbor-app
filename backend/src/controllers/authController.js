const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
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
      address,
      latitude,
      longitude,
      neighborhoodId,
    } = req.body;

    const client = await pool.connect();

    try {
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      let locationQuery = "";
      let locationParams = [];
      if (latitude && longitude) {
        locationQuery = ", location";
        locationParams.push(
          `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`
        );
      }

      const insertQuery = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, phone, 
          address_street, neighborhood_id${locationQuery}
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7${
          locationParams.length > 0 ? ", " + locationParams[0] : ""
        })
        RETURNING id, email, first_name, last_name, phone, address_street, neighborhood_id, created_at
      `;

      const values = [
        email.toLowerCase(),
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        address || null,
        neighborhoodId || null,
      ];

      const result = await client.query(insertQuery, values);
      const newUser = result.rows[0];

      const token = generateToken(newUser.id);

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          phone: newUser.phone,
          address: newUser.address_street,
          neighborhoodId: newUser.neighborhood_id,
          createdAt: newUser.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Registration error:", error);
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
      const userResult = await client.query(
        `
        SELECT 
          u.id, u.email, u.password_hash, u.first_name, u.last_name, 
          u.phone, u.address_street, u.neighborhood_id, u.is_verified,
          n.name as neighborhood_name
        FROM users u
        LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
        WHERE u.email = $1
      `,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = userResult.rows[0];

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
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
          phone: user.phone,
          address: user.address_street,
          neighborhoodId: user.neighborhood_id,
          neighborhoodName: user.neighborhood_name,
          isVerified: user.is_verified,
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

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const userResult = await client.query(
        `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, 
          u.address_street, u.address_city, u.address_state, u.address_zip,
          u.neighborhood_id, u.profile_image_url, u.is_verified,
          u.emergency_contact_name, u.emergency_contact_phone, u.skills,
          u.preferences,
          n.name as neighborhood_name,
          ST_X(u.location::geometry) as longitude,
          ST_Y(u.location::geometry) as latitude
        FROM users u
        LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
        WHERE u.id = $1
      `,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: {
          street: user.address_street,
          city: user.address_city,
          state: user.address_state,
          zip: user.address_zip,
        },
        location:
          user.longitude && user.latitude
            ? {
                longitude: user.longitude,
                latitude: user.latitude,
              }
            : null,
        neighborhoodId: user.neighborhood_id,
        neighborhoodName: user.neighborhood_name,
        profileImageUrl: user.profile_image_url,
        isVerified: user.is_verified,
        emergencyContact: {
          name: user.emergency_contact_name,
          phone: user.emergency_contact_phone,
        },
        skills: user.skills || [],
        preferences: user.preferences || {},
      });
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
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      neighborhoodId,
      bio,
      profileImage,
      emergencyContactName,
      emergencyContactPhone,
      skills,
      notificationPreferences,
    } = req.body;

    const client = await pool.connect();

    try {
      let updateQuery = `
        UPDATE users SET 
          address_street = COALESCE($2, address_street),
          address_city = COALESCE($3, address_city),
          address_state = COALESCE($4, address_state),
          address_zip = COALESCE($5, address_zip),
          neighborhood_id = COALESCE($6, neighborhood_id),
          profile_image_url = COALESCE($7, profile_image_url),
          emergency_contact_name = COALESCE($8, emergency_contact_name),
          emergency_contact_phone = COALESCE($9, emergency_contact_phone),
          skills = COALESCE($10, skills),
          preferences = COALESCE($11, preferences),
          updated_at = NOW()
      `;

      const values = [
        userId,
        address,
        city,
        state,
        zipCode,
        neighborhoodId,
        profileImage,
        emergencyContactName,
        emergencyContactPhone,
        skills,
        notificationPreferences,
      ];

      if (latitude && longitude) {
        updateQuery += `, location = ST_SetSRID(ST_MakePoint($12, $13), 4326)`;
        values.push(longitude, latitude);
      }

      updateQuery += ` WHERE id = $1 RETURNING id`;

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        success: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, email, first_name FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.json({
          message: "If that email exists, we've sent reset instructions",
        });
      }

      const user = userResult.rows[0];
      const resetCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await client.query(
        `UPDATE users SET 
         preferences = preferences || $2
         WHERE id = $1`,
        [
          user.id,
          JSON.stringify({
            resetCode: resetCode,
            resetCodeExpires: expiresAt.toISOString(),
          }),
        ]
      );

      console.log(`Reset code for ${email}: ${resetCode}`);

      res.json({
        message: "If that email exists, we've sent reset instructions",
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
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, preferences FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Invalid code" });
      }

      const user = userResult.rows[0];
      const preferences = user.preferences || {};

      if (
        !preferences.resetCode ||
        preferences.resetCode !== code ||
        new Date() > new Date(preferences.resetCodeExpires)
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      res.json({
        message: "Code verified successfully",
        success: true,
      });
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
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, preferences FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const user = userResult.rows[0];
      const preferences = user.preferences || {};

      if (
        !preferences.resetCode ||
        preferences.resetCode !== code ||
        new Date() > new Date(preferences.resetCodeExpires)
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await client.query(
        `UPDATE users SET 
         password_hash = $2,
         preferences = preferences - 'resetCode' - 'resetCodeExpires',
         updated_at = NOW()
         WHERE id = $1`,
        [user.id, hashedPassword]
      );

      res.json({
        message: "Password reset successfully",
        success: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await client.query(
        "UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1",
        [userId, hashedPassword]
      );

      res.json({
        message: "Password changed successfully",
        success: true,
      });
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
      const userResult = await client.query(
        "SELECT is_verified FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        verified: userResult.rows[0].is_verified,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Check verification error:", error);
    res.status(500).json({ message: "Server error checking verification" });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT email, first_name, is_verified FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.rows[0];

      if (user.is_verified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      console.log(`Verification email sent to ${user.email}`);

      res.json({
        message: "Verification email sent successfully",
        success: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res
      .status(500)
      .json({ message: "Server error sending verification email" });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const client = await pool.connect();

    try {
      const userResult = await client.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Email not found" });
      }

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await client.query(
        `UPDATE users SET 
         preferences = preferences || $2
         WHERE id = $1`,
        [
          userResult.rows[0].id,
          JSON.stringify({
            verificationCode: verificationCode,
            verificationCodeExpires: expiresAt.toISOString(),
          }),
        ]
      );

      console.log(`Verification code for ${email}: ${verificationCode}`);

      res.json({
        message: "Verification code sent successfully",
        success: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Resend verification code error:", error);
    res.status(500).json({ message: "Server error sending verification code" });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: "Preferences are required" });
    }

    const client = await pool.connect();

    try {
      await client.query(
        `UPDATE users SET 
         preferences = preferences || $2,
         updated_at = NOW()
         WHERE id = $1`,
        [userId, JSON.stringify({ notifications: preferences })]
      );

      res.json({
        message: "Notification preferences updated successfully",
        success: true,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Server error updating preferences" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyCode,
  resetPassword,
  changePassword,
  checkEmailVerification,
  resendVerificationEmail,
  resendVerificationCode,
  updateNotificationPreferences,
};
