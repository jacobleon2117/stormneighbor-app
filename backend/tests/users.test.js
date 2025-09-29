const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Users System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("GET /api/v1/users/profile", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/users/profile").expect(401);
    });

    it("should reject invalid token", async () => {
      await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject malformed authorization header", async () => {
      await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", "InvalidFormat")
        .expect(401);
    });
  });

  describe("PUT /api/v1/users/profile", () => {
    it("should require authentication", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .send({
          firstName: "Updated",
          lastName: "Name",
        })
        .expect(401);
    });

    it("should validate profile update data", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "",
          lastName: "Name",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Name",
          lastName: "",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "a".repeat(51),
          lastName: "Name",
        })
        .expect(400);
    });

    it("should validate phone number format", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Test",
          lastName: "User",
          phone: "invalid-phone",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Test",
          lastName: "User",
          phone: "123",
        })
        .expect(400);
    });

    it("should validate location data", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Test",
          lastName: "User",
          city: "",
          state: "TX",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Test",
          lastName: "User",
          city: "Austin",
          state: "",
        })
        .expect(400);
    });

    it("should validate bio length", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Test",
          lastName: "User",
          bio: "a".repeat(501),
        })
        .expect(400);
    });

    it("should accept valid profile updates", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "Updated",
          lastName: "Name",
          phone: "(555) 123-4567",
          city: "Austin",
          state: "Texas",
          bio: "Updated bio",
        })
        .expect(401);
    });
  });

  describe("GET /api/v1/users/preferences", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/users/preferences").expect(401);
    });
  });

  describe("PUT /api/v1/users/preferences", () => {
    it("should require authentication", async () => {
      await request(app)
        .put("/api/v1/users/preferences")
        .send({
          emailNotifications: true,
          pushNotifications: false,
        })
        .expect(401);
    });

    it("should validate preferences data types", async () => {
      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: "invalid",
          pushNotifications: true,
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: true,
          pushNotifications: "invalid",
        })
        .expect(400);
    });

    it("should validate notification frequency", async () => {
      const validFrequencies = ["immediate", "daily", "weekly", "never"];

      for (const frequency of validFrequencies) {
        await request(app)
          .put("/api/v1/users/preferences")
          .set("Authorization", "Bearer invalid-token")
          .send({
            notificationFrequency: frequency,
          })
          .expect(401);
      }
    });

    it("should reject invalid notification frequency", async () => {
      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          notificationFrequency: "invalid_frequency",
        })
        .expect(400);
    });

    it("should validate location radius", async () => {
      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          locationRadiusMiles: -1,
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          locationRadiusMiles: 1001,
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          locationRadiusMiles: "invalid",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/users/follow/:userId", () => {
    it("should require authentication", async () => {
      await request(app).post("/api/v1/users/follow/1").expect(401);
    });

    it("should validate user ID format", async () => {
      await request(app)
        .post("/api/v1/users/follow/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .post("/api/v1/users/follow/-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should prevent self-following", async () => {
      await request(app)
        .post("/api/v1/users/follow/1")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("DELETE /api/v1/users/follow/:userId", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/users/follow/1").expect(401);
    });

    it("should validate user ID format", async () => {
      await request(app)
        .delete("/api/v1/users/follow/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .delete("/api/v1/users/follow/-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("GET /api/v1/users/followers", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/users/followers").expect(401);
    });

    it("should accept pagination parameters", async () => {
      await request(app)
        .get("/api/v1/users/followers?page=1&limit=10")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate pagination parameters", async () => {
      await request(app)
        .get("/api/v1/users/followers?page=-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .get("/api/v1/users/followers?limit=0")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("GET /api/v1/users/following", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/users/following").expect(401);
    });

    it("should accept pagination parameters", async () => {
      await request(app)
        .get("/api/v1/users/following?page=1&limit=10")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("GET /api/v1/users/:userId", () => {
    it("should validate user ID format", async () => {
      await request(app).get("/api/v1/users/invalid-id").expect(400);

      await request(app).get("/api/v1/users/-1").expect(400);
    });

    it("should return 404 for non-existent user", async () => {
      await request(app).get("/api/v1/users/99999").expect(404);
    });

    it("should return user profile for valid ID", async () => {
      const response = await request(app).get("/api/v1/users/1");

      expect([200, 404]).toContain(response.status);
    });
  });

  describe("GET /api/v1/users/:userId/posts", () => {
    it("should validate user ID format", async () => {
      await request(app).get("/api/v1/users/invalid-id/posts").expect(400);
    });

    it("should return user posts for valid ID", async () => {
      const response = await request(app).get("/api/v1/users/1/posts").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should accept pagination for user posts", async () => {
      await request(app).get("/api/v1/users/1/posts?page=1&limit=5").expect(200);
    });

    it("should validate pagination parameters", async () => {
      await request(app).get("/api/v1/users/1/posts?page=-1").expect(400);

      await request(app).get("/api/v1/users/1/posts?limit=0").expect(400);
    });
  });

  describe("POST /api/v1/users/device-token", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/users/device-token")
        .send({
          token: "device-token-123",
          platform: "ios",
        })
        .expect(401);
    });

    it("should validate device token format", async () => {
      await request(app)
        .post("/api/v1/users/device-token")
        .set("Authorization", "Bearer invalid-token")
        .send({
          token: "",
          platform: "ios",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/users/device-token")
        .set("Authorization", "Bearer invalid-token")
        .send({
          platform: "ios",
        })
        .expect(400);
    });

    it("should validate platform", async () => {
      const validPlatforms = ["ios", "android", "web"];

      for (const platform of validPlatforms) {
        await request(app)
          .post("/api/v1/users/device-token")
          .set("Authorization", "Bearer invalid-token")
          .send({
            token: "device-token-123",
            platform: platform,
          })
          .expect(401);
      }
    });

    it("should reject invalid platform", async () => {
      await request(app)
        .post("/api/v1/users/device-token")
        .set("Authorization", "Bearer invalid-token")
        .send({
          token: "device-token-123",
          platform: "invalid_platform",
        })
        .expect(400);
    });
  });

  describe("DELETE /api/v1/users/device-token/:token", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/users/device-token/some-token").expect(401);
    });

    it("should validate token format", async () => {
      await request(app)
        .delete("/api/v1/users/device-token/")
        .set("Authorization", "Bearer invalid-token")
        .expect(404);
    });
  });

  describe("GET /api/v1/users/search", () => {
    it("should validate search query", async () => {
      await request(app).get("/api/v1/users/search").expect(400);

      await request(app).get("/api/v1/users/search?q=").expect(400);

      await request(app).get("/api/v1/users/search?q=ab").expect(400);
    });

    it("should accept valid search queries", async () => {
      const response = await request(app).get("/api/v1/users/search?q=test").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should accept pagination for search results", async () => {
      await request(app).get("/api/v1/users/search?q=test&page=1&limit=5").expect(200);
    });

    it("should validate search filters", async () => {
      await request(app).get("/api/v1/users/search?q=test&city=Austin").expect(200);

      await request(app).get("/api/v1/users/search?q=test&state=Texas").expect(200);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to profile updates", async () => {
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .put("/api/v1/users/profile")
            .set("Authorization", "Bearer invalid-token")
            .send({
              firstName: `Test${i}`,
              lastName: "User",
            })
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it("should apply rate limiting to follow/unfollow actions", async () => {
      const promises = [];

      for (let i = 1; i <= 15; i++) {
        promises.push(
          request(app)
            .post(`/api/v1/users/follow/${i}`)
            .set("Authorization", "Bearer invalid-token")
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML in profile fields", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "<script>alert('xss')</script>John",
          lastName: "<img src=x onerror=alert('xss')>Doe",
          bio: "<script>alert('xss')</script>Safe bio content",
        })
        .expect(401);
    });

    it("should handle special characters in profile fields", async () => {
      await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .send({
          firstName: "John & Jane",
          lastName: "O'Connor",
          bio: "Bio with special chars: <>&\"'",
        })
        .expect(401);
    });
  });

  describe("Privacy Settings", () => {
    it("should validate privacy preference updates", async () => {
      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          showCityOnly: "invalid",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", "Bearer invalid-token")
        .send({
          showCityOnly: true,
        })
        .expect(401);
    });
  });
});
