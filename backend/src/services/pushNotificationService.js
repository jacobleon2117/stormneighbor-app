const admin = require("firebase-admin");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!admin.apps.length) {
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
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });

        logger.info("Firebase Admin SDK initialized successfully");
        this.initialized = true;
      }
    } catch (error) {
      logger.error("Firebase initialization failed", error);
      this.initialized = false;
    }
  }

  async testConnection() {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      const app = admin.app();
      const projectId = app.options.projectId;

      logger.success("Firebase connection test successful", { projectId });

      return {
        success: true,
        projectId,
        initialized: this.initialized,
      };
    } catch (error) {
      logger.error("Firebase connection test failed", error);
      return {
        success: false,
        error: error.message,
        initialized: this.initialized,
      };
    }
  }

  async registerDeviceToken(userId, deviceToken, deviceInfo = {}) {
    const client = await pool.connect();

    try {
      if (!deviceToken || deviceToken.length < 140) {
        throw new Error("Invalid device token format");
      }

      const existingToken = await client.query(
        "SELECT id, is_active FROM user_devices WHERE device_token = $1",
        [deviceToken]
      );

      if (existingToken.rows.length > 0) {
        await client.query(
          `UPDATE user_devices 
           SET user_id = $1, device_info = $2, is_active = true, last_used = NOW(), updated_at = NOW()
           WHERE device_token = $3`,
          [userId, deviceInfo, deviceToken]
        );

        logger.info(`Device token updated for user ${userId}`);
        return { success: true, action: "updated", tokenId: existingToken.rows[0].id };
      } else {
        const result = await client.query(
          `INSERT INTO user_devices (user_id, device_token, device_type, device_info, is_active, last_used)
           VALUES ($1, $2, $3, $4, true, NOW())
           RETURNING id`,
          [userId, deviceToken, deviceInfo.platform || "unknown", deviceInfo]
        );

        logger.info(`New device token registered for user ${userId}`);
        return { success: true, action: "created", tokenId: result.rows[0].id };
      }
    } catch (error) {
      logger.error("Device token registration failed", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserDeviceTokens(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT device_token, device_type, device_info, last_used
         FROM user_devices 
         WHERE user_id = $1 AND is_active = true
         ORDER BY last_used DESC`,
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  async removeDeviceToken(deviceToken) {
    const client = await pool.connect();

    try {
      await client.query(
        "UPDATE user_devices SET is_active = false, updated_at = NOW() WHERE device_token = $1",
        [deviceToken]
      );

      logger.info(`Device token deactivated: ${deviceToken.substring(0, 20)}...`);
    } finally {
      client.release();
    }
  }

  async sendToUser(userId, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      const deviceTokens = await this.getUserDeviceTokens(userId);

      if (deviceTokens.length === 0) {
        logger.warn(`No active device tokens found for user ${userId}`);
        return { success: false, reason: "no_tokens" };
      }

      const tokens = deviceTokens.map((device) => device.device_token);

      const result = await this.sendToTokens(tokens, notification, data);

      await this.logNotification(userId, notification, data, result);

      return result;
    } catch (error) {
      logger.error("Send to user failed", error);
      throw error;
    }
  }

  async sendToTokens(tokens, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      if (!Array.isArray(tokens) || tokens.length === 0) {
        throw new Error("No tokens provided");
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
          source: "stormneighbor",
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#1976D2",
            channelId: "default",
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true,
          },
          priority: "high",
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: "default",
              "content-available": 1,
            },
          },
          headers: {
            "apns-priority": "10",
          },
        },
        tokens: tokens.slice(0, 500),
      };

      const response = await admin.messaging().sendMulticast(message);

      logger.info(
        `Notification sent: ${response.successCount} successful, ${response.failureCount} failed`
      );

      if (response.failureCount > 0) {
        await this.handleFailedTokens(tokens, response.responses);
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length,
      };
    } catch (error) {
      logger.error("Send to tokens failed", error);
      throw error;
    }
  }

  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
          source: "stormneighbor",
        },
        topic: topic,
        android: {
          notification: {
            icon: "ic_notification",
            color: "#1976D2",
            channelId: "default",
            priority: "high",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: "default",
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      logger.info(`Topic notification sent to '${topic}': ${response}`);

      return {
        success: true,
        messageId: response,
        topic,
      };
    } catch (error) {
      logger.error("Send to topic failed", error);
      throw error;
    }
  }

  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      const response = await admin.messaging().subscribeToTopic(tokens, topic);

      logger.info(`Subscribed ${response.successCount} tokens to topic '${topic}'`);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error("Subscribe to topic failed", error);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error("Firebase not initialized");
      }

      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);

      logger.info(`Unsubscribed ${response.successCount} tokens from topic '${topic}'`);

      return response;
    } catch (error) {
      logger.error("Unsubscribe from topic failed:", error);
      throw error;
    }
  }

  async handleFailedTokens(tokens, responses) {
    const client = await pool.connect();

    try {
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];

        if (!response.success) {
          const token = tokens[i];
          const error = response.error;

          if (
            error?.code === "messaging/invalid-registration-token" ||
            error?.code === "messaging/registration-token-not-registered"
          ) {
            logger.info(`Removing invalid token: ${token.substring(0, 20)}...`);
            await this.removeDeviceToken(token);
          }
        }
      }
    } finally {
      client.release();
    }
  }

  async logNotification(userId, notification, data, result) {
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO notifications (user_id, title, body, data, success, sent_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, notification.title, notification.body, JSON.stringify(data), result.success]
      );
    } catch (error) {
      logger.error("Failed to log notification:", error);
    } finally {
      client.release();
    }
  }

  async sendWeatherAlert(userIds, alertData) {
    try {
      const notification = {
        title: `WARNING: ${alertData.event} Alert`,
        body: alertData.description || "Weather alert for your area",
        imageUrl: alertData.imageUrl,
      };

      const data = {
        type: "weather_alert",
        alertId: alertData.id?.toString(),
        severity: alertData.severity,
        area: alertData.area,
        url: alertData.url,
      };

      const results = [];

      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification, data);
          results.push({ userId, ...result });
        } catch (error) {
          logger.error(`Failed to send weather alert to user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error("Send weather alert failed:", error);
      throw error;
    }
  }

  async sendEmergencyNotification(userIds, emergencyData) {
    try {
      const notification = {
        title: "Emergency Alert",
        body: emergencyData.message,
        imageUrl: emergencyData.imageUrl,
      };

      const data = {
        type: "emergency",
        emergencyId: emergencyData.id?.toString(),
        location: emergencyData.location,
        priority: "high",
        timestamp: Date.now().toString(),
      };

      const results = [];

      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification, data);
          results.push({ userId, ...result });
        } catch (error) {
          logger.error(`Failed to send emergency notification to user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error("Send emergency notification failed:", error);
      throw error;
    }
  }

  async sendPostNotification(userIds, postData) {
    try {
      const notification = {
        title: `New ${postData.type || "Post"} in Your Area`,
        body: postData.title || postData.content?.substring(0, 100),
        imageUrl: postData.images?.[0],
      };

      const data = {
        type: "new_post",
        postId: postData.id?.toString(),
        postType: postData.type,
        location: postData.location,
        userId: postData.userId?.toString(),
      };

      const results = [];

      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification, data);
          results.push({ userId, ...result });
        } catch (error) {
          logger.error(`Failed to send post notification to user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error("Send post notification failed:", error);
      throw error;
    }
  }

  async sendCommentNotification(userId, commentData) {
    try {
      const notification = {
        title: "New Comment on Your Post",
        body: `${commentData.authorName}: ${commentData.content?.substring(0, 100)}`,
        imageUrl: commentData.authorImage,
      };

      const data = {
        type: "new_comment",
        postId: commentData.postId?.toString(),
        commentId: commentData.id?.toString(),
        authorId: commentData.authorId?.toString(),
      };

      return await this.sendToUser(userId, notification, data);
    } catch (error) {
      logger.error("Send comment notification failed:", error);
      throw error;
    }
  }

  async getNotificationStats(days = 30) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total_notifications,
           COUNT(*) FILTER (WHERE success = true) as successful_notifications,
           COUNT(*) FILTER (WHERE success = false) as failed_notifications,
           COUNT(DISTINCT user_id) as unique_users,
           DATE_TRUNC('day', sent_at) as date,
           COUNT(*) as daily_count
         FROM notifications 
         WHERE sent_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE_TRUNC('day', sent_at)
         ORDER BY date DESC`,
        []
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  async cleanupOldTokens(days = 90) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE user_devices 
         SET is_active = false 
         WHERE last_used < NOW() - INTERVAL '${days} days' 
         AND is_active = true
         RETURNING id`,
        []
      );

      logger.info(`Cleaned up ${result.rowCount} old device tokens`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  getStatus() {
    return {
      initialized: this.initialized,
      projectId: process.env.FIREBASE_PROJECT_ID,
      serviceAccount: !!process.env.FIREBASE_CLIENT_EMAIL,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new PushNotificationService();
