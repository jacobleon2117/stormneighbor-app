const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");

class SupabaseBackupService {
  constructor(options = {}) {
    this.backupDir =
      options.backupDir || process.env.BACKUP_DIR || path.join(__dirname, "../../backups");
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.filenamePrefix = options.filenamePrefix || "stormneighbor";
  }

  async createSQLBackup(type = "manual") {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${this.filenamePrefix}_${type}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    logger.info(`Starting SQL backup: ${filename}`);

    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const tables = await this.getPublicTables();
      if (tables.length === 0) {
        throw new Error("No public tables found to backup.");
      }

      const sqlParts = [
        `-- Database Backup`,
        `-- Created: ${new Date().toISOString()}`,
        `-- Type: ${type}`,
        `-- Database: ${this.getDatabaseName()}\n`,
        `SET statement_timeout = 0;`,
        `SET lock_timeout = 0;`,
        `SET client_encoding = 'UTF8';`,
        `SET standard_conforming_strings = on;`,
        `SET check_function_bodies = false;`,
        `SET xmloption = content;`,
        `SET client_min_messages = warning;`,
        `SET row_security = off;\n`,
      ];

      for (const table of tables) {
        logger.info(`Backing up table: ${table}`);
        sqlParts.push(`\n-- Table: ${table}\n`);
        sqlParts.push(await this.generateCreateTableSQL(table));
        sqlParts.push(await this.generateInsertSQL(table));
      }

      const sqlContent = sqlParts.join("\n");

      await fs.writeFile(filepath, sqlContent, "utf8");

      const stats = await fs.stat(filepath);
      const duration = Date.now() - startTime;

      logger.info(
        `Backup completed: ${filename} (${(stats.size / 1024).toFixed(2)} KB in ${duration}ms)`
      );

      return {
        filename,
        filepath,
        type,
        size: stats.size,
        duration,
        timestamp: new Date().toISOString(),
        success: true,
        method: "sql_export",
      };
    } catch (error) {
      logger.error("Backup failed:", error);
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        logger.warn("Failed to remove incomplete backup file:", cleanupError.message);
      }
    }
  }

  async getPublicTables() {
    const result = await this.pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'spatial_ref_sys'
      ORDER BY tablename
    `);
    return result.rows.map((r) => r.tablename);
  }

  async generateCreateTableSQL(tableName) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT
          'CREATE TABLE IF NOT EXISTS "' || $1 || '" (' ||
          string_agg(
            '"' || column_name || '" ' ||
            CASE
              WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
              WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
              WHEN data_type IN ('integer','bigint','smallint','boolean','text','uuid','json','jsonb','numeric','decimal','real','double precision','date','time') THEN UPPER(data_type)
              WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
              WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
              WHEN data_type = 'inet' THEN 'INET'
              ELSE UPPER(data_type)
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) || ');' AS create_sql
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        GROUP BY table_name
      `,
        [tableName]
      );

      return result.rows[0]?.create_sql + "\n\n" || "";
    } finally {
      client.release();
    }
  }

  async generateInsertSQL(tableName) {
    const result = await this.pool.query(`SELECT * FROM "${tableName}"`);
    if (result.rows.length === 0) return "";

    const columns = Object.keys(result.rows[0]);
    const values = result.rows.map((row) => {
      const rowValues = columns.map((col) => {
        const val = row[col];
        if (val === null) return "NULL";
        if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      return `  (${rowValues.join(", ")})`;
    });

    return `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES\n${values.join(",\n")};\n\n`;
  }

  getDatabaseName() {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      return dbUrl.pathname.slice(1);
    } catch {
      return "unknown";
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const res = await client.query("SELECT version(), current_database(), current_user");
      client.release();

      logger.info("Database connection successful");
      logger.info(`Database: ${res.rows[0].current_database}`);
      logger.info(`User: ${res.rows[0].current_user}`);
      logger.info(`Version: ${res.rows[0].version.split(" ").slice(0, 2).join(" ")}`);

      return true;
    } catch (error) {
      logger.error("Database connection failed:", error.message);
      return false;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = await Promise.all(
        files
          .filter((f) => f.startsWith(`${this.filenamePrefix}_`) && f.endsWith(".sql"))
          .map(async (file) => {
            const stats = await fs.stat(path.join(this.backupDir, file));
            let type = "manual";
            if (file.includes("_daily_")) type = "daily";
            else if (file.includes("_weekly_")) type = "weekly";
            else if (file.includes("_monthly_")) type = "monthly";

            return {
              filename: file,
              size: stats.size,
              created: stats.mtime,
              type,
            };
          })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error("Failed to list backups:", error);
      return [];
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new SupabaseBackupService();
