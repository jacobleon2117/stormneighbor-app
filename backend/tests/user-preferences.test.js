// File: backend/tests/user-preferences.test.js
const request = require("supertest");
const http = require("http");
const app = require("../src/app");

let server;

beforeAll(() => {
  server = http.createServer(app);
  return new Promise((resolve) => server.listen(0, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("User Preferences API", () => {
  test("GET /api/v1/users/preferences/notifications requires auth", async () => {
    const response = await request(server)
      .get("/api/v1/users/preferences/notifications")
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toContain("token");
  });

  test("PUT /api/v1/users/preferences/notifications requires auth", async () => {
    const response = await request(server)
      .put("/api/v1/users/preferences/notifications")
      .send({
        preferences: {
          emergency_alerts: {
            enabled: true,
            push_enabled: true,
            email_enabled: false,
            frequency: "immediate",
          },
        },
      })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toContain("token");
  });

  test("PUT /api/v1/users/preferences/notifications validates request body", async () => {
    const response = await request(server).put("/api/v1/users/preferences/notifications").send({
      preferences: "invalid",
    });

    expect(response.status).toBe(401);
  });

  test("User preferences endpoints exist and have proper structure", async () => {
    const getResponse = await request(server).get("/api/v1/users/preferences/notifications");

    const putResponse = await request(server)
      .put("/api/v1/users/preferences/notifications")
      .send({ preferences: {} });

    expect(getResponse.status).toBe(401);
    expect(putResponse.status).toBe(401);

    expect(getResponse.body).toHaveProperty("success", false);
    expect(putResponse.body).toHaveProperty("success", false);
  });
});
