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

describe("Report System", () => {
  test("POST /api/v1/posts/:id/report endpoint exists and validates properly", async () => {
    const response = await request(server)
      .post("/api/v1/posts/1/report")
      .send({ reason: "spam" })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toContain("auth");
  });

  test("POST /api/v1/comments/:id/report endpoint exists and validates properly", async () => {
    const response = await request(server)
      .post("/api/v1/comments/1/report")
      .send({ reason: "harassment" })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toContain("auth");
  });

  test("GET /api/v1/admin/reports endpoint exists and requires admin auth", async () => {
    const response = await request(server).get("/api/v1/admin/reports").expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("PUT /api/v1/admin/reports/:id endpoint exists and requires admin auth", async () => {
    const response = await request(server)
      .put("/api/v1/admin/reports/1")
      .send({ action: "approved" })
      .expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("GET /api/v1/admin/reports/stats endpoint exists and requires admin auth", async () => {
    const response = await request(server).get("/api/v1/admin/reports/stats").expect(401);

    expect(response.body).toHaveProperty("success", false);
  });

  test("Report validation works for invalid reasons", async () => {
    const response = await request(server)
      .post("/api/v1/posts/1/report")
      .send({ reason: "invalid_reason" });

    expect(response.status).toBe(401);
  });
});
