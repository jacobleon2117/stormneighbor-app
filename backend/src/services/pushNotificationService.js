// File: backend/src/services/pushNotificationService.js
const admin = require("firebase-admin");
const { pool } = require("../config/database");

// Initialize Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    // Initialize with service account (you'll need to add this to your env)
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    return null;
  }
};

// Register user device for push notifications
const registerDevice = async (userId, deviceToken, deviceType, deviceName, appVersion) => {
  const client = await pool.connect();

  try {
    // Deactivate old tokens for this user/device type
    await client.query(
      "UPDATE user_devices SET is_active = false WHERE user_id = $1 AND device_type = $2",
      [userId, deviceType]
    );

    // Insert new device token
    const result = await client.query(
      `
      INSERT INTO user_devices (user_id, device_token, device_type, device_name, app_version)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, device_token) 
      DO UPDATE SET 
        is_active = true,
        device_name = $4,
        app_version = $5,
        last_seen = NOW(),
        updated_at = NOW()
      RETURNING id
    `,
      [userId, deviceToken, deviceType, deviceName, appVersion]
    );

    console.log(`📱 Device registered for user ${userId}: ${deviceType}`);
    return { success: true, deviceId: result.rows[0].id };
  } catch (error) {
    console.error("Device registration error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
};

// Get active device tokens for a user
const getUserDeviceTokens = async (userId) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT device_token, device_type 
      FROM user_devices 
      WHERE user_id = $1 AND is_active = true
    `,
      [userId]
    );

    return result.rows.map((row) => ({
      token: row.device_token,
      type: row.device_type,
    }));
  } catch (error) {
    console.error("Error getting device tokens:", error);
    return [];
  } finally {
    client.release();
  }
};

// Send push notification to specific users
const sendNotificationToUsers = async (userIds, notificationData) => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      throw new Error("Firebase not initialized");
    }
  }

  const client = await pool.connect();

  try {
    // Get all device tokens for the users
    const deviceResult = await client.query(
      `
      SELECT DISTINCT device_token, user_id, device_type
      FROM user_devices 
      WHERE user_id = ANY($1) AND is_active = true
    `,
      [userIds]
    );

    if (deviceResult.rows.length === 0) {
      console.log("No active devices found for users:", userIds);
      return { success: true, sent: 0, failed: 0 };
    }

    const tokens = deviceResult.rows.map((row) => row.device_token);

    // Prepare FCM message
    const message = {
      notification: {
        title: notificationData.title,
        body: notificationData.message,
        ...(notificationData.imageUrl && { imageUrl: notificationData.imageUrl }),
      },
      data: {
        type: notificationData.type || "general",
        postId: notificationData.postId?.toString() || "",
        alertId: notificationData.alertId?.toString() || "",
        userId: notificationData.userId?.toString() || "",
        actionUrl: notificationData.actionUrl || "",
        ...notificationData.customData,
      },
      android: {
        priority: notificationData.priority === "high" ? "high" : "normal",
        notification: {
          sound: notificationData.sound || "default",
          channelId: notificationData.type || "general",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: notificationData.sound || "default",
            badge: 1,
          },
        },
      },
      tokens: tokens,
    };

    // Send to FCM
    const response = await admin.messaging().sendMulticast(message);

    console.log(
      `📤 Push notification sent: ${response.successCount} success, ${response.failureCount} failed`
    );

    // Log results
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    // Update notification records
    for (const userId of userIds) {
      await client.query(
        `
        INSERT INTO notifications (
          user_id, title, message, notification_type, 
          push_sent, push_sent_at, push_delivery_status,
          related_post_id, related_alert_id, related_user_id, metadata
        ) VALUES ($1, $2, $3, $4, true, NOW(), $5, $6, $7, $8, $9)
      `,
        [
          userId,
          notificationData.title,
          notificationData.message,
          notificationData.type,
          response.successCount > 0 ? "sent" : "failed",
          notificationData.postId || null,
          notificationData.alertId || null,
          notificationData.userId || null,
          JSON.stringify(notificationData.customData || {}),
        ]
      );
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      messageId: response.responses[0]?.messageId,
    };
  } catch (error) {
    console.error("Push notification send error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
};

// Send notification to users in a specific city
const sendNotificationToCity = async (city, state, notificationData) => {
  const client = await pool.connect();

  try {
    // Get users in the city who have push notifications enabled
    const userResult = await client.query(
      `
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE u.location_city = $1 AND u.address_state = $2 
        AND u.is_active = true
        AND (np.push_enabled IS NULL OR np.push_enabled = true)
        AND (
          CASE 
            WHEN $3 = 'emergency_alert' THEN (np.emergency_alerts IS NULL OR np.emergency_alerts = true)
            WHEN $3 = 'weather_alert' THEN (np.weather_alerts IS NULL OR np.weather_alerts = true)
            WHEN $3 = 'neighborhood_post' THEN (np.neighborhood_posts IS NULL OR np.neighborhood_posts = true)
            ELSE true
          END
        )
    `,
      [city, state, notificationData.type]
    );

    const userIds = userResult.rows.map((row) => row.id);

    if (userIds.length === 0) {
      console.log(
        `No users found in ${city}, ${state} for notification type: ${notificationData.type}`
      );
      return { success: true, sent: 0, failed: 0 };
    }

    console.log(`📍 Sending notification to ${userIds.length} users in ${city}, ${state}`);
    return await sendNotificationToUsers(userIds, notificationData);
  } catch (error) {
    console.error("City notification error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
};

// Notification helper functions for common scenarios
const notificationHelpers = {
  // New message notification
  newMessage: async (senderId, recipientId, messagePreview) => {
    const client = await pool.connect();
    try {
      const senderResult = await client.query(
        "SELECT first_name, last_name FROM users WHERE id = $1",
        [senderId]
      );

      if (senderResult.rows.length === 0) return;

      const sender = senderResult.rows[0];
      const senderName = `${sender.first_name} ${sender.last_name}`;

      return await sendNotificationToUsers([recipientId], {
        title: `New message from ${senderName}`,
        message: `${senderName}: ${messagePreview}`,
        type: "new_message",
        userId: senderId,
        actionUrl: `/messages/${senderId}`,
        priority: "high",
        sound: "message_sound",
        customData: { senderId: senderId.toString() },
      });
    } finally {
      client.release();
    }
  },

  // Post comment notification
  postComment: async (postId, commenterId, postAuthorId, commentPreview) => {
    if (commenterId === postAuthorId) return; // Don't notify self

    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT 
          u.first_name, u.last_name,
          p.title, p.content
        FROM users u, posts p
        WHERE u.id = $1 AND p.id = $2
      `,
        [commenterId, postId]
      );

      if (result.rows.length === 0) return;

      const commenter = result.rows[0];
      const commenterName = `${commenter.first_name} ${commenter.last_name}`;

      return await sendNotificationToUsers([postAuthorId], {
        title: "New comment on your post",
        message: `${commenterName} commented: ${commentPreview}`,
        type: "post_comment",
        postId: postId,
        userId: commenterId,
        actionUrl: `/posts/${postId}`,
        priority: "normal",
      });
    } finally {
      client.release();
    }
  },

  emergencyAlert: async (city, state, alertTitle, alertDescription, alertId) => {
    return sendNotificationToCity(city, state, {
      title: `🚨 Emergency Alert: ${alertTitle}`,
      message: alertDescription,
      type: "emergency_alert",
      alertId: alertId,
      actionUrl: `/alerts/${alertId}`,
      priority: "high",
      sound: "emergency_alert",
    });
  },

  weatherAlert: async (city, state, severity, alertTitle, alertId) => {
    const severityEmoji = {
      CRITICAL: "🔴",
      HIGH: "🟡",
      MODERATE: "🟠",
      LOW: "🟢",
    };

    return sendNotificationToCity(city, state, {
      title: `${severityEmoji[severity] || "⚠️"} Weather Alert for ${city}`,
      message: `${severity}: ${alertTitle}`,
      type: "weather_alert",
      alertId: alertId,
      actionUrl: "/weather/alerts",
      priority: severity === "CRITICAL" ? "high" : "normal",
    });
  },

  // New neighborhood post notification
  neighborhoodPost: async (postId, authorId, city, state, postTitle, postPreview) => {
    const client = await pool.connect();
    try {
      const authorResult = await client.query(
        "SELECT first_name, last_name FROM users WHERE id = $1",
        [authorId]
      );

      if (authorResult.rows.length === 0) return;

      const author = authorResult.rows[0];
      const authorName = `${author.first_name} ${author.last_name}`;

      return await sendNotificationToCity(city, state, {
        title: `New post in ${city}`,
        message: `${authorName}: ${postPreview}`,
        type: "neighborhood_post",
        postId: postId,
        userId: authorId,
        actionUrl: `/posts/${postId}`,
        priority: "normal",
      });
    } finally {
      client.release();
    }
  },
};

module.exports = {
  initializeFirebase,
  registerDevice,
  getUserDeviceTokens,
  sendNotificationToUsers,
  sendNotificationToCity,
  ...notificationHelpers,
};
