const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Weather System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("GET /api/v1/weather/current", () => {
    it("should validate location parameters", async () => {
      await request(app).get("/api/v1/weather/current").expect(400); // Missing location parameters

      await request(app)
        .get("/api/v1/weather/current?latitude=invalid&longitude=-97.7431")
        .expect(400);

      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=invalid")
        .expect(400);
    });

    it("should validate coordinate ranges", async () => {
      await request(app).get("/api/v1/weather/current?latitude=91&longitude=-97.7431").expect(400); // Latitude out of range

      await request(app).get("/api/v1/weather/current?latitude=30.2672&longitude=181").expect(400); // Longitude out of range

      await request(app).get("/api/v1/weather/current?latitude=-91&longitude=-97.7431").expect(400); // Latitude out of range

      await request(app).get("/api/v1/weather/current?latitude=30.2672&longitude=-181").expect(400); // Longitude out of range
    });

    it("should return weather data for valid coordinates", async () => {
      const response = await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("temperature");
      expect(response.body.data).toHaveProperty("condition");
    });

    it("should accept optional units parameter", async () => {
      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431&units=metric")
        .expect(200);

      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431&units=imperial")
        .expect(200);
    });

    it("should reject invalid units", async () => {
      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431&units=invalid")
        .expect(400);
    });
  });

  describe("GET /api/v1/weather/forecast", () => {
    it("should validate location parameters", async () => {
      await request(app).get("/api/v1/weather/forecast").expect(400); // Missing location parameters

      await request(app)
        .get("/api/v1/weather/forecast?latitude=invalid&longitude=-97.7431")
        .expect(400);

      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=invalid")
        .expect(400);
    });

    it("should return forecast data for valid coordinates", async () => {
      const response = await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("forecast");
      expect(Array.isArray(response.body.data.forecast)).toBe(true);
    });

    it("should accept days parameter", async () => {
      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431&days=3")
        .expect(200);

      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431&days=7")
        .expect(200);
    });

    it("should validate days parameter", async () => {
      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431&days=0")
        .expect(400);

      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431&days=15")
        .expect(400); // Assuming max 14 days

      await request(app)
        .get("/api/v1/weather/forecast?latitude=30.2672&longitude=-97.7431&days=invalid")
        .expect(400);
    });
  });

  describe("GET /api/v1/weather/alerts", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/weather/alerts").expect(401);
    });

    it("should accept location override parameters", async () => {
      await request(app)
        .get("/api/v1/weather/alerts?latitude=30.2672&longitude=-97.7431")
        .set("Authorization", "Bearer invalid-token")
        .expect(401); // Will fail auth, but validates location params
    });

    it("should validate location parameters if provided", async () => {
      await request(app)
        .get("/api/v1/weather/alerts?latitude=invalid&longitude=-97.7431")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .get("/api/v1/weather/alerts?latitude=30.2672&longitude=invalid")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should accept severity filter", async () => {
      const validSeverities = ["minor", "moderate", "severe", "extreme"];

      for (const severity of validSeverities) {
        await request(app)
          .get(`/api/v1/weather/alerts?severity=${severity}`)
          .set("Authorization", "Bearer invalid-token")
          .expect(401); // Will fail auth, but validates severity
      }
    });

    it("should reject invalid severity", async () => {
      await request(app)
        .get("/api/v1/weather/alerts?severity=invalid")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should accept active filter", async () => {
      await request(app)
        .get("/api/v1/weather/alerts?active=true")
        .set("Authorization", "Bearer invalid-token")
        .expect(401); // Will fail auth, but validates active param

      await request(app)
        .get("/api/v1/weather/alerts?active=false")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate active parameter", async () => {
      await request(app)
        .get("/api/v1/weather/alerts?active=invalid")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("POST /api/v1/weather/alerts", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "Severe thunderstorm warning",
        })
        .expect(401);
    });

    it("should validate alert type", async () => {
      const validTypes = [
        "storm_warning",
        "flood_warning",
        "heat_advisory",
        "winter_weather",
        "other",
      ];

      for (const type of validTypes) {
        await request(app)
          .post("/api/v1/weather/alerts")
          .set("Authorization", "Bearer invalid-token")
          .send({
            alertType: type,
            severity: "moderate",
            description: "Test alert",
          })
          .expect(401); // Will fail auth, but validates type
      }
    });

    it("should reject invalid alert type", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "invalid_type",
          severity: "moderate",
          description: "Test alert",
        })
        .expect(400);
    });

    it("should validate severity", async () => {
      const validSeverities = ["minor", "moderate", "severe", "extreme"];

      for (const severity of validSeverities) {
        await request(app)
          .post("/api/v1/weather/alerts")
          .set("Authorization", "Bearer invalid-token")
          .send({
            alertType: "storm_warning",
            severity: severity,
            description: "Test alert",
          })
          .expect(401); // Will fail auth, but validates severity
      }
    });

    it("should reject invalid severity", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "invalid_severity",
          description: "Test alert",
        })
        .expect(400);
    });

    it("should validate required fields", async () => {
      // Missing alertType
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          severity: "moderate",
          description: "Test alert",
        })
        .expect(400);

      // Missing severity
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          description: "Test alert",
        })
        .expect(400);

      // Missing description
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
        })
        .expect(400);
    });

    it("should validate description length", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "", // Empty description
        })
        .expect(400);

      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "a".repeat(1001), // Too long
        })
        .expect(400);
    });

    it("should validate expiration date format", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "Test alert",
          expiresAt: "invalid-date",
        })
        .expect(400);
    });

    it("should validate location parameters", async () => {
      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "Test alert",
          latitude: "invalid",
          longitude: -97.7431,
        })
        .expect(400);

      await request(app)
        .post("/api/v1/weather/alerts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          alertType: "storm_warning",
          severity: "moderate",
          description: "Test alert",
          latitude: 30.2672,
          longitude: "invalid",
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/weather/alerts/:id", () => {
    it("should validate alert ID format", async () => {
      await request(app).get("/api/v1/weather/alerts/invalid-id").expect(400);

      await request(app).get("/api/v1/weather/alerts/-1").expect(400);
    });

    it("should return 404 for non-existent alert", async () => {
      await request(app).get("/api/v1/weather/alerts/99999").expect(404);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to weather requests", async () => {
      const promises = [];

      // Make multiple rapid requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app).get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431")
        );
      }

      const responses = await Promise.all(promises);

      // Should have some rate limited responses (429)
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Caching", () => {
    it("should cache weather responses", async () => {
      const start = Date.now();

      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431")
        .expect(200);

      const firstRequestTime = Date.now() - start;

      const start2 = Date.now();

      await request(app)
        .get("/api/v1/weather/current?latitude=30.2672&longitude=-97.7431")
        .expect(200);

      const secondRequestTime = Date.now() - start2;

      // Second request should be faster due to caching
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });
});
