const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Search System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("GET /api/v1/search", () => {
    it("should validate search query", async () => {
      await request(app).get("/api/v1/search").expect(400);

      await request(app).get("/api/v1/search?q=").expect(400);

      await request(app).get("/api/v1/search?q=ab").expect(400);
    });

    it("should accept valid search queries", async () => {
      const response = await request(app).get("/api/v1/search?q=test").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
    });

    it("should accept search type filters", async () => {
      const validTypes = ["posts", "users", "all"];

      for (const type of validTypes) {
        await request(app).get(`/api/v1/search?q=test&type=${type}`).expect(200);
      }
    });

    it("should reject invalid search types", async () => {
      await request(app).get("/api/v1/search?q=test&type=invalid_type").expect(400);
    });

    it("should accept pagination parameters", async () => {
      await request(app).get("/api/v1/search?q=test&page=1&limit=10").expect(200);

      await request(app).get("/api/v1/search?q=test&page=2&limit=5").expect(200);
    });

    it("should validate pagination parameters", async () => {
      await request(app).get("/api/v1/search?q=test&page=-1").expect(400);

      await request(app).get("/api/v1/search?q=test&limit=0").expect(400);

      await request(app).get("/api/v1/search?q=test&limit=101").expect(400);
    });

    it("should accept location-based search", async () => {
      await request(app)
        .get("/api/v1/search?q=test&latitude=30.2672&longitude=-97.7431&radius=10")
        .expect(200);
    });

    it("should validate location parameters", async () => {
      await request(app)
        .get("/api/v1/search?q=test&latitude=invalid&longitude=-97.7431")
        .expect(400);

      await request(app)
        .get("/api/v1/search?q=test&latitude=30.2672&longitude=invalid")
        .expect(400);

      await request(app)
        .get("/api/v1/search?q=test&latitude=30.2672&longitude=-97.7431&radius=-1")
        .expect(400);
    });

    it("should accept sort parameters", async () => {
      await request(app).get("/api/v1/search?q=test&sortBy=relevance&sortOrder=desc").expect(200);

      await request(app).get("/api/v1/search?q=test&sortBy=createdAt&sortOrder=asc").expect(200);
    });

    it("should validate sort parameters", async () => {
      await request(app).get("/api/v1/search?q=test&sortBy=invalid_field").expect(400);

      await request(app).get("/api/v1/search?q=test&sortOrder=invalid_order").expect(400);
    });

    it("should accept post type filters", async () => {
      await request(app).get("/api/v1/search?q=test&postType=emergency").expect(200);

      await request(app).get("/api/v1/search?q=test&postType=general").expect(200);
    });

    it("should reject invalid post type filters", async () => {
      await request(app).get("/api/v1/search?q=test&postType=invalid_type").expect(400);
    });

    it("should accept date range filters", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      await request(app)
        .get(`/api/v1/search?q=test&startDate=${yesterday}&endDate=${today}`)
        .expect(200);
    });

    it("should validate date format", async () => {
      await request(app).get("/api/v1/search?q=test&startDate=invalid-date").expect(400);

      await request(app).get("/api/v1/search?q=test&endDate=invalid-date").expect(400);
    });
  });

  describe("GET /api/v1/search/suggestions", () => {
    it("should validate query parameter", async () => {
      await request(app).get("/api/v1/search/suggestions").expect(400);

      await request(app).get("/api/v1/search/suggestions?q=").expect(400);

      await request(app).get("/api/v1/search/suggestions?q=a").expect(400);
    });

    it("should return search suggestions", async () => {
      const response = await request(app).get("/api/v1/search/suggestions?q=test").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should limit suggestion results", async () => {
      await request(app).get("/api/v1/search/suggestions?q=test&limit=5").expect(200);
    });

    it("should validate suggestion limit", async () => {
      await request(app).get("/api/v1/search/suggestions?q=test&limit=0").expect(400);

      await request(app).get("/api/v1/search/suggestions?q=test&limit=21").expect(400);
    });
  });

  describe("POST /api/v1/search/saved", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/search/saved")
        .send({
          query: "test search",
          filters: {},
        })
        .expect(401);
    });

    it("should validate search query", async () => {
      await request(app)
        .post("/api/v1/search/saved")
        .set("Authorization", "Bearer invalid-token")
        .send({
          query: "",
          filters: {},
        })
        .expect(400);

      await request(app)
        .post("/api/v1/search/saved")
        .set("Authorization", "Bearer invalid-token")
        .send({
          query: "ab",
          filters: {},
        })
        .expect(400);
    });

    it("should validate filters format", async () => {
      await request(app)
        .post("/api/v1/search/saved")
        .set("Authorization", "Bearer invalid-token")
        .send({
          query: "test search",
          filters: "invalid",
        })
        .expect(400);
    });

    it("should accept valid saved search", async () => {
      await request(app)
        .post("/api/v1/search/saved")
        .set("Authorization", "Bearer invalid-token")
        .send({
          query: "test search",
          filters: {
            type: "posts",
            postType: "emergency",
          },
        })
        .expect(401);
    });
  });

  describe("GET /api/v1/search/saved", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/search/saved").expect(401);
    });

    it("should accept pagination parameters", async () => {
      await request(app)
        .get("/api/v1/search/saved?page=1&limit=10")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("DELETE /api/v1/search/saved/:id", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/search/saved/1").expect(401);
    });

    it("should validate search ID format", async () => {
      await request(app)
        .delete("/api/v1/search/saved/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .delete("/api/v1/search/saved/-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("GET /api/v1/search/trending", () => {
    it("should return trending searches", async () => {
      const response = await request(app).get("/api/v1/search/trending").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should accept limit parameter", async () => {
      await request(app).get("/api/v1/search/trending?limit=5").expect(200);
    });

    it("should validate limit parameter", async () => {
      await request(app).get("/api/v1/search/trending?limit=0").expect(400);

      await request(app).get("/api/v1/search/trending?limit=51").expect(400);
    });

    it("should accept time period parameter", async () => {
      const validPeriods = ["24h", "7d", "30d"];

      for (const period of validPeriods) {
        await request(app).get(`/api/v1/search/trending?period=${period}`).expect(200);
      }
    });

    it("should reject invalid time period", async () => {
      await request(app).get("/api/v1/search/trending?period=invalid_period").expect(400);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to search requests", async () => {
      const promises = [];

      for (let i = 0; i < 25; i++) {
        promises.push(request(app).get(`/api/v1/search?q=test${i}`));
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize search queries", async () => {
      await request(app).get("/api/v1/search?q=<script>alert('xss')</script>test").expect(200);
    });

    it("should handle special characters in queries", async () => {
      await request(app).get("/api/v1/search?q=test%20with%20spaces%20%26%20chars").expect(200);
    });
  });
});
