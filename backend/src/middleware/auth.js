const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const client = await pool.connect();
      try {
        const userResult = await client.query(
          "SELECT id, email, is_verified FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return res
            .status(401)
            .json({ message: "Token is not valid - user not found" });
        }

        req.user = {
          userId: decoded.userId,
          email: userResult.rows[0].email,
          isVerified: userResult.rows[0].is_verified,
        };

        next();
      } finally {
        client.release();
      }
    } catch (jwtError) {
      return res.status(401).json({ message: "Token is not valid" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error in authentication" });
  }
};

module.exports = auth;
