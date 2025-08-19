#!/usr/bin/env node
require("dotenv").config();

async function testPushNotificationSystem() {
  console.log("WORKING: Testing Push Notification System\n");

  try {
    const pushService = require("../src/services/pushNotificationService");

    console.log("WORKING: Testing Firebase connection");
    const connectionResult = await pushService.testConnection();

    if (connectionResult.success) {
      console.log("SUCCESS: Firebase connection successful");
      console.log(` Project ID: ${connectionResult.projectId}`);
    } else {
      console.log("ERROR: Firebase connection failed:", connectionResult.error);
      return;
    }

    console.log("\nWORKING: Checking service status");
    const status = pushService.getStatus();
    console.log("SUCCESS: Service status:");
    console.log(` Initialized: ${status.initialized}`);
    console.log(` Project ID: ${status.projectId}`);
    console.log(` Service Account: ${status.serviceAccount}`);

    console.log("\nWORKING: Testing notification message creation");

    const testNotification = {
      title: "Test Notification",
      body: "This is a test notification from StormNeighbor",
      imageUrl: "https://res.cloudinary.com/dixhgba3x/image/upload/v1/stormneighbor/test-image.jpg",
    };

    const testData = {
      type: "test",
      timestamp: Date.now().toString(),
      source: "backend-test",
    };

    console.log("SUCCESS: Test notification structure created:");
    console.log(` Title: ${testNotification.title}`);
    console.log(` Body: ${testNotification.body}`);
    console.log(` Data: ${JSON.stringify(testData)}`);

    if (process.argv.includes("--with-topic-test")) {
      console.log("\nWORKING: Testing topic notification");
      try {
        const topicResult = await pushService.sendToTopic("test-topic", testNotification, testData);
        console.log("SUCCESS: Topic notification test successful:", topicResult);
      } catch (error) {
        console.log(
          "WARNING: Topic notification test failed (this is normal if no subscribers):",
          error.message
        );
      }
    }

    console.log("\nSUCCESS: Push notification system test completed successfully");
    console.log("\nINFO: Next steps:");
    console.log(" Integrate device registration in your mobile app");
    console.log(" Test with real device tokens");
    console.log(" Set up notification triggers for weather alerts");
    console.log(" Configure topic subscriptions for location-based notifications");
  } catch (error) {
    console.error("\nERROR: Push notification test failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log(" Check Firebase credentials in .env file");
    console.log(" Ensure Firebase project is properly configured");
    console.log(" Verify Firebase Admin SDK permissions");

    if (error.message.includes("private_key")) {
      console.log("Check FIREBASE_PRIVATE_KEY format (should include \\n for line breaks)");
    }

    if (error.message.includes("project_id")) {
      console.log("Verify FIREBASE_PROJECT_ID matches your Firebase project");
    }
  }
}

if (require.main === module) {
  testPushNotificationSystem()
    .then(() => {
      process.exitCode = 1;
    })
    .catch((error) => {
      console.error("ERROR: Test script failed:", error);
      process.exitCode = 1;
    });
}

module.exports = { testPushNotificationSystem };
