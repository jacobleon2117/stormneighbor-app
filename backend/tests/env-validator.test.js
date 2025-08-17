// File: backend/tests/env-validator.test.js
const EnvironmentValidator = require("../src/utils/envValidator");

describe("Environment Validator", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    const validatorVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "PORT",
      "NODE_ENV",
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
      "NOAA_API_BASE_URL",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "CORS_ORIGIN",
      "RATE_LIMIT_WINDOW_MS",
      "RATE_LIMIT_MAX_REQUESTS",
    ];

    validatorVars.forEach((varName) => {
      delete process.env[varName];
    });
  });

  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
  });

  test("validates required environment variables", () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((error) => error.includes("DATABASE_URL"))).toBe(true);
    expect(result.errors.some((error) => error.includes("JWT_SECRET"))).toBe(true);
  });

  test("passes validation with valid configuration", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    process.env.JWT_SECRET = "this-is-a-very-long-jwt-secret-key-for-testing";

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    if (!result.isValid) {
      console.log("Validation errors:", result.errors);
      console.log("Validation warnings:", result.warnings);
    }

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/testdb");
    expect(result.config.JWT_SECRET).toBe("this-is-a-very-long-jwt-secret-key-for-testing");
  });

  test("validates JWT_SECRET length", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    process.env.JWT_SECRET = "short";

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("JWT_SECRET"))).toBe(true);
  });

  test("validates DATABASE_URL format", () => {
    process.env.DATABASE_URL = "invalid-url";
    process.env.JWT_SECRET = "this-is-a-very-long-jwt-secret-key-for-testing";

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("DATABASE_URL"))).toBe(true);
  });

  test("applies default values correctly", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    process.env.JWT_SECRET = "this-is-a-very-long-jwt-secret-key-for-testing";
    delete process.env.PORT;
    delete process.env.NODE_ENV;

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(true);
    expect(process.env.PORT).toBe("3000");
    expect(process.env.NODE_ENV).toBe("development");
  });

  test("validates PORT as a number", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    process.env.JWT_SECRET = "this-is-a-very-long-jwt-secret-key-for-testing";
    process.env.PORT = "invalid-port";

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("PORT"))).toBe(true);
  });

  test("validates NODE_ENV values", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    process.env.JWT_SECRET = "this-is-a-very-long-jwt-secret-key-for-testing";
    process.env.NODE_ENV = "invalid-env";

    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("NODE_ENV"))).toBe(true);
  });

  test("masks sensitive values correctly", () => {
    const validator = new EnvironmentValidator();

    expect(validator.maskSensitive("JWT_SECRET", "short")).toBe("*****");
    expect(validator.maskSensitive("JWT_SECRET", "verylongpassword")).toBe("very****word");
    expect(validator.maskSensitive("PORT", "3000")).toBe("3000");
  });

  test("generates required variables list", () => {
    const validator = new EnvironmentValidator();
    const required = validator.getRequiredVariables();

    expect(required.length).toBeGreaterThan(0);
    expect(required.some((v) => v.name === "DATABASE_URL")).toBe(true);
    expect(required.some((v) => v.name === "JWT_SECRET")).toBe(true);
  });

  test("generates environment template", () => {
    const validator = new EnvironmentValidator();
    const template = validator.generateEnvTemplate();

    expect(template).toContain("DATABASE_URL=");
    expect(template).toContain("JWT_SECRET=");
    expect(template).toContain("# Environment Configuration");
  });
});
