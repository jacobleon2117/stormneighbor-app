// File: backend/tests/health.test.js
const request = require("supertest");
const http = require("http");
const app = require("../src/app");
const { cache } = require("../src/middleware/cache");

let server;

beforeAll(() => {
  server = http.createServer(app);
  return new Promise((resolve) => server.listen(0, resolve));
});

afterAll(async () => {
  if (cache.clearCleanupInterval) cache.clearCleanupInterval();

  await new Promise((resolve) => server.close(resolve));
});

describe("Health Check (Clean)", () => {
  test("GET /health returns healthy status", async () => {
    const response = await request(server).get("/health").expect(200);
    expect(response.body).toHaveProperty("status");
    expect(response.body.environment).toBe("test");
  });

  test("GET /analytics works in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const response = await request(server).get("/analytics").expect(200);
    expect(response.body).toHaveProperty("message", "API Analytics");
    expect(response.body).toHaveProperty("data");

    process.env.NODE_ENV = originalEnv;
  });

  test("GET /cache/stats works in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const response = await request(server).get("/api/v1/cache/stats").expect(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("cache");

    process.env.NODE_ENV = originalEnv;
  });
});
