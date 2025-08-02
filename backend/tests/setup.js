// File: backend/tests/setup.js
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_for_testing_only";
process.env.RESEND_API_KEY = "fake_key_for_testing";
process.env.FROM_EMAIL = "test@example.com";
process.env.FROM_NAME = "StormNeighbor Test";
process.env.NOAA_API_BASE_URL = "https://api.weather.gov";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "123456789";
process.env.CLOUDINARY_API_SECRET = "test_secret";

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

jest.setTimeout(30000);

afterEach(() => {
  jest.clearAllTimers();
});

global.testHelpers = {
  generateTestUser: () => ({
    email: `test-${Date.now()}@example.com`,
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

jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  })),
}));
