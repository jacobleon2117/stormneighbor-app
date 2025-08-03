// File: backend/migrations/migrate.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    });
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
      console.log("✅ Migrations table ready");
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
      console.log("📁 Created migrations directory");
      return [];
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort();

    return files.map(filename => {
      const filepath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filepath, "utf8");
      const checksum = require("crypto")
        .createHash("sha256")
        .update(content)
        .digest("hex");

      return { filename, content, checksum };
    });
  }

  async executeMigration(migration) {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query("BEGIN");
      
      console.log(`⚡ Executing migration: ${migration.filename}`);
      await client.query(migration.content);
      
      const executionTime = Date.now() - startTime;
      await client.query(
        "INSERT INTO migrations (filename, checksum, execution_time) VALUES ($1, $2, $3)",
        [migration.filename, migration.checksum, executionTime]
      );
      
      await client.query("COMMIT");
      console.log(`✅ Migration completed in ${executionTime}ms: ${migration.filename}`);
      
      return { success: true, executionTime };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`❌ Migration failed: ${migration.filename}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async run() {
    console.log("🚀 Starting database migration...");
    
    try {
      await this.ensureMigrationsTable();
      
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles()
      ]);

      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      const pendingMigrations = migrationFiles.filter(m => !executedFilenames.has(m.filename));

      if (pendingMigrations.length === 0) {
        console.log("✅ No pending migrations");
        return { success: true, executed: 0 };
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
      
      let executedCount = 0;
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
        executedCount++;
      }

      console.log(`🎉 Successfully executed ${executedCount} migrations`);
      return { success: true, executed: executedCount };
      
    } catch (error) {
      console.error("💥 Migration failed:", error.message);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  async check() {
    try {
      await this.ensureMigrationsTable();
      
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles()
      ]);

      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      const pendingMigrations = migrationFiles.filter(m => !executedFilenames.has(m.filename));

      console.log(`📊 Migration Status:`);
      console.log(`   Executed: ${executedMigrations.length}`);
      console.log(`   Pending: ${pendingMigrations.length}`);
      console.log(`   Total: ${migrationFiles.length}`);

      if (pendingMigrations.length > 0) {
        console.log(`\n📋 Pending migrations:`);
        pendingMigrations.forEach(m => console.log(`   - ${m.filename}`));
        process.exit(1); // Exit with error code for CI
      }

      console.log("✅ All migrations are up to date");
      return { upToDate: true, pending: 0 };
      
    } finally {
      await this.pool.end();
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  switch (command) {
    case "run":
    case "up":
      runner.run().catch(error => {
        console.error(error);
        process.exit(1);
      });
      break;
      
    case "check":
    case "status":
      runner.check().catch(error => {
        console.error(error);
        process.exit(1);
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