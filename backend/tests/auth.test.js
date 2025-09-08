const request = require("supertest");
const app = require("../src/app");
const { testHelpers } = require("./setup");

describe("Authentication System", () => {
  let testUser;

  beforeEach(() => {
    testUser = testHelpers.createTestUser();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          phone: testUser.phone,
          city: "Austin",
          state: "Texas",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("registered successfully");
    });

    it("should reject registration with invalid email", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email",
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        })
        .expect(400);
    });

    it("should reject registration with weak password", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: "weak",
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        })
        .expect(400);
    });

    it("should reject registration with missing required fields", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: testUser.password,
          // Missing firstName and lastName
        })
        .expect(400);
    });

    it("should reject duplicate email registration", async () => {
      // First registration
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          city: "Austin",
          state: "Texas",
        })
        .expect(201);

      // Duplicate registration
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testUser.email,
          password: "DifferentPass123!",
          firstName: "Different",
          lastName: "Name",
          city: "Dallas",
          state: "Texas",
        })
        .expect(409);
    });
  });

  describe("POST /api/v1/auth/verify-email", () => {
    it("should accept valid verification format", async () => {
      await request(app)
        .post("/api/v1/auth/verify-email")
        .send({
          email: "test@stormneighbor.test",
          code: "123456",
        })
        .expect(400); // Will fail due to invalid code, but validates format
    });

    it("should reject invalid email format", async () => {
      await request(app)
        .post("/api/v1/auth/verify-email")
        .send({
          email: "invalid-email",
          code: "123456",
        })
        .expect(400);
    });

    it("should reject invalid code format", async () => {
      await request(app)
        .post("/api/v1/auth/verify-email")
        .send({
          email: "test@stormneighbor.test",
          code: "invalid",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Create and verify a test user for login tests
      await request(app).post("/api/v1/auth/register").send({
        email: testUser.email,
        password: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        city: "Austin",
        state: "Texas",
      });
    });

    it("should reject login with invalid email format", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalid-email",
          password: testUser.password,
        })
        .expect(400);
    });

    it("should reject login with missing password", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
        })
        .expect(400);
    });

    it("should reject login with wrong password", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);
    });

    it("should reject login for non-existent user", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@stormneighbor.test",
          password: testUser.password,
        })
        .expect(401);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should accept valid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@stormneighbor.test",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("password reset code");
    });

    it("should reject invalid email format", async () => {
      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "invalid-email",
        })
        .expect(400);
    });

    it("should reject missing email", async () => {
      await request(app).post("/api/v1/auth/forgot-password").send({}).expect(400);
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    it("should validate reset password format", async () => {
      await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "test@stormneighbor.test",
          code: "123456",
          newPassword: "NewPassword123!",
        })
        .expect(400); // Will fail due to invalid code, but validates format
    });

    it("should reject invalid email format", async () => {
      await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "invalid-email",
          code: "123456",
          newPassword: "NewPassword123!",
        })
        .expect(400);
    });

    it("should reject weak new password", async () => {
      await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "test@stormneighbor.test",
          code: "123456",
          newPassword: "weak",
        })
        .expect(400);
    });

    it("should reject invalid code format", async () => {
      await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          email: "test@stormneighbor.test",
          code: "invalid",
          newPassword: "NewPassword123!",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/change-password", () => {
    it("should require authentication", async () => {
      await request(app)
        .post("/api/v1/auth/change-password")
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        })
        .expect(401);
    });

    it("should validate password formats", async () => {
      await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", "Bearer invalid-token")
        .send({
          currentPassword: "weak",
          newPassword: "weak",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should require authentication", async () => {
      await request(app).post("/api/v1/auth/logout").expect(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/v1/auth/me").expect(401);
    });

    it("should reject invalid token format", async () => {
      await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject malformed authorization header", async () => {
      await request(app).get("/api/v1/auth/me").set("Authorization", "InvalidFormat").expect(401);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to registration endpoint", async () => {
      const promises = [];

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post("/api/v1/auth/register")
            .send({
              email: `test${i}@stormneighbor.test`,
              password: "TestPassword123!",
              firstName: "Test",
              lastName: "User",
            })
        );
      }

      const responses = await Promise.all(promises);

      // Should have some rate limited responses (429)
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
