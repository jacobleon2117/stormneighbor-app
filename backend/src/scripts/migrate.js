#!/usr/bin/env node
require("dotenv").config();

const DatabaseMigrator = require("../database/migrations");
const logger = require("../utils/logger");

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const migrator = new DatabaseMigrator();

  try {
    switch (command) {
    case "up":
    case "migrate": {
      logger.info("WORKING: Running database migrations\n");
      const result = await migrator.migrate();
      logger.info(
        `\nSUCCESS: Migration complete: ${result.applied} applied, ${result.skipped} skipped`
      );
      break;
    }

    case "status": {
      logger.info("STATUS: Database Migration Status\n");
      const status = await migrator.getStatus();

      logger.info(`Current Version: ${status.currentVersion || "None"}`);
      logger.info(`Total Migrations: ${status.totalMigrations}`);
      logger.info(`Applied: ${status.appliedMigrations}`);
      logger.info(`Pending: ${status.pendingMigrations}\n`);

      if (status.applied.length > 0) {
        logger.info("Applied Migrations:");
        status.applied.forEach((m) => {
          const status = m.success ? "SUCCESS:" : "ERROR:";
          logger.info(
            `  ${status} ${m.version}: ${m.name} (${new Date(m.appliedAt).toLocaleString()})`
          );
        });
        logger.info("");
      }

      if (status.pending.length > 0) {
        logger.info("Pending Migrations:");
        status.pending.forEach((m) => {
          logger.info(`  WORKING: ${m.version}: ${m.name}`);
        });
        logger.info("");
      }
      break;
    }

    case "validate": {
      logger.info("WORKING: Validating migrations\n");
      const issues = await migrator.validateMigrations();

      if (issues.length === 0) {
        logger.info("SUCCESS: All migrations are valid");
      } else {
        logger.info("ERROR: Validation failed with issues:");
        issues.forEach((issue) => {
          logger.info(`  - ${issue.message}`);
        });
        process.exitCode = 1;
      }
      break;
    }

    case "generate":
    case "create": {
      const migrationName = args[1];
      if (!migrationName) {
        logger.error("ERROR: Please provide a migration name");
        logger.info("Usage: npm run db:migrate generate <migration_name>");
        process.exitCode = 1;
      }

      logger.info(`WORKING: Generating new migration: ${migrationName}\n`);
      const migration = await migrator.generateMigration(migrationName);
      logger.info("SUCCESS: Migration created successfully");
      logger.info(`Edit the file: ${migration.filepath}`);
      break;
    }

    case "init": {
      logger.info("WORKING: Initializing migration system\n");
      await migrator.initialize();
      logger.info("SUCCESS: Migration system initialized successfully");
      break;
    }

    case "help":
    case "--help":
    case "-h":
    default: {
      logger.info(`
Database Migration Tool

Usage: npm run db:migrate <command> [options]

Commands:
  up, migrate           Run all pending migrations
  status               Show migration status
  validate             Validate applied migrations
  generate <name>      Generate a new migration file
  create <name>        Alias for generate
  init                 Initialize migration system
  help                 Show this help message

Examples:
  npm run db:migrate up
  npm run db:migrate status
  npm run db:migrate generate add_user_preferences
  npm run db:migrate validate

Migration File Naming:
  Files should be named: YYYYMMDDHHMMSS_description.sql
  Example: 20240817120000_add_user_preferences.sql

Environment Variables:
  DATABASE_URL         PostgreSQL connection string (required)
        `);

      if (command && command !== "help" && command !== "--help" && command !== "-h") {
        logger.info(`\nERROR: Unknown command: ${command}`);
        process.exitCode = 1;
      }
      break;
    }
    }
  } catch (error) {
    logger.error("\nERROR: Migration failed:", error.message);

    if (process.env.NODE_ENV === "development") {
      logger.error("\nFull error:", error);
    }

    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
