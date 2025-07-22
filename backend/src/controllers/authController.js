const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const { validationResult } = require("express-validator");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
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
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
