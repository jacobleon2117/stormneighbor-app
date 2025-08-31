const fs = require("fs");
const path = require("path");
const { pool } = require("../config/database");

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(__dirname, "../../migrations");
    this.currentVersion = null;
  }

  async initialize() {
    logger.info("WORKING: Initializing database migration system");

    await this.createMigrationsTable();

    this.currentVersion = await this.getCurrentVersion();

    logger.info(
      `INFO: Current database version: ${this.currentVersion || "No migrations applied"}`
    );
  }

  async createMigrationsTable() {
    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(20) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time_ms INTEGER,
          success BOOLEAN DEFAULT TRUE,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_version 
        ON schema_migrations(version DESC)
      `);
    } finally {
      client.release();
    }
  }

  async getCurrentVersion() {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT version FROM schema_migrations 
        WHERE success = TRUE 
        ORDER BY version DESC 
        LIMIT 1
      `);

      return result.rows.length > 0 ? result.rows[0].version : null;
    } finally {
      client.release();
    }
  }

  async getAvailableMigrations() {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      logger.info(`WORKING: Created migrations directory: ${this.migrationsPath}`);
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const migrations = files
      .map((file) => {
        const match = file.match(/^(\d{14})_(.+)\.sql$/);
        if (!match) {
          if (!this.silent) {
            console.warn(
              `WARNING: Invalid migration file name: ${file} (expected: YYYYMMDDHHMMSS_name.sql)`
            );
          }
          return null;
        }

        return {
          version: match[1],
          name: match[2],
          filename: file,
          fullPath: path.join(this.migrationsPath, file),
        };
      })
      .filter(Boolean);

    return migrations;
  }

  async getPendingMigrations() {
    const available = await this.getAvailableMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));

    return available.filter((migration) => !appliedVersions.has(migration.version));
  }

  async getAppliedMigrations() {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT version, name, applied_at, success, error_message 
        FROM schema_migrations 
        ORDER BY version ASC
      `);

      return result.rows;
    } finally {
      client.release();
    }
  }

  calculateChecksum(content) {
    const crypto = require("crypto");
    const logger = require("../utils/logger");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async runMigration(migration) {
    const startTime = Date.now();
    const client = await pool.connect();

    try {
      logger.info(`WORKING: Running migration ${migration.version}: ${migration.name}`);

      const content = fs.readFileSync(migration.fullPath, "utf8");
      const checksum = this.calculateChecksum(content);

      await client.query("BEGIN");

      await client.query(content);

      const executionTime = Date.now() - startTime;
      await client.query(
        `
        INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [migration.version, migration.name, checksum, executionTime, true]
      );

      await client.query("COMMIT");

      logger.info(
        `SUCCESS: Migration ${migration.version} completed successfully (${executionTime}ms)`
      );

      return { success: true, executionTime };
    } catch (error) {
      await client.query("ROLLBACK");

      const executionTime = Date.now() - startTime;
      const content = fs.readFileSync(migration.fullPath, "utf8");
      const checksum = this.calculateChecksum(content);

      try {
        await client.query(
          `
          INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success, error_message)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [migration.version, migration.name, checksum, executionTime, false, error.message]
        );
      } catch (recordError) {
        logger.error("Failed to record migration failure:", recordError);
      }

      logger.error(`ERROR: Migration ${migration.version} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async migrate() {
    await this.initialize();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info("SUCCESS: Database is up to date! No pending migrations.");
      return { applied: 0, skipped: 0 };
    }

    logger.info(`INFO: Found ${pending.length} pending migration(s);`);

    let applied = 0;
    const skipped = 0;

    for (const migration of pending) {
      try {
        await this.runMigration(migration);
        applied++;
      } catch (error) {
        logger.error(`ERROR: Migration failed, stopping at ${migration.version}`);
        throw error;
      }
    }

    logger.info(`SUCCESS: Migration completed: ${applied} applied, ${skipped} skipped`);
    return { applied, skipped };
  }

  async validateMigrations() {
    logger.info("WORKING: Validating applied migrations");

    const applied = await this.getAppliedMigrations();
    const available = await this.getAvailableMigrations();
    const availableMap = new Map(available.map((m) => [m.version, m]));

    const issues = [];

    for (const appliedMigration of applied) {
      const availableMigration = availableMap.get(appliedMigration.version);

      if (!availableMigration) {
        issues.push({
          type: "missing_file",
          version: appliedMigration.version,
          message: `Migration file for version ${appliedMigration.version} not found`,
        });
        continue;
      }

      if (appliedMigration.success) {
        const content = fs.readFileSync(availableMigration.fullPath, "utf8");
        const currentChecksum = this.calculateChecksum(content);

        const client = await pool.connect();
        try {
          const result = await client.query(
            "SELECT checksum FROM schema_migrations WHERE version = $1 AND success = TRUE",
            [appliedMigration.version]
          );

          if (result.rows.length > 0) {
            const storedChecksum = result.rows[0].checksum;
            if (currentChecksum !== storedChecksum) {
              issues.push({
                type: "checksum_mismatch",
                version: appliedMigration.version,
                message: "Migration file has been modified after application",
              });
            }
          }
        } finally {
          client.release();
        }
      }
    }

    if (issues.length === 0) {
      logger.info("SUCCESS: All migrations validated successfully");
    } else {
      logger.info(`WARNING: Found ${issues.length} validation issue(s);:`);
      issues.forEach((issue) => {
        logger.info(`  - ${issue.type}: ${issue.message}`);
      });
    }

    return issues;
  }

  async generateMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
    const version = timestamp.substring(0, 14);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `${version}_${safeName}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    const template = `-- Migration: ${name}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- Add your SQL commands here
-- Example:
-- CREATE TABLE example_table (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- To rollback this migration, create a separate rollback script
`;

    fs.writeFileSync(filepath, template);

    logger.info(`WORKING: Generated migration file: ${filename}`);
    logger.info(`INFO: Location: ${filepath}`);

    return { version, filename, filepath };
  }

  async getStatus() {
    await this.initialize();

    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    const available = await this.getAvailableMigrations();

    return {
      currentVersion: this.currentVersion,
      totalMigrations: available.length,
      appliedMigrations: applied.length,
      pendingMigrations: pending.length,
      applied: applied.map((m) => ({
        version: m.version,
        name: m.name,
        appliedAt: m.applied_at,
        success: m.success,
      })),
      pending: pending.map((m) => ({
        version: m.version,
        name: m.name,
        filename: m.filename,
      })),
    };
  }
}

module.exports = DatabaseMigrator;
