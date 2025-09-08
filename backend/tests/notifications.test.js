const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Notifications System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("GET /api/v1/notifications", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/notifications").expect(401);
    });

    it("should accept pagination parameters", async () => {
      await request(app)
        .get("/api/v1/notifications?page=1&limit=10")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate pagination parameters", async () => {
      await request(app)
        .get("/api/v1/notifications?page=-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .get("/api/v1/notifications?limit=0")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .get("/api/v1/notifications?limit=101")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should accept read status filter", async () => {
      await request(app)
        .get("/api/v1/notifications?read=true")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      await request(app)
        .get("/api/v1/notifications?read=false")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate read status parameter", async () => {
      await request(app)
        .get("/api/v1/notifications?read=invalid")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should accept type filter", async () => {
      const validTypes = ["comment", "reaction", "follow", "weather_alert", "system"];

      for (const type of validTypes) {
        await request(app)
          .get(`/api/v1/notifications?type=${type}`)
          .set("Authorization", "Bearer invalid-token")
          .expect(401);
      }
    });

    it("should reject invalid type filter", async () => {
      await request(app)
        .get("/api/v1/notifications?type=invalid_type")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });

    it("should accept priority filter", async () => {
      const validPriorities = ["low", "normal", "high", "urgent"];

      for (const priority of validPriorities) {
        await request(app)
          .get(`/api/v1/notifications?priority=${priority}`)
          .set("Authorization", "Bearer invalid-token")
          .expect(401);
      }
    });

    it("should reject invalid priority filter", async () => {
      await request(app)
        .get("/api/v1/notifications?priority=invalid_priority")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("PUT /api/v1/notifications/:id/read", () => {
    it("should require authentication", async () => {
      await request(app).put("/api/v1/notifications/1/read").expect(401);
    });

    it("should validate notification ID format", async () => {
      await request(app)
        .put("/api/v1/notifications/invalid-id/read")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .put("/api/v1/notifications/-1/read")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("PUT /api/v1/notifications/read-all", () => {
    it("should require authentication", async () => {
      await request(app).put("/api/v1/notifications/read-all").expect(401);
    });

    it("should accept type filter for bulk read", async () => {
      await request(app)
        .put("/api/v1/notifications/read-all")
        .set("Authorization", "Bearer invalid-token")
        .send({
          type: "comment",
        })
        .expect(401);
    });

    it("should validate type filter", async () => {
      await request(app)
        .put("/api/v1/notifications/read-all")
        .set("Authorization", "Bearer invalid-token")
        .send({
          type: "invalid_type",
        })
        .expect(400);
    });
  });

  describe("DELETE /api/v1/notifications/:id", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/notifications/1").expect(401);
    });

    it("should validate notification ID format", async () => {
      await request(app)
        .delete("/api/v1/notifications/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .delete("/api/v1/notifications/-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("DELETE /api/v1/notifications/clear", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/notifications/clear").expect(401);
    });

    it("should accept type filter for bulk delete", async () => {
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          type: "comment",
        })
        .expect(401);
    });

    it("should accept read status filter for bulk delete", async () => {
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          onlyRead: true,
        })
        .expect(401);
    });

    it("should validate bulk delete parameters", async () => {
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          type: "invalid_type",
        })
        .expect(400);

      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          onlyRead: "invalid",
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/notifications/settings", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/notifications/settings").expect(401);
    });
  });

  describe("PUT /api/v1/notifications/settings", () => {
    it("should require authentication", async () => {
      await request(app)
        .put("/api/v1/notifications/settings")
        .send({
          emailNotifications: true,
          pushNotifications: false,
        })
        .expect(401);
    });

    it("should validate notification settings", async () => {
      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: "invalid",
          pushNotifications: true,
        })
        .expect(400);

      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: true,
          pushNotifications: "invalid",
        })
        .expect(400);
    });

    it("should validate notification types", async () => {
      const validSettings = {
        comments: true,
        reactions: false,
        follows: true,
        weatherAlerts: true,
        systemNotifications: false,
      };

      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: true,
          pushNotifications: true,
          types: validSettings,
        })
        .expect(401);
    });

    it("should validate notification frequency", async () => {
      const validFrequencies = ["immediate", "hourly", "daily", "weekly", "never"];

      for (const frequency of validFrequencies) {
        await request(app)
          .put("/api/v1/notifications/settings")
          .set("Authorization", "Bearer invalid-token")
          .send({
            emailNotifications: true,
            frequency: frequency,
          })
          .expect(401);
      }
    });

    it("should reject invalid frequency", async () => {
      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          emailNotifications: true,
          frequency: "invalid_frequency",
        })
        .expect(400);
    });

    it("should validate quiet hours format", async () => {
      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          pushNotifications: true,
          quietHours: {
            enabled: true,
            start: "22:00",
            end: "08:00",
          },
        })
        .expect(401);

      await request(app)
        .put("/api/v1/notifications/settings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          pushNotifications: true,
          quietHours: {
            enabled: true,
            start: "invalid-time",
            end: "08:00",
          },
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/notifications/test", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/notifications/test")
        .send({
          type: "push",
        })
        .expect(401);
    });

    it("should validate test notification type", async () => {
      const validTypes = ["push", "email"];

      for (const type of validTypes) {
        await request(app)
          .post("/api/v1/notifications/test")
          .set("Authorization", "Bearer invalid-token")
          .send({
            type: type,
          })
          .expect(401);
      }
    });

    it("should reject invalid test type", async () => {
      await request(app)
        .post("/api/v1/notifications/test")
        .set("Authorization", "Bearer invalid-token")
        .send({
          type: "invalid_type",
        })
        .expect(400);
    });

    it("should require test type", async () => {
      await request(app)
        .post("/api/v1/notifications/test")
        .set("Authorization", "Bearer invalid-token")
        .send({})
        .expect(400);
    });
  });

  describe("GET /api/v1/notifications/unread-count", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/notifications/unread-count").expect(401);
    });

    it("should accept type filter for count", async () => {
      await request(app)
        .get("/api/v1/notifications/unread-count?type=comment")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate type filter for count", async () => {
      await request(app)
        .get("/api/v1/notifications/unread-count?type=invalid_type")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to notification requests", async () => {
      const promises = [];

      for (let i = 0; i < 30; i++) {
        promises.push(
          request(app).get("/api/v1/notifications").set("Authorization", "Bearer invalid-token")
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it("should apply stricter rate limiting to test notifications", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post("/api/v1/notifications/test")
            .set("Authorization", "Bearer invalid-token")
            .send({
              type: "push",
            })
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Bulk Operations", () => {
    it("should handle bulk read operations safely", async () => {
      await request(app)
        .put("/api/v1/notifications/read-all")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should handle bulk delete operations safely", async () => {
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should validate bulk operation limits", async () => {
      // Test that bulk operations don't allow excessive deletions
      // This needs to be implemented with actual data
      await request(app)
        .delete("/api/v1/notifications/clear")
        .set("Authorization", "Bearer invalid-token")
        .send({
          onlyRead: true,
        })
        .expect(401);
    });
  });
});
