// File: backend/migrations/migrate.js
const { Pool } = require("pg");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);
class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL?.includes("supabase") || process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
    console.log(
      "Using SSL:",
      process.env.DATABASE_URL?.includes("supabase") || process.env.NODE_ENV === "production"
    );
  }

  async ensureMigrationsTable() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time INTEGER NOT NULL
        )
      `);
      console.log("SUCESS: Migrations table ready");
    } finally {
      client.release();
    }
  }

  async getExecutedMigrations() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT filename, checksum FROM migrations ORDER BY executed_at"
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getMigrationFiles() {
    const migrationsDir = path.join(__dirname, "files");

    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log("SUCCESS: Created migrations directory");
      return [];
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    return files.map((filename) => {
      const filepath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filepath, "utf8");
      const checksum = crypto.createHash("sha256").update(content).digest("hex");

      return { filename, content, checksum };
    });
  }

  async executeMigration(migration) {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query("BEGIN");

      console.log(`Executing migration: ${migration.filename}`);
      await client.query(migration.content);

      const executionTime = Date.now() - startTime;
      await client.query(
        "INSERT INTO migrations (filename, checksum, execution_time) VALUES ($1, $2, $3)",
        [migration.filename, migration.checksum, executionTime]
      );

      await client.query("COMMIT");
      console.log(`SUCCESS: Migration completed in ${executionTime}ms: ${migration.filename}`);

      return { success: true, executionTime };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`ERROR: Migration failed: ${migration.filename}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async run() {
    console.log("Starting database migration...");

    try {
      await this.ensureMigrationsTable();

      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);

      const executedMap = new Map(executedMigrations.map((m) => [m.filename, m.checksum]));
      for (const migration of migrationFiles) {
        if (executedMap.has(migration.filename)) {
          const storedChecksum = executedMap.get(migration.filename);
          if (storedChecksum !== migration.checksum) {
            throw new Error(
              `Checksum mismatch for migration '${migration.filename}'. File has been modified since last execution.`
            );
          }
        }
      }

      const executedFilenames = new Set(executedMigrations.map((m) => m.filename));
      const pendingMigrations = migrationFiles.filter((m) => !executedFilenames.has(m.filename));

      if (pendingMigrations.length === 0) {
        console.log("SUCCESS: No pending migrations");
        return { success: true, executed: 0 };
      }

      console.log(`Found ${pendingMigrations.length} pending migration(s)`);

      let executedCount = 0;
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
        executedCount++;
      }

      console.log(`Successfully executed ${executedCount} migration(s)`);
      return { success: true, executed: executedCount };
    } catch (error) {
      console.error("ERROR: Migration failed:", error);
      process.exitCode = 1;
    } finally {
      await this.pool.end();
    }
  }

  async check() {
    try {
      await this.ensureMigrationsTable();

      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);

      const executedFilenames = new Set(executedMigrations.map((m) => m.filename));
      const pendingMigrations = migrationFiles.filter((m) => !executedFilenames.has(m.filename));

      console.log("Migration Status:");
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${pendingMigrations.length}`);
      console.log(`Total: ${migrationFiles.length}`);

      if (pendingMigrations.length > 0) {
        console.log("\nPending migration(s):");
        pendingMigrations.forEach((m) => console.log(`   - ${m.filename}`));
        process.exitCode = 1;
      }

      console.log("SUCCESS: All migrations are up to date");
      return { upToDate: true, pending: 0 };
    } catch (error) {
      console.error("ERROR: Migration check failed:", error);
      process.exitCode = 1;
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  switch (command) {
  case "run":
  case "up":
    runner.run().catch((err) => {
      console.error("ERROR:", err);
      process.exitCode = 1;
    });
    break;

  case "check":
  case "status":
    runner.check().catch((err) => {
      console.error("ERROR:", err);
      process.exitCode = 1;
    });
    break;

  default:
    console.log(`
🗄️  Database Migration Tool

Usage:
  node migrate.js run     - Execute pending migrations
  node migrate.js check   - Check migration status

Examples:
  npm run db:migrate        # Run migrations
  npm run db:migrate:check  # Check status
      `);
    process.exitCode = 1;
  }
}
