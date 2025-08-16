// File: backend/src/controllers/pushNotificationController.js
const pushNotificationService = require("../services/pushNotificationService");
const { validationResult } = require("express-validator");

const registerDevice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { deviceToken, deviceInfo } = req.body;
    const userId = req.user.userId;

    const result = await pushNotificationService.registerDeviceToken(
      userId,
      deviceToken,
      deviceInfo
    );

    res.status(201).json({
      success: true,
      message: `Device token ${result.action} successfully`,
      data: {
        tokenId: result.tokenId,
        action: result.action,
      },
    });
  } catch (error) {
    console.error("Device registration failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register device token",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const removeDevice = async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: "Device token is required",
      });
    }

    await pushNotificationService.removeDeviceToken(deviceToken);

    res.json({
      success: true,
      message: "Device token removed successfully",
    });
  } catch (error) {
    console.error("Device removal failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove device token",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const getUserDevices = async (req, res) => {
  try {
    const userId = req.user.userId;

    const devices = await pushNotificationService.getUserDeviceTokens(userId);

    const sanitizedDevices = devices.map((device) => ({
      deviceType: device.device_type,
      deviceInfo: device.device_info,
      lastUsed: device.last_used,
      tokenPreview: device.device_token.substring(0, 20) + "...",
    }));

    res.json({
      success: true,
      message: "User devices retrieved successfully",
      data: {
        devices: sanitizedDevices,
        count: devices.length,
      },
    });
  } catch (error) {
    console.error("Get user devices failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user devices",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const sendTestNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { title, body, data, targetUserId } = req.body;
    const adminUserId = req.user.userId;

    const notification = { title, body };
    const notificationData = { ...data, sentBy: adminUserId };

    let result;
    if (targetUserId) {
      result = await pushNotificationService.sendToUser(
        targetUserId,
        notification,
        notificationData
      );
    } else {
      result = await pushNotificationService.sendToUser(
        adminUserId,
        notification,
        notificationData
      );
    }

    res.json({
      success: true,
      message: "Test notification sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send test notification failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const sendTopicNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { topic, title, body, data } = req.body;

    const notification = { title, body };
    const result = await pushNotificationService.sendToTopic(topic, notification, data);

    res.json({
      success: true,
      message: "Topic notification sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send topic notification failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send topic notification",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const subscribeToTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.userId;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
      });
    }

    const devices = await pushNotificationService.getUserDeviceTokens(userId);

    if (devices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No registered devices found for this user",
      });
    }

    const tokens = devices.map((device) => device.device_token);
    const result = await pushNotificationService.subscribeToTopic(tokens, topic);

    res.json({
      success: true,
      message: `Successfully subscribed to topic '${topic}'`,
      data: result,
    });
  } catch (error) {
    console.error("Subscribe to topic failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to topic",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const unsubscribeFromTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.userId;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
      });
    }

    const devices = await pushNotificationService.getUserDeviceTokens(userId);

    if (devices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No registered devices found for this user",
      });
    }

    const tokens = devices.map((device) => device.device_token);
    const result = await pushNotificationService.unsubscribeFromTopic(tokens, topic);

    res.json({
      success: true,
      message: `Successfully unsubscribed from topic '${topic}'`,
      data: result,
    });
  } catch (error) {
    console.error("Unsubscribe from topic failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe from topic",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const { days } = req.query;
    const daysParsed = days ? parseInt(days) : 30;

    if (daysParsed < 1 || daysParsed > 365) {
      return res.status(400).json({
        success: false,
        message: "Days must be between 1 and 365",
      });
    }

    const stats = await pushNotificationService.getNotificationStats(daysParsed);

    res.json({
      success: true,
      message: "Notification statistics retrieved successfully",
      data: {
        stats,
        period: `${daysParsed} days`,
      },
    });
  } catch (error) {
    console.error("Get notification stats failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification statistics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const testFirebaseConnection = async (req, res) => {
  try {
    const result = await pushNotificationService.testConnection();

    res.json({
      success: result.success,
      message: result.success ? "Firebase connection successful" : "Firebase connection failed",
      data: result,
    });
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    res.status(500).json({
      success: false,
      message: "Firebase connection test failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const getServiceStatus = async (req, res) => {
  try {
    const status = pushNotificationService.getStatus();

    res.json({
      success: true,
      message: "Push notification service status",
      data: status,
    });
  } catch (error) {
    console.error("Get service status failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get service status",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

module.exports = {
  registerDevice,
  removeDevice,
  getUserDevices,
  sendTestNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  getNotificationStats,
  testFirebaseConnection,
  getServiceStatus,
};
