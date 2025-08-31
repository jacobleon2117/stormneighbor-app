#!/usr/bin/env node
require("dotenv").config();
const backupService = require("../src/services/backupService");

const COMMANDS = {
  create: "Create a new backup",
  list: "List all available backups",
  restore: "Restore from a backup file",
  delete: "Delete a backup file",
  cleanup: "Clean up old backup files",
  stats: "Show backup statistics",
  test: "Test backup system",
  schedule: "Start backup scheduler",
  help: "Show this help message",
};

function showHelp() {
  console.log("\nStormNeighbor Database Backup Manager\n");
  console.log("Usage: node scripts/backup-manager.js <command> [options]\n");
  console.log("Commands:");

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });

  console.log("\nExamples:");
  console.log("  node scripts/backup-manager.js create --type=manual");
  console.log("  node scripts/backup-manager.js create --type=daily --schema-only");
  console.log("  node scripts/backup-manager.js list");
  console.log("  node scripts/backup-manager.js restore backup_file.sql.gz --confirm");
  console.log("  node scripts/backup-manager.js delete backup_file.sql.gz --confirm");
  console.log("  node scripts/backup-manager.js stats");
  console.log("  node scripts/backup-manager.js test");
  console.log("  node scripts/backup-manager.js schedule");
  console.log("\nOptions:");
  console.log("  --type=TYPE          Backup type (manual, daily, weekly, monthly)");
  console.log("  --schema-only        Backup schema only");
  console.log("  --data-only          Backup data only");
  console.log("  --exclude=TABLES     Comma-separated list of tables to exclude");
  console.log("  --confirm            Confirm destructive operations");
  console.log("  --help               Show this help message");
  console.log("");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  args.slice(1).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=");
      if (value !== undefined) {
        options[key] = value;
      } else {
        options[key] = true;
      }
    }
  });

  return { command, options };
}

async function createBackup(options) {
  try {
    console.log("WORKING: Creating database backup");

    const backupOptions = {
      schemaOnly: options["schema-only"] || false,
      dataOnly: options["data-only"] || false,
      excludeTables: options.exclude ? options.exclude.split(",") : [],
    };

    const type = options.type || "manual";
    const result = await backupService.createBackup(type, backupOptions);

    console.log("SUCCESS: Backup created successfully");
    console.log(` File: ${result.filename}`);
    console.log(` Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(` Duration: ${result.duration}ms`);
    console.log(` Location: ${result.filepath}`);
  } catch (error) {
    console.error("ERROR: Backup creation failed:", error.message);
    process.exitCode = 1;
  }
}

async function listBackups() {
  try {
    console.log("WORKING: Listing available backups\n");

    const backups = await backupService.listBackups();

    if (backups.length === 0) {
      console.log("No backups found.");
      return;
    }

    console.log("Filename".padEnd(40) + "Type".padEnd(12) + "Size".padEnd(12) + "Created");
    console.log("-".repeat(80));

    backups.forEach((backup) => {
      const size = `${(backup.size / 1024 / 1024).toFixed(2)} MB`;
      const created = backup.created.toISOString().slice(0, 19).replace("T", " ");

      console.log(backup.filename.padEnd(40) + backup.type.padEnd(12) + size.padEnd(12) + created);
    });

    console.log(`\nTotal: ${backups.length} backup(s)`);
  } catch (error) {
    console.error("ERROR: Failed to list backups:", error.message);
    process.exitCode = 1;
  }
}

async function restoreBackup(filename, options) {
  try {
    if (!filename) {
      console.error("ERROR: Backup filename is required for restore operation");
      console.log("Usage: node scripts/backup-manager.js restore <filename> --confirm");
      process.exitCode = 1;
    }

    if (!options.confirm) {
      console.error("ERROR: Restore operation requires confirmation");
      console.log("Add --confirm flag to proceed with database restore");
      console.log("WARNING: This will overwrite your current database");
      process.exitCode = 1;
    }

    console.log("WORKING: Starting database restore");
    console.log(`From: ${filename}`);
    console.log("WARNING: This will overwrite your current database");

    const restoreOptions = {
      schemaOnly: options["schema-only"] || false,
      dataOnly: options["data-only"] || false,
    };

    const result = await backupService.restoreBackup(filename, restoreOptions);

    console.log("SUCCESS: Database restore completed successfully");
    console.log(` Duration: ${result.duration}ms`);
  } catch (error) {
    console.error("ERROR: Database restore failed:", error.message);
    process.exitCode = 1;
  }
}

async function deleteBackup(filename, options) {
  try {
    if (!filename) {
      console.error("ERROR: Backup filename is required for delete operation");
      console.log("Usage: node scripts/backup-manager.js delete <filename> --confirm");
      process.exitCode = 1;
    }

    if (!options.confirm) {
      console.error("ERROR: Delete operation requires confirmation");
      console.log("Add --confirm flag to proceed with backup deletion");
      process.exitCode = 1;
    }

    const fs = require("fs").promises;
    const path = require("path");

    const backupPath = path.join(backupService.backupDir, filename);
    await fs.unlink(backupPath);

    console.log("SUCESS: Backup deleted successfully");
    console.log(` File: ${filename}`);
  } catch (error) {
    console.error("ERROR: Failed to delete backup:", error.message);
    process.exitCode = 1;
  }
}

async function cleanupBackups() {
  try {
    console.log("WORKING: Cleaning up old backups");

    await backupService.cleanupOldBackups();

    console.log("SUCCESS: Backup cleanup completed");
  } catch (error) {
    console.error("ERROR: Backup cleanup failed:", error.message);
    process.exitCode = 1;
  }
}

async function showStats() {
  try {
    console.log("WORKING: Backup System Statistics\n");

    const stats = await backupService.getBackupStats();

    console.log("General Statistics:");
    console.log(` Total Backups: ${stats.totalBackups}`);
    console.log(` Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(` Backup Directory: ${stats.backupDirectory}`);
    console.log(` Max Backups: ${stats.maxBackups}`);
    console.log(` Compression: ${stats.compressionEnabled ? "Enabled" : "Disabled"}`);

    if (stats.oldestBackup) {
      console.log(
        `Oldest Backup: ${stats.oldestBackup.toISOString().slice(0, 19).replace("T", " ")}`
      );
    }

    if (stats.newestBackup) {
      console.log(
        `Newest Backup: ${stats.newestBackup.toISOString().slice(0, 19).replace("T", " ")}`
      );
    }

    console.log("\nINFO: Schedule Configuration:");
    console.log(` Daily: ${stats.schedules.daily}`);
    console.log(` Weekly: ${stats.schedules.weekly}`);
    console.log(` Monthly: ${stats.schedules.monthly}`);
  } catch (error) {
    console.error("ERROR: Failed to get backup statistics:", error.message);
    process.exitCode = 1;
  }
}

async function testBackupSystem() {
  try {
    console.log("WORKING: Testing backup system");

    console.log("WORKING: Creating test backup");
    const testBackup = await backupService.createBackup("test", { schemaOnly: true });

    console.log(" Test backup created successfully");
    console.log(` Duration: ${testBackup.duration}ms`);

    const fs = require("fs").promises;
    await fs.unlink(testBackup.filepath);
    console.log("INFO: Test backup cleaned up");

    console.log("SUCCESS: Backup system test completed successfully");
  } catch (error) {
    console.error("ERROR: Backup system test failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log(" Ensure PostgreSQL tools (pg_dump, pg_restore) are installed");
    console.log(" Check DATABASE_URL environment variable");
    console.log(" Verify backup directory permissions");
    process.exitCode = 1;
  }
}

async function startScheduler() {
  try {
    console.log("WORKING: Starting backup scheduler");

    backupService.startScheduledBackups();

    console.log("SUCCESS: Backup scheduler started successfully");
    console.log("INFO: Backup schedules:");

    const stats = await backupService.getBackupStats();
    console.log(` Daily: ${stats.schedules.daily}`);
    console.log(` Weekly: ${stats.schedules.weekly}`);
    console.log(` Monthly: ${stats.schedules.monthly}`);

    console.log("\nINFO: Press Ctrl+C to stop the scheduler");

    process.on("SIGINT", () => {
      console.log("\nINFO: Stopping backup scheduler");
      backupService.stopScheduledBackups();
      console.log("SUCCESS: Backup scheduler stopped");
      process.exitCode = 1;
    });

    setInterval(() => {}, 1000);
  } catch (error) {
    console.error("ERROR: Failed to start backup scheduler:", error.message);
    process.exitCode = 1;
  }
}

async function main() {
  const { command, options } = parseArgs();

  if (!command || command === "help" || options.help) {
    showHelp();
    return;
  }

  if (!COMMANDS[command]) {
    console.error(`ERROR: Unknown command: ${command}`);
    console.log("Run with --help to see available commands");
    process.exitCode = 1;
  }

  try {
    switch (command) {
      case "create":
        await createBackup(options);
        break;
      case "list":
        await listBackups();
        break;
      case "restore":
        await restoreBackup(process.argv[3], options);
        break;
      case "delete":
        await deleteBackup(process.argv[3], options);
        break;
      case "cleanup":
        await cleanupBackups();
        break;
      case "stats":
        await showStats();
        break;
      case "test":
        await testBackupSystem();
        break;
      case "schedule":
        await startScheduler();
        break;
      default:
        console.error(`ERROR: Command not implemented: ${command}`);
        process.exitCode = 1;
    }
  } catch (error) {
    console.error("ERROR: Operation failed:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
