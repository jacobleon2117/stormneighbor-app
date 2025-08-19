#!/usr/bin/env node
require("dotenv").config();

async function testSupabaseBackup() {
  console.log("Testing Supabase backup system\n");

  try {
    const supabaseBackup = require("../src/services/supabaseBackupService");

    console.log("Testing database connection");
    const connected = await supabaseBackup.testConnection();

    if (!connected) {
      throw new Error("ERROR: Database connection failed");
    }

    console.log("\nWORKING: Creating test backup");
    const backup = await supabaseBackup.createSQLBackup("test");

    console.log("\nWORKING: Listing backups");
    const backups = await supabaseBackup.listBackups();
    console.log(`Found ${backups.length} backup(s)`);

    if (backups.length > 0) {
      console.log("\nINFO: Recent backups:");
      backups.slice(0, 3).forEach((backup) => {
        console.log(`  • ${backup.filename} (${(backup.size / 1024).toFixed(2)} KB)`);
      });
    }

    console.log("\nSUCCESS: Supabase backup test completed successfully");
    console.log("\nINFO: Next Steps");
    console.log(" RUN: npm run backup:supabase:create");
    console.log(" CHECK: backups folder for SQL files");
    console.log(" SET UP: scheduled backups with cron jobs");
  } catch (error) {
    console.error("\nERROR: Supabase backup test failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log(" CHECK: DATABASE_URL in .env file");
    console.log(" ENSURE: database connection is working");
    console.log(" VERIFY: backup directory permissions");
    console.log(" VERIFY: pg package installed");

    if (error.message.includes("ERROR: permission denied")) {
      console.log("TRY: mkdir -p ./backups && chmod 755 ./backups");
    }

    if (error.message.includes("connection")) {
      console.log("INFO: Test your database connection with: npm run db:test");
    }
  } finally {
    console.log("\nINFO: Test completed.");
    process.exitCode = 1;
  }
}

if (require.main === module) {
  testSupabaseBackup();
}

module.exports = { testSupabaseBackup };
