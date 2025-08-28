const request = require("supertest");
const app = require("../src/app");

describe("Feedback System", () => {
  let authToken = null;
  let feedbackId = null;

  // Test if feedback endpoints exist
  it("POST /api/v1/feedback endpoint exists and requires auth", async () => {
    const response = await request(app)
      .post("/api/v1/feedback")
      .send({
        feedbackType: "general_feedback",
        title: "Test Feedback",
        description: "This is a test feedback submission",
        priority: "normal"
      });
    
    expect(response.status).toBe(401); // Should require authentication
  });

  it("GET /api/v1/feedback/me endpoint exists and requires auth", async () => {
    const response = await request(app).get("/api/v1/feedback/me");
    expect(response.status).toBe(401); // Should require authentication
  });

  it("GET /api/v1/feedback endpoint exists and requires auth", async () => {
    const response = await request(app).get("/api/v1/feedback");
    expect(response.status).toBe(401); // Should require authentication
  });

  it("GET /api/v1/feedback/stats endpoint exists and requires auth", async () => {
    const response = await request(app).get("/api/v1/feedback/stats");
    expect(response.status).toBe(401); // Should require authentication
  });

  // Validate feedback types
  it("Validates feedback types correctly", async () => {
    const validTypes = ["bug_report", "feature_request", "general_feedback", "ui_ux_feedback"];
    
    for (const type of validTypes) {
      const response = await request(app)
        .post("/api/v1/feedback")
        .send({
          feedbackType: type,
          title: "Test",
          description: "Test description"
        });
      
      // Should fail due to auth, not validation
      expect(response.status).toBe(401);
    }
  });

  it("Rejects invalid feedback types", async () => {
    const response = await request(app)
      .post("/api/v1/feedback")
      .send({
        feedbackType: "invalid_type",
        title: "Test",
        description: "Test description"
      });
    
    // Should fail validation before auth
    expect(response.status).toBe(400);
  });

  it("Validates required fields", async () => {
    // Missing title
    let response = await request(app)
      .post("/api/v1/feedback")
      .send({
        feedbackType: "general_feedback",
        description: "Test description"
      });
    expect(response.status).toBe(400);

    // Missing description
    response = await request(app)
      .post("/api/v1/feedback")
      .send({
        feedbackType: "general_feedback",
        title: "Test"
      });
    expect(response.status).toBe(400);

    // Missing feedbackType
    response = await request(app)
      .post("/api/v1/feedback")
      .send({
        title: "Test",
        description: "Test description"
      });
    expect(response.status).toBe(400);
  });

  it("Validates priority levels", async () => {
    const validPriorities = ["low", "normal", "high"];
    
    for (const priority of validPriorities) {
      const response = await request(app)
        .post("/api/v1/feedback")
        .send({
          feedbackType: "general_feedback",
          title: "Test",
          description: "Test description",
          priority: priority
        });
      
      // Should fail due to auth, not validation
      expect(response.status).toBe(401);
    }
  });

  it("Rejects invalid priority levels", async () => {
    const response = await request(app)
      .post("/api/v1/feedback")
      .send({
        feedbackType: "general_feedback",
        title: "Test",
        description: "Test description",
        priority: "invalid_priority"
      });
    
    expect(response.status).toBe(400);
  });
});