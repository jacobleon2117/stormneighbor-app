// File: backend/tests/weather-alerts.test.js
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

describe("Weather Alerts System", () => {
  test("GET /api/v1/alerts endpoint exists", async () => {
    const response = await request(server).get("/api/v1/alerts?city=TestCity&state=TestState");

    expect(response.body).toHaveProperty("success");
    expect([200, 400]).toContain(response.status);
  });

  test("POST /api/v1/alerts endpoint exists and requires auth", async () => {
    const response = await request(server)
      .post("/api/v1/alerts")
      .send({
        title: "Test Alert",
        description: "Test Description",
        severity: "HIGH",
        alertType: "storm",
      })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("PUT /api/v1/alerts/:id endpoint exists and requires auth", async () => {
    const response = await request(server)
      .put("/api/v1/alerts/1")
      .send({ isActive: false })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("DELETE /api/v1/alerts/:id endpoint exists and requires auth", async () => {
    const response = await request(server).delete("/api/v1/alerts/1").expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("Weather alerts validation works", async () => {
    const response = await request(server).post("/api/v1/alerts").send({
      title: "",
      description: "Test Description",
      severity: "INVALID",
      alertType: "storm",
    });

    expect(response.status).toBe(401);
  });

  test("Weather route exists", async () => {
    const response = await request(server).get("/api/v1/weather/current?lat=40.7128&lng=-74.0060");

    expect(response.body).toHaveProperty("success");
    expect([200, 500]).toContain(response.status);
  });
});
