// Test file for backend
const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let authToken = "";
let testUserId = "";
let testNeighborhoodId = 1;

async function apiCall(method, endpoint, data = null, useAuth = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        ...(useAuth && authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}),
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

async function testHealthCheck() {
  console.log("\n🔍 Testing Health Check...");
  const result = await apiCall("GET", "/health");

  if (result.success) {
    console.log("✅ Health check passed:", result.data);
  } else {
    console.log("❌ Health check failed:", result.error);
  }
  return result.success;
}

async function testUserRegistration() {
  console.log("\n👤 Testing User Registration...");

  const userData = {
    email: `test${Date.now()}@example.com`,
    password: "TestPass123",
    firstName: "Test",
    lastName: "User",
    phone: "555-0123",
  };

  const result = await apiCall("POST", "/api/auth/register", userData);

  if (result.success) {
    console.log("✅ Registration successful");
    authToken = result.data.token;
    testUserId = result.data.user.id;
    console.log("   Token received:", authToken ? "Yes" : "No");
  } else {
    console.log("❌ Registration failed:", result.error);
  }
  return result.success;
}

async function testUserLogin() {
  console.log("\n🔐 Testing User Login...");

  const testEmail = `logintest${Date.now()}@example.com`;
  const testPassword = "TestPass123";

  await apiCall("POST", "/api/auth/register", {
    email: testEmail,
    password: testPassword,
    firstName: "Login",
    lastName: "Test",
  });

  const result = await apiCall("POST", "/api/auth/login", {
    email: testEmail,
    password: testPassword,
  });

  if (result.success) {
    console.log("✅ Login successful");
    authToken = result.data.token;
    testUserId = result.data.user.id;
  } else {
    console.log("❌ Login failed:", result.error);
  }
  return result.success;
}

async function testGetProfile() {
  console.log("\n👤 Testing Get Profile...");

  if (!authToken) {
    console.log("❌ No auth token - skipping profile test");
    return false;
  }

  const result = await apiCall("GET", "/api/auth/profile", null, true);

  if (result.success) {
    console.log("✅ Profile retrieved successfully");
    console.log("   Email:", result.data.email);
    console.log("   Name:", `${result.data.firstName} ${result.data.lastName}`);
  } else {
    console.log("❌ Get profile failed:", result.error);
  }
  return result.success;
}

async function testUpdateProfile() {
  console.log("\n✏️ Testing Profile Update...");

  if (!authToken) {
    console.log("❌ No auth token - skipping profile update test");
    return false;
  }

  const updateData = {
    city: "Test City",
    state: "TS",
    zipCode: "12345",
    notificationPreferences: {
      weatherAlerts: true,
      communityPosts: false,
      emergencyAlerts: true,
    },
  };

  const result = await apiCall("PUT", "/api/auth/profile", updateData, true);

  if (result.success) {
    console.log("✅ Profile updated successfully");
  } else {
    console.log("❌ Profile update failed:", result.error);
  }
  return result.success;
}

async function testNeighborhoods() {
  console.log("\n🏘️ Testing Neighborhoods API...");

  const result = await apiCall(
    "GET",
    "/api/neighborhoods/nearby?latitude=36.1540&longitude=-95.9928&radius=5"
  );

  if (result.success) {
    console.log("✅ Neighborhoods retrieved successfully");
    console.log(
      "   Found",
      result.data.neighborhoods?.length || 0,
      "neighborhoods"
    );
    if (result.data.neighborhoods?.length > 0) {
      testNeighborhoodId = result.data.neighborhoods[0].id;
      console.log(
        "   Using neighborhood ID:",
        testNeighborhoodId,
        "for further tests"
      );
    }
  } else {
    console.log("❌ Get neighborhoods failed:", result.error);
  }
  return result.success;
}

async function testCreatePost() {
  console.log("\n📝 Testing Create Post...");

  if (!authToken) {
    console.log("❌ No auth token - skipping post creation test");
    return false;
  }

  const postData = {
    neighborhoodId: testNeighborhoodId,
    title: "Test Post",
    content: "This is a test post created by the API test script.",
    postType: "general",
    priority: "normal",
  };

  const result = await apiCall("POST", "/api/posts", postData, true);

  if (result.success) {
    console.log("✅ Post created successfully");
    console.log("   Post ID:", result.data.post.id);
    return result.data.post.id;
  } else {
    console.log("❌ Create post failed:", result.error);
    return false;
  }
}

async function testGetPosts() {
  console.log("\n📋 Testing Get Posts...");

  const result = await apiCall(
    "GET",
    `/api/posts?neighborhoodId=${testNeighborhoodId}`
  );

  if (result.success) {
    console.log("✅ Posts retrieved successfully");
    console.log("   Found", result.data.posts?.length || 0, "posts");
  } else {
    console.log("❌ Get posts failed:", result.error);
  }
  return result.success;
}

async function testWeatherAPI() {
  console.log("\n🌤️ Testing Weather API...");

  const result = await apiCall(
    "GET",
    "/api/weather/current?lat=36.1540&lng=-95.9928"
  );

  if (result.success) {
    console.log("✅ Weather data retrieved successfully");
    console.log("   Temperature:", result.data.current?.temperature);
    console.log("   Conditions:", result.data.current?.shortForecast);
    console.log("   Source:", result.data.source);
  } else {
    console.log("❌ Get weather failed:", result.error);
  }
  return result.success;
}

async function testAlertsAPI() {
  console.log("\n🚨 Testing Alerts API...");

  const result = await apiCall(
    "GET",
    `/api/alerts?neighborhoodId=${testNeighborhoodId}`
  );

  if (result.success) {
    console.log("✅ Alerts retrieved successfully");
    console.log("   Found", result.data.alerts?.length || 0, "alerts");
  } else {
    console.log("❌ Get alerts failed:", result.error);
  }
  return result.success;
}

async function runAllTests() {
  console.log("🧪 Starting Backend API Tests...");
  console.log("=====================================");

  const results = {
    health: await testHealthCheck(),
    registration: await testUserRegistration(),
    login: await testUserLogin(),
    profile: await testGetProfile(),
    profileUpdate: await testUpdateProfile(),
    neighborhoods: await testNeighborhoods(),
    createPost: await testCreatePost(),
    getPosts: await testGetPosts(),
    weather: await testWeatherAPI(),
    alerts: await testAlertsAPI(),
  };

  console.log("\n📊 Test Results Summary:");
  console.log("=====================================");

  let passed = 0;
  let total = 0;

  Object.entries(results).forEach(([test, success]) => {
    total++;
    if (success) passed++;
    console.log(
      `${success ? "✅" : "❌"} ${test}: ${success ? "PASSED" : "FAILED"}`
    );
  });

  console.log(
    `\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(
      (passed / total) * 100
    )}%)`
  );

  if (passed === total) {
    console.log("🎉 All tests passed! Your backend is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the logs above for details.");
  }
}

runAllTests().catch(console.error);
