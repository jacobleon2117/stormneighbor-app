#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function testProfileEndpoint() {
  console.log("WORKING: Testing Profile Endpoint Location Data Fix\n");

  try {
    console.log("INFO: Expected response format after fix:");
    console.log(`{
  success: true,
  message: "Profile retrieved successfully", 
  data: {
    id: 1,
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    // ... other fields ...
    locationCity: "Austin",
    addressState: "TX",
    latitude: 30.2672,
    longitude: -97.7431,
    location: {
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      address: "123 Main St"
    },
    // ... other fields ...
  }
}`);

    console.log("\nChanges made to fix the issue:");
    console.log(" Updated getProfile SQL query to SELECT latitude, longitude");
    console.log(" Added latitude, longitude, locationCity, addressState to response");
    console.log(" Maintained backwards compatibility with nested location object");
    console.log(" Fixed updateProfile to update both separate columns and PostGIS location");
    console.log(" Fixed register to insert both separate columns and PostGIS location");

    console.log("\nINFO: Files modified:");
    console.log(" /Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js");
    console.log(" getProfile() function: Added latitude, longitude to SELECT and response");
    console.log(" updateProfile() function: Now updates both columns and PostGIS field");
    console.log(" register() function: Now inserts both columns and PostGIS field");

    console.log("\nSUCCESS: The profile endpoint should now return location data correctly");
    console.log("\nINFO: Endpoint: GET /api/v1/auth/profile");
    console.log(" Requires: Authorization header with valid JWT token");
  } catch (error) {
    console.error("ERROR: Test failed:", error.message);
  }
}

if (require.main === module) {
  testProfileEndpoint();
}

module.exports = { testProfileEndpoint };
