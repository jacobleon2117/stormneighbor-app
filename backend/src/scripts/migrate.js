#!/usr/bin/env node
// File: backend/src/scripts/migrate.js
require("dotenv").config();

const DatabaseMigrator = require("../database/migrations");

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const migrator = new DatabaseMigrator();
  
  try {
    switch (command) {
    case "up":
    case "migrate": {
      console.log("🚀 Running database migrations...\n");
      const result = await migrator.migrate();
      console.log(`\n✅ Migration complete: ${result.applied} applied, ${result.skipped} skipped`);
      break;
    }
        
    case "status": {
      console.log("📊 Database Migration Status\n");
      const status = await migrator.getStatus();
        
      console.log(`Current Version: ${status.currentVersion || "None"}`);
      console.log(`Total Migrations: ${status.totalMigrations}`);
      console.log(`Applied: ${status.appliedMigrations}`);
      console.log(`Pending: ${status.pendingMigrations}\n`);
        
      if (status.applied.length > 0) {
        console.log("Applied Migrations:");
        status.applied.forEach(m => {
          const status = m.success ? "✅" : "❌";
          console.log(`  ${status} ${m.version}: ${m.name} (${new Date(m.appliedAt).toLocaleString()})`);
        });
        console.log("");
      }
        
      if (status.pending.length > 0) {
        console.log("Pending Migrations:");
        status.pending.forEach(m => {
          console.log(`  ⏳ ${m.version}: ${m.name}`);
        });
        console.log("");
      }
      break;
    }
        
    case "validate": {
      console.log("🔍 Validating migrations...\n");
      const issues = await migrator.validateMigrations();
        
      if (issues.length === 0) {
        console.log("🎉 All migrations are valid!");
      } else {
        console.log("❌ Validation failed with issues:");
        issues.forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
        process.exit(1);
      }
      break;
    }
        
    case "generate":
    case "create": {
      const migrationName = args[1];
      if (!migrationName) {
        console.error("❌ Please provide a migration name");
        console.log("Usage: npm run db:migrate generate <migration_name>");
        process.exit(1);
      }
        
      console.log(`📝 Generating new migration: ${migrationName}\n`);
      const migration = await migrator.generateMigration(migrationName);
      console.log("✅ Migration created successfully!");
      console.log(`📁 Edit the file: ${migration.filepath}`);
      break;
    }
        
    case "init": {
      console.log("🔧 Initializing migration system...\n");
      await migrator.initialize();
      console.log("✅ Migration system initialized successfully!");
      break;
    }
        
    case "help":
    case "--help":
    case "-h":
    default: {
      console.log(`
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
        console.log(`\n❌ Unknown command: ${command}`);
        process.exit(1);
      }
      break;
    }
    }
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    
    if (process.env.NODE_ENV === "development") {
      console.error("\nFull error:", error);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;