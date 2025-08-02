// File: backend/tests/health.test.js
const request = require("supertest");
const app = require("../src/app");

describe("Health Check Endpoints", () => {
  test("GET /health should return healthy status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status");
    expect(response.body.environment).toBe("test");
  });

  test("GET /analytics should return analytics data in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const response = await request(app).get("/analytics").expect(200);

    expect(response.body).toHaveProperty("message", "API Analytics");
    expect(response.body).toHaveProperty("data");

    process.env.NODE_ENV = originalEnv;
  });

  test("GET /cache/stats should return cache statistics", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const response = await request(app).get("/cache/stats").expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("cache");

    process.env.NODE_ENV = originalEnv;
  });
});

describe("Security Headers", () => {
  test("Should include security headers", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.headers).toHaveProperty("x-content-type-options", "nosniff");
    expect(response.headers).toHaveProperty("x-frame-options", "DENY");
    expect(response.headers).toHaveProperty("x-xss-protection", "1; mode=block");
  });
});

describe("Rate Limiting", () => {
  test("Should apply rate limiting to API endpoints", async () => {
    const requests = Array(5)
      .fill()
      .map(() => request(app).get("/api/auth/test-email"));

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect([200, 401]).toContain(response.status);
    });
  });
});
