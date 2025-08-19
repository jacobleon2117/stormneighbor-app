const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");

class SupabaseBackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, "../../backups");
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async createSQLBackup(type = "manual") {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `stormneighbor_${type}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    console.log(`Creating SQL backup: ${filename}`);

    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const tablesResult = await this.pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'spatial_ref_sys'
        ORDER BY tablename
      `);

      let sqlContent = `-- StormNeighbor Database Backup
-- Created: ${new Date().toISOString()}
-- Type: ${type}
-- Database: ${this.getDatabaseName()}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        console.log(`Backing up table: ${tableName}`);

        const schemaResult = await this.pool.query(
          `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `,
          [tableName]
        );

        sqlContent += `\n-- Table: ${tableName}\n`;
        sqlContent += await this.generateCreateTableSQL(tableName, schemaResult.rows);

        const dataResult = await this.pool.query(`SELECT * FROM "${tableName}"`);
        if (dataResult.rows.length > 0) {
          sqlContent += `\n-- Data for table: ${tableName}\n`;
          sqlContent += await this.generateInsertSQL(tableName, dataResult.rows);
        }
      }

      await fs.writeFile(filepath, sqlContent, "utf8");

      const stats = await fs.stat(filepath);
      const duration = Date.now() - startTime;

      const backupInfo = {
        filename,
        filepath,
        type,
        size: stats.size,
        duration,
        timestamp: new Date().toISOString(),
        success: true,
        method: "sql_export",
      };

      console.log("SUCCESS: SQL backup completed:", {
        file: filename,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        duration: `${duration}ms`,
        tables: tablesResult.rows.length,
      });

      return backupInfo;
    } catch (error) {
      console.error("SQL backup failed:", error);

      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  async generateCreateTableSQL(tableName, columns) {
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
              WHEN data_type = 'integer' THEN 'INTEGER'
              WHEN data_type = 'bigint' THEN 'BIGINT'
              WHEN data_type = 'smallint' THEN 'SMALLINT'
              WHEN data_type = 'boolean' THEN 'BOOLEAN'
              WHEN data_type = 'text' THEN 'TEXT'
              WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
              WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
              WHEN data_type = 'date' THEN 'DATE'
              WHEN data_type = 'time' THEN 'TIME'
              WHEN data_type = 'numeric' THEN 'NUMERIC'
              WHEN data_type = 'decimal' THEN 'DECIMAL'
              WHEN data_type = 'real' THEN 'REAL'
              WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
              WHEN data_type = 'json' THEN 'JSON'
              WHEN data_type = 'jsonb' THEN 'JSONB'
              WHEN data_type = 'uuid' THEN 'UUID'
              WHEN data_type = 'inet' THEN 'INET'
              ELSE UPPER(data_type)
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) || ');' as create_sql
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

  async generateInsertSQL(tableName, rows) {
    if (rows.length === 0) return "";

    const columns = Object.keys(rows[0]);
    let sql = `INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(", ")}) VALUES\n`;

    const values = rows.map((row) => {
      const rowValues = columns.map((col) => {
        const value = row[col];
        if (value === null) return "NULL";
        if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === "boolean") return value ? "true" : "false";
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      });
      return `  (${rowValues.join(", ")})`;
    });

    sql += values.join(",\n") + ";\n\n";
    return sql;
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
      const result = await client.query("SELECT version(), current_database(), current_user");
      client.release();

      console.log("SUCCESS: Database connection successful");
      console.log(`Database: ${result.rows[0].current_database}`);
      console.log(`User: ${result.rows[0].current_user}`);
      console.log(`Version: ${result.rows[0].version.split(" ").slice(0, 2).join(" ")}`);

      return true;
    } catch (error) {
      console.error("ERROR: Database connection failed:", error.message);
      return false;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(
        (file) => file.includes("stormneighbor_") && file.endsWith(".sql")
      );

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);

          return {
            filename: file,
            size: stats.size,
            created: stats.mtime,
            type: file.includes("_daily_")
              ? "daily"
              : file.includes("_weekly_")
                ? "weekly"
                : file.includes("_monthly_")
                  ? "monthly"
                  : "manual",
          };
        })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error("ERROR: Failed to list backups:", error);
      return [];
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new SupabaseBackupService();
