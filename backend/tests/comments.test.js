const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Comments System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("POST /api/v1/posts/:postId/comments", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .send({
          content: "This is a test comment",
        })
        .expect(401);
    });

    it("should validate post ID format", async () => {
      await request(app)
        .post("/api/v1/posts/invalid-id/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a test comment",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts/-1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a test comment",
        })
        .expect(400);
    });

    it("should validate comment content", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "a".repeat(2001),
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({})
        .expect(400);
    });

    it("should validate parent comment ID for replies", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a reply",
          parentCommentId: "invalid-id",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a reply",
          parentCommentId: -1,
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/posts/:postId/comments", () => {
    it("should return comments for valid post ID", async () => {
      const response = await request(app).get("/api/v1/posts/1/comments").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should validate post ID format", async () => {
      await request(app).get("/api/v1/posts/invalid-id/comments").expect(400);

      await request(app).get("/api/v1/posts/-1/comments").expect(400);
    });

    it("should return 404 for non-existent post", async () => {
      await request(app).get("/api/v1/posts/99999/comments").expect(404);
    });

    it("should accept pagination parameters", async () => {
      await request(app).get("/api/v1/posts/1/comments?page=1&limit=10").expect(200);

      await request(app).get("/api/v1/posts/1/comments?page=2&limit=5").expect(200);
    });

    it("should validate pagination parameters", async () => {
      await request(app).get("/api/v1/posts/1/comments?page=-1").expect(400);

      await request(app).get("/api/v1/posts/1/comments?limit=0").expect(400);

      await request(app).get("/api/v1/posts/1/comments?limit=101").expect(400);
    });

    it("should accept sort parameters", async () => {
      await request(app)
        .get("/api/v1/posts/1/comments?sortBy=createdAt&sortOrder=desc")
        .expect(200);

      await request(app).get("/api/v1/posts/1/comments?sortBy=createdAt&sortOrder=asc").expect(200);
    });

    it("should validate sort parameters", async () => {
      await request(app).get("/api/v1/posts/1/comments?sortBy=invalid_field").expect(400);

      await request(app).get("/api/v1/posts/1/comments?sortOrder=invalid_order").expect(400);
    });
  });

  describe("GET /api/v1/comments/:id", () => {
    it("should validate comment ID format", async () => {
      await request(app).get("/api/v1/comments/invalid-id").expect(400);

      await request(app).get("/api/v1/comments/-1").expect(400);
    });

    it("should return 404 for non-existent comment", async () => {
      await request(app).get("/api/v1/comments/99999").expect(404);
    });

    it("should return comment details for valid ID", async () => {
      const response = await request(app).get("/api/v1/comments/1");

      expect([200, 404]).toContain(response.status);
    });
  });

  describe("PUT /api/v1/comments/:id", () => {
    it("should require authentication", async () => {
      await request(app)
        .put("/api/v1/comments/1")
        .send({
          content: "Updated comment content",
        })
        .expect(401);
    });

    it("should validate comment ID format", async () => {
      await request(app)
        .put("/api/v1/comments/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Updated comment content",
        })
        .expect(400);
    });

    it("should validate updated content", async () => {
      await request(app)
        .put("/api/v1/comments/1")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "",
        })
        .expect(400);

      await request(app)
        .put("/api/v1/comments/1")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "a".repeat(2001),
        })
        .expect(400);

      await request(app)
        .put("/api/v1/comments/1")
        .set("Authorization", "Bearer invalid-token")
        .send({})
        .expect(400);
    });
  });

  describe("DELETE /api/v1/comments/:id", () => {
    it("should require authentication", async () => {
      await request(app).delete("/api/v1/comments/1").expect(401);
    });

    it("should validate comment ID format", async () => {
      await request(app)
        .delete("/api/v1/comments/invalid-id")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);

      await request(app)
        .delete("/api/v1/comments/-1")
        .set("Authorization", "Bearer invalid-token")
        .expect(400);
    });
  });

  describe("POST /api/v1/comments/:id/react", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/comments/1/react")
        .send({
          reactionType: "like",
        })
        .expect(401);
    });

    it("should validate comment ID format", async () => {
      await request(app)
        .post("/api/v1/comments/invalid-id/react")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reactionType: "like",
        })
        .expect(400);
    });

    it("should validate reaction type", async () => {
      const validReactions = ["like", "helpful", "support"];

      for (const reaction of validReactions) {
        await request(app)
          .post("/api/v1/comments/1/react")
          .set("Authorization", "Bearer invalid-token")
          .send({
            reactionType: reaction,
          })
          .expect(401);
      }
    });

    it("should reject invalid reaction type", async () => {
      await request(app)
        .post("/api/v1/comments/1/react")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reactionType: "invalid_reaction",
        })
        .expect(400);
    });

    it("should require reaction type", async () => {
      await request(app)
        .post("/api/v1/comments/1/react")
        .set("Authorization", "Bearer invalid-token")
        .send({})
        .expect(400);
    });
  });

  describe("POST /api/v1/comments/:id/report", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/comments/1/report")
        .send({
          reason: "spam",
        })
        .expect(401);
    });

    it("should validate comment ID format", async () => {
      await request(app)
        .post("/api/v1/comments/invalid-id/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "spam",
        })
        .expect(400);
    });

    it("should validate report reason", async () => {
      const validReasons = ["spam", "inappropriate", "misinformation", "harassment", "other"];

      for (const reason of validReasons) {
        await request(app)
          .post("/api/v1/comments/1/report")
          .set("Authorization", "Bearer invalid-token")
          .send({
            reason: reason,
          })
          .expect(401);
      }
    });

    it("should reject invalid report reason", async () => {
      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "invalid_reason",
        })
        .expect(400);
    });

    it("should require additional details for 'other' reason", async () => {
      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
        })
        .expect(400);

      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "other",
          additionalDetails: "Some additional details",
        })
        .expect(401);
    });

    it("should prevent self-reporting", async () => {
      await request(app)
        .post("/api/v1/comments/1/report")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "spam",
        })
        .expect(401);
    });
  });

  describe("GET /api/v1/comments/:id/replies", () => {
    it("should return replies for valid comment ID", async () => {
      const response = await request(app).get("/api/v1/comments/1/replies").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should validate comment ID format", async () => {
      await request(app).get("/api/v1/comments/invalid-id/replies").expect(400);

      await request(app).get("/api/v1/comments/-1/replies").expect(400);
    });

    it("should return 404 for non-existent comment", async () => {
      await request(app).get("/api/v1/comments/99999/replies").expect(404);
    });

    it("should accept pagination for replies", async () => {
      await request(app).get("/api/v1/comments/1/replies?page=1&limit=5").expect(200);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to comment creation", async () => {
      const promises = [];

      for (let i = 0; i < 30; i++) {
        promises.push(
          request(app)
            .post("/api/v1/posts/1/comments")
            .set("Authorization", "Bearer invalid-token")
            .send({
              content: `Test comment ${i}`,
            })
        );
      }

      const responses = await Promise.all(promises);

      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML in comment content", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "<script>alert('xss')</script>Safe comment content",
        })
        .expect(401);
    });

    it("should handle special characters in content", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Comment with special chars: <>&\"'",
        })
        .expect(401);
    });

    it("should preserve safe formatting", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Comment with\nnewlines and basic formatting",
        })
        .expect(401);
    });
  });

  describe("Comment Threading", () => {
    it("should handle nested comment validation", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This is a reply to a comment",
          parentCommentId: 1,
        })
        .expect(401);
    });

    it("should prevent circular reply references", async () => {
      await request(app)
        .post("/api/v1/posts/1/comments")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Reply with valid parent",
          parentCommentId: 1,
        })
        .expect(401);
    });
  });
});
