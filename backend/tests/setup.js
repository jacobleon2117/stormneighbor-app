process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_for_testing_only";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/stormneighbor_test";
process.env.DATABASE_SSL = "false";
process.env.RESEND_API_KEY = "fake_key_for_testing";
process.env.FROM_EMAIL = "test@stormneighbor.test";
process.env.FROM_NAME = "StormNeighbor Test";
process.env.NOAA_API_BASE_URL = "https://api.weather.gov";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "123456789";
process.env.CLOUDINARY_API_SECRET = "test_secret";

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

jest.setTimeout(30000);

let cleanupHandlers = [];

global.registerCleanup = (handler) => {
  cleanupHandlers.push(handler);
};

afterEach(() => {
  jest.clearAllTimers();
  cleanupHandlers.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      // Silent cleanup errors during testing
    }
  });
});

afterAll(async () => {
  // Clear cache cleanup interval to prevent test hanging
  const cache = require("../src/middleware/cache");
  if (cache.cache && cache.cache.clearCleanupInterval) {
    cache.cache.clearCleanupInterval();
  }

  const security = require("../src/middleware/security");

  try {
    if (cache && typeof cache.clearCleanupInterval === "function") {
      cache.clearCleanupInterval();
    }
  } catch (error) {
    // Silent cleanup errors during testing
  }

  try {
    if (security && typeof security.clearCleanupInterval === "function") {
      security.clearCleanupInterval();
    }
  } catch (error) {
    // Silent cleanup errors during testing
  }

  cleanupHandlers.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      // Silent cleanup errors during testing
    }
  });
  cleanupHandlers = [];
});

global.testHelpers = {
  generateTestUser: () => ({
    email: `test-${Date.now()}@stormneighbor.test`,
    password: "TestPassword123",
    firstName: "Test",
    lastName: "User",
    city: "Austin",
    state: "Texas",
  }),

  generateTestPost: () => ({
    title: "Test Post",
    content: "This is a test post",
    postType: "general",
    priority: "normal",
    latitude: 30.2672,
    longitude: -97.7431,
  }),

  mockEmailService: () => {
    jest.mock("../src/services/emailService", () => ({
      sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
      testEmailService: jest.fn().mockResolvedValue({ success: true }),
    }));
  },

  mockWeatherAPI: () => {
    jest.mock("axios", () => ({
      get: jest.fn().mockResolvedValue({
        data: {
          properties: {
            gridId: "EWX",
            gridX: 155,
            gridY: 90,
            periods: [
              {
                temperature: 75,
                temperatureUnit: "F",
                shortForecast: "Sunny",
                detailedForecast: "Sunny skies",
                icon: "https://api.weather.gov/icons/land/day/few",
                isDaytime: true,
              },
            ],
          },
        },
      }),
    }));
  },
};

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
