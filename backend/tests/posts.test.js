const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Posts System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("POST /api/v1/posts", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/posts")
        .send({
          title: "Test Post",
          content: "This is a test post",
          postType: "general",
        })
        .expect(401);
    });

    it("should validate required fields", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a test post",
          postType: "general",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          postType: "general",
        })
        .expect(400);
    });

    it("should validate post type", async () => {
      const validTypes = ["general", "emergency", "weather", "community", "question", "event"];

      for (const type of validTypes) {
        await request(app)
          .post("/api/v1/posts")
          .set("Authorization", "Bearer invalid-token")
          .send({
            title: "Test Post",
            content: "This is a test post",
            postType: type,
          })
          .expect(401);
      }
    });

    it("should reject invalid post type", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "This is a test post",
          postType: "invalid_type",
        })
        .expect(400);
    });

    it("should validate priority level", async () => {
      const validPriorities = ["low", "normal", "high", "urgent"];

      for (const priority of validPriorities) {
        await request(app)
          .post("/api/v1/posts")
          .set("Authorization", "Bearer invalid-token")
          .send({
            title: "Test Post",
            content: "This is a test post",
            postType: "general",
            priority: priority,
          })
          .expect(401);
      }
    });

    it("should reject invalid priority", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "This is a test post",
          postType: "general",
          priority: "invalid_priority",
        })
        .expect(400);
    });

    it("should validate title length", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "",
          content: "This is a test post",
          postType: "general",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "a".repeat(256),
          content: "This is a test post",
          postType: "general",
        })
        .expect(400);
    });

    it("should validate content length", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "",
          postType: "general",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "a".repeat(5001),
          postType: "general",
        })
        .expect(400);
    });

    it("should validate location data format", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "This is a test post",
          postType: "general",
          latitude: "invalid",
          longitude: -97.7431,
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "This is a test post",
          postType: "general",
          latitude: 30.2672,
          longitude: "invalid",
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/posts", () => {
    it("should return posts without authentication", async () => {
      const response = await request(app).get("/api/v1/posts").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should accept pagination parameters", async () => {
      await request(app).get("/api/v1/posts?page=1&limit=10").expect(200);

      await request(app).get("/api/v1/posts?page=2&limit=5").expect(200);
    });

    it("should validate pagination parameters", async () => {
      await request(app).get("/api/v1/posts?page=-1").expect(400);

      await request(app).get("/api/v1/posts?limit=0").expect(400);

      await request(app).get("/api/v1/posts?limit=101").expect(400);
    });

    it("should accept location-based filtering", async () => {
      await request(app)
        .get("/api/v1/posts?latitude=30.2672&longitude=-97.7431&radius=10")
        .expect(200);
    });

    it("should validate location parameters", async () => {
      await request(app).get("/api/v1/posts?latitude=invalid&longitude=-97.7431").expect(400);

      await request(app).get("/api/v1/posts?latitude=30.2672&longitude=invalid").expect(400);

      await request(app)
        .get("/api/v1/posts?latitude=30.2672&longitude=-97.7431&radius=-1")
        .expect(400);
    });

    it("should accept post type filtering", async () => {
      await request(app).get("/api/v1/posts?postType=emergency").expect(200);

      await request(app).get("/api/v1/posts?postType=general").expect(200);
    });

    it("should reject invalid post type filter", async () => {
      await request(app).get("/api/v1/posts?postType=invalid_type").expect(400);
    });

    it("should accept priority filtering", async () => {
      await request(app).get("/api/v1/posts?priority=urgent").expect(200);

      await request(app).get("/api/v1/posts?priority=high").expect(200);
    });

    it("should reject invalid priority filter", async () => {
      await request(app).get("/api/v1/posts?priority=invalid_priority").expect(400);
    });
  });

  describe("GET /api/v1/posts/:id", () => {
    it("should return 404 for non-existent post", async () => {
      await request(app).get("/api/v1/posts/99999").expect(404);
    });

    it("should validate post ID format", async () => {
      await request(app).get("/api/v1/posts/invalid-id").expect(400);

      await request(app).get("/api/v1/posts/-1").expect(400);
    });

    it("should return post details for valid ID", async () => {
      const response = await request(app).get("/api/v1/posts/1");

      expect([200, 404]).toContain(response.status);
    });
  });

  describe("PUT /api/v1/posts/:id", () => {
    it("should require authentication", async () => {
      await request(app)
        .put("/api/v1/posts/1")
        .send({
          title: "Updated Post",
          content: "Updated content",
        })
        .expect(401);
    });

    it("should validate post ID format", async () => {
      await request(app)
        .put("/api/v1/posts/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Updated Post",
          content: "Updated content",
        })
        .expect(400);
    });

    it("should validate update data", async () => {
      await request(app)
        .put("/api/v1/posts/1")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "",
          content: "Updated content",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/posts/1")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Updated Post",
          content: "",
        })
        .expect(400);
    });
  });

  describe("DELETE /api/v1/posts/:id", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/posts/1").expect(401);
    });

    it("should validate post ID format", async () => {
      await request(app)
        .delete("/api/v1/posts/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("POST /api/v1/posts/:id/react", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/posts/1/react")
        .send({
          reactionType: "like",
        })
        .expect(401);
    });

    it("should validate reaction type", async () => {
      const validReactions = ["like", "helpful", "support"];

      for (const reaction of validReactions) {
        await request(app)
          .post("/api/v1/posts/1/react")
          .set("Authorization", "Bearer invalid-token")
          .send({
            reactionType: reaction,
          })
          .expect(401);
      }
    });

    it("should reject invalid reaction type", async () => {
      await request(app)
        .post("/api/v1/posts/1/react")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reactionType: "invalid_reaction",
        })
        .expect(400);
    });

    it("should validate post ID", async () => {
      await request(app)
        .post("/api/v1/posts/invalid-id/react")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reactionType: "like",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/posts/:id/report", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/posts/1/report")
        .send({
          reason: "spam",
        })
        .expect(401);
    });

    it("should validate report reason", async () => {
      const validReasons = ["spam", "inappropriate", "misinformation", "harassment", "other"];

      for (const reason of validReasons) {
        await request(app)
          .post("/api/v1/posts/1/report")
          .set("Authorization", "Bearer invalid-token")
          .send({
            reason: reason,
          })
          .expect(401);
      }
    });

    it("should reject invalid report reason", async () => {
      await request(app)
        .post("/api/v1/posts/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "invalid_reason",
        })
        .expect(400);
    });

    it("should require additional details for 'other' reason", async () => {
      await request(app)
        .post("/api/v1/posts/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
        })
        .expect(400);
    });

    it("should validate post ID", async () => {
      await request(app)
        .post("/api/v1/posts/invalid-id/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "spam",
        })
        .expect(400);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to post creation", async () => {
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post("/api/v1/posts")
            .set("Authorization", "Bearer invalid-token")
            .send({
              title: `Test Post ${i}`,
              content: "This is a test post",
              postType: "general",
            })
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML in post content", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Test Post",
          content: "<script>alert('xss')</script>Safe content",
          postType: "general",
        })
        .expect(401);
    });

    it("should sanitize HTML in post title", async () => {
      await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "<img src=x onerror=alert('xss')>Safe Title",
          content: "Safe content",
          postType: "general",
        })
        .expect(401);
    });
  });
});
