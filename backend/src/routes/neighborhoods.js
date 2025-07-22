const express = require("express");
const { body, query } = require("express-validator");
const { pool } = require("../config/database");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT 
          id, name, city, state, description, radius_miles,
          ST_Distance(
            center_point::geometry,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)
          ) * 69 as distance_miles
        FROM neighborhoods
        WHERE is_active = true
          AND ST_DWithin(
            center_point::geometry,
            ST_SetSRID(ST_MakePoint($2, $1), 4326),
            $3 / 69.0
          )
        ORDER BY distance_miles
        LIMIT 20
      `,
        [latitude, longitude, radius]
      );

      res.json({
        neighborhoods: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city,
          state: row.state,
          description: row.description,
          radiusMiles: parseFloat(row.radius_miles),
          distanceMiles: parseFloat(row.distance_miles),
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching nearby neighborhoods:", error);
    res.status(500).json({ message: "Server error fetching neighborhoods" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          n.id, n.name, n.city, n.state, n.description, n.radius_miles,
          n.created_at,
          ST_X(n.center_point::geometry) as longitude,
          ST_Y(n.center_point::geometry) as latitude,
          COUNT(u.id) as member_count
        FROM neighborhoods n
        LEFT JOIN users u ON u.neighborhood_id = n.id
        WHERE n.id = $1 AND n.is_active = true
        GROUP BY n.id
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Neighborhood not found" });
      }

      const neighborhood = result.rows[0];
      res.json({
        id: neighborhood.id,
        name: neighborhood.name,
        city: neighborhood.city,
        state: neighborhood.state,
        description: neighborhood.description,
        radiusMiles: parseFloat(neighborhood.radius_miles),
        location: {
          latitude: neighborhood.latitude,
          longitude: neighborhood.longitude,
        },
        memberCount: parseInt(neighborhood.member_count),
        createdAt: neighborhood.created_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching neighborhood:", error);
    res.status(500).json({ message: "Server error fetching neighborhood" });
  }
});

router.post(
  "/",
  auth,
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("city").trim().isLength({ min: 1 }).withMessage("City is required"),
    body("state")
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage("State must be 2 characters"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    body("radiusMiles")
      .optional()
      .isFloat({ min: 0.1, max: 10 })
      .withMessage("Radius must be between 0.1 and 10 miles"),
  ],
  async (req, res) => {
    try {
      const {
        name,
        city,
        state,
        description,
        latitude,
        longitude,
        radiusMiles = 1.0,
      } = req.body;
      const userId = req.user.userId;

      const client = await pool.connect();
      try {
        const existingResult = await client.query(
          `
        SELECT id FROM neighborhoods 
        WHERE ST_DWithin(
          center_point::geometry,
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          0.5 / 69.0
        )
        AND is_active = true
      `,
          [longitude, latitude]
        );

        if (existingResult.rows.length > 0) {
          return res.status(400).json({
            message:
              "A neighborhood already exists within 0.5 miles of this location",
          });
        }

        const insertResult = await client.query(
          `
        INSERT INTO neighborhoods (
          name, city, state, description, center_point, radius_miles, created_by
        ) VALUES (
          $1, $2, $3, $4, 
          ST_SetSRID(ST_MakePoint($5, $6), 4326),
          $7, $8
        ) RETURNING id, name, city, state, created_at
      `,
          [
            name,
            city,
            state,
            description,
            longitude,
            latitude,
            radiusMiles,
            userId,
          ]
        );

        const newNeighborhood = insertResult.rows[0];

        res.status(201).json({
          message: "Neighborhood created successfully",
          neighborhood: {
            id: newNeighborhood.id,
            name: newNeighborhood.name,
            city: newNeighborhood.city,
            state: newNeighborhood.state,
            radiusMiles: parseFloat(radiusMiles),
            location: { latitude, longitude },
            createdAt: newNeighborhood.created_at,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error creating neighborhood:", error);
      res.status(500).json({ message: "Server error creating neighborhood" });
    }
  }
);

module.exports = router;
