const pushNotificationService = require("../services/pushNotificationService");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

class NotificationTriggers {
  static async triggerWeatherAlert(alertData) {
    try {
      const client = await pool.connect();

      try {
        const result = await client.query(
          `SELECT DISTINCT u.id 
           FROM users u 
           JOIN user_devices ud ON u.id = ud.user_id 
           WHERE u.location_city = $1 
           AND u.location_state = $2 
           AND ud.is_active = true`,
          [alertData.city, alertData.state]
        );

        const userIds = result.rows.map((row) => row.id);

        if (userIds.length > 0) {
          logger.info(
            `Sending weather alert to ${userIds.length} users in ${alertData.city}, ${alertData.state}`
          );

          const results = await pushNotificationService.sendWeatherAlert(userIds, alertData);
          logger.info("Weather alert sent: ${results.filter((r); => r.success).length} successful");

          return results;
        } else {
          logger.info("No users found in ${alertData.city}, ${alertData.state} for weather alert");
          return [];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Weather alert trigger failed:", error);
      throw error;
    }
  }

  static async triggerNewPostNotification(postData) {
    try {
      const client = await pool.connect();

      try {
        const result = await client.query(
          `SELECT DISTINCT u.id
          FROM users u
          JOIN user_devices ud ON u.id = ud.user_id
          JOIN notification_preferences np ON u.id = np.user_id
          WHERE u.location_city = $1
           AND u.location_state = $2
           AND u.id != $3
           AND ud.is_active = true
           AND np.notification_type = 'new_posts'
           AND np.enabled = true`,
          [postData.location_city, postData.location_state, postData.user_id]
        );

        const userIds = result.rows.map((row) => row.id);

        if (userIds.length > 0) {
          logger.info("Sending new post notification to ${userIds.length} users");

          const results = await pushNotificationService.sendPostNotification(userIds, postData);
          logger.info(
            "New post notification sent: ${results.filter((r) => r.success).length} successful"
          );

          return results;
        } else {
          logger.info("No users found for new post notification");
          return [];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("New post notification trigger failed:", error);
      throw error;
    }
  }

  static async triggerCommentNotification(commentData) {
    try {
      const client = await pool.connect();

      try {
        const postResult = await client.query("SELECT user_id FROM posts WHERE id = $1", [
          commentData.post_id,
        ]);

        if (postResult.rows.length === 0) {
          logger.info("Post not found for comment notification");
          return null;
        }

        const postAuthorId = postResult.rows[0].user_id;

        if (postAuthorId === commentData.user_id) {
          return null;
        }

        const prefResult = await client.query(
          `SELECT enabled 
          FROM notification_preferences 
          WHERE user_id = $1 AND notification_type = 'comments'`,
          [postAuthorId]
        );

        if (prefResult.rows.length === 0 || !prefResult.rows[0].enabled) {
          logger.info("User has comment notifications disabled");
          return null;
        }

        const userResult = await client.query(
          "SELECT first_name, last_name, profile_image_url FROM users WHERE id = $1",
          [commentData.user_id]
        );

        const commenter = userResult.rows[0];
        const authorName = `${commenter.first_name} ${commenter.last_name}`;

        const notificationData = {
          ...commentData,
          authorName,
          authorImage: commenter.profile_image_url,
          postId: commentData.post_id,
          authorId: commentData.user_id,
        };

        logger.info("Sending comment notification to user ${postAuthorId}");

        const result = await pushNotificationService.sendCommentNotification(
          postAuthorId,
          notificationData
        );
        logger.info(`Comment notification sent: ${result.success ? "successful" : "failed"}`);

        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Comment notification trigger failed:", error);
      throw error;
    }
  }

  static async triggerEmergencyNotification(emergencyData) {
    try {
      const client = await pool.connect();

      try {
        const result = await client.query(
          `SELECT DISTINCT u.id
          FROM users u
          JOIN user_devices ud ON u.id = ud.user_id
          WHERE u.location_state = $1
          AND ud.is_active = true`,
          [emergencyData.state]
        );

        const userIds = result.rows.map((row) => row.id);

        if (userIds.length > 0) {
          logger.info(
            "Sending emergency notification to ${userIds.length} users in ${emergencyData.state}"
          );

          const results = await pushNotificationService.sendEmergencyNotification(
            userIds,
            emergencyData
          );
          logger.info(
            "Emergency notification sent: ${results.filter((r) => r.success).length} successful"
          );

          return results;
        } else {
          logger.info("No users found in ${emergencyData.state} for emergency notification");
          return [];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Emergency notification trigger failed:", error);
      throw error;
    }
  }
}

module.exports = NotificationTriggers;
