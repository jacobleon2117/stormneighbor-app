// File: backend/scripts/setup-push-notifications.js

require("dotenv").config();
const { pool } = require("../src/config/database");

async function setupPushNotificationTables() {
  console.log("WORKING: Setting up Push Notification Database Tables\n");

  const client = await pool.connect();

  try {
    await client.query(`
      INSERT INTO notification_preferences (user_id, notification_type, enabled, push_enabled, email_enabled)
      SELECT u.id, 'weather_alerts', true, true, true
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_preferences np 
        WHERE np.user_id = u.id AND np.notification_type = 'weather_alerts'
      )
    `);

    await client.query(`
      INSERT INTO notification_preferences (user_id, notification_type, enabled, push_enabled, email_enabled)
      SELECT u.id, 'new_posts', true, true, false
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_preferences np 
        WHERE np.user_id = u.id AND np.notification_type = 'new_posts'
      )
    `);

    await client.query(`
      INSERT INTO notification_preferences (user_id, notification_type, enabled, push_enabled, email_enabled)
      SELECT u.id, 'comments', true, true, false
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_preferences np 
        WHERE np.user_id = u.id AND np.notification_type = 'comments'
      )
    `);

    await client.query(`
      INSERT INTO notification_preferences (user_id, notification_type, enabled, push_enabled, email_enabled)
      SELECT u.id, 'emergency', true, true, true
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_preferences np 
        WHERE np.user_id = u.id AND np.notification_type = 'emergency'
      )
    `);

    console.log("SUCCESS: Default notification preferences created for all users");

    await client.query(`
      UPDATE admin_roles 
      SET permissions = permissions || '{"notifications": ["send", "read", "test"]}'
      WHERE name IN ('super_admin', 'admin')
    `);

    console.log("SUCCESS: Notification permissions added to admin roles");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_user_active 
      ON user_devices(user_id, is_active) 
      WHERE is_active = true
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_sent 
      ON notifications(user_id, sent_at DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type 
      ON notification_preferences(user_id, notification_type, enabled)
    `);

    console.log("SUCCESS: Database indexes created for push notifications");

    const deviceCount = await client.query(
      "SELECT COUNT(*) FROM user_devices WHERE is_active = true"
    );
    const notificationCount = await client.query("SELECT COUNT(*) FROM notifications");
    const preferenceCount = await client.query("SELECT COUNT(*) FROM notification_preferences");

    console.log("\nINFO: Current Push Notification Statistics:");
    console.log(`   Active Devices: ${deviceCount.rows[0].count}`);
    console.log(`   Total Notifications Sent: ${notificationCount.rows[0].count}`);
    console.log(`   User Preferences: ${preferenceCount.rows[0].count}`);

    console.log("\nSUCCESS: Push notification database setup completed successfully");
  } catch (error) {
    console.error("ERROR: Push notification setup failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  setupPushNotificationTables()
    .then(() => {
      console.log("\nSUCCESS: Setup completed, Push notifications are ready to use.");
      process.exitCode = 1;
    })
    .catch((error) => {
      console.error("ERROR: Setup failed:", error);
      process.exitCode = 1;
    });
}

module.exports = { setupPushNotificationTables };
