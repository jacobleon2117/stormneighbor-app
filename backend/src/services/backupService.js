const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const cron = require("node-cron");

class DatabaseBackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, "../../backups");
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 30;
    this.compressionEnabled = process.env.BACKUP_COMPRESSION !== "false";
    this.remoteUpload = process.env.BACKUP_REMOTE_UPLOAD === "true";

    this.schedules = {
      daily: process.env.BACKUP_DAILY_SCHEDULE || "0 2 * * *",
      weekly: process.env.BACKUP_WEEKLY_SCHEDULE || "0 3 * * 0",
      monthly: process.env.BACKUP_MONTHLY_SCHEDULE || "0 4 1 * *",
    };

    this.initializeBackupDirectory();
  }

  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      console.error("Failed to create backup directory:", error);
      throw error;
    }
  }

  generateBackupFilename(type = "manual") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `stormneighbor_${type}_${timestamp}.sql`;
    return this.compressionEnabled ? `${filename}.gz` : filename;
  }

  async createBackup(type = "manual", options = {}) {
    const startTime = Date.now();
    const filename = this.generateBackupFilename(type);
    const filepath = path.join(this.backupDir, filename);

    console.log(`Starting ${type} database backup: ${filename}`);

    try {
      const dbUrl = new URL(process.env.DATABASE_URL);

      const password = dbUrl.password ? decodeURIComponent(dbUrl.password) : null;
      const username = dbUrl.username || "postgres";
      const database = dbUrl.pathname.slice(1);

      console.log(`Connecting to: ${dbUrl.hostname}:${dbUrl.port || 5432} as ${username}`);

      const pgDumpOptions = [
        "--verbose",
        "--clean",
        "--no-acl",
        "--no-owner",
        "--format=custom",
        "--file=" + (this.compressionEnabled ? filepath.replace(".gz", "") : filepath),
        `--host=${dbUrl.hostname}`,
        `--port=${dbUrl.port || 5432}`,
        `--username=${username}`,
        `--dbname=${database}`,
      ];

      if (options.schemaOnly) {
        pgDumpOptions.push("--schema-only");
      }

      if (options.dataOnly) {
        pgDumpOptions.push("--data-only");
      }

      if (options.excludeTables) {
        options.excludeTables.forEach((table) => {
          pgDumpOptions.push(`--exclude-table=${table}`);
        });
      }

      await this.executePgDump(pgDumpOptions, password);

      if (this.compressionEnabled) {
        await this.compressBackup(filepath.replace(".gz", ""), filepath);
      }

      const stats = await fs.stat(filepath);
      const duration = Date.now() - startTime;

      const backupInfo = {
        filename,
        filepath,
        type,
        size: stats.size,
        duration,
        timestamp: new Date().toISOString(),
        compressed: this.compressionEnabled,
        success: true,
      };

      console.log("Backup completed successfully:", {
        file: filename,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
      });

      if (this.remoteUpload) {
        await this.uploadToRemoteStorage(filepath, backupInfo);
      }

      await this.cleanupOldBackups();

      await this.logBackupCompletion(backupInfo);

      return backupInfo;
    } catch (error) {
      console.error("Backup failed:", error);

      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        console.error("Failed to cleanup incomplete backup file:", cleanupError);
      }

      const backupInfo = {
        filename,
        type,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };

      await this.logBackupCompletion(backupInfo);
      throw error;
    }
  }

  async executePgDump(options, password) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (password) {
        env.PGPASSWORD = password;
      }

      const pgDump = spawn("pg_dump", options, {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      pgDump.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pgDump.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pgDump.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
        }
      });

      pgDump.on("error", (error) => {
        reject(new Error(`pg_dump execution failed: ${error.message}`));
      });
    });
  }

  async compressBackup(inputPath, _outputPath) {
    return new Promise((resolve, reject) => {
      const gzip = spawn("gzip", ["-9", inputPath]);

      gzip.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Compression failed with code ${code}`));
        }
      });

      gzip.on("error", reject);
    });
  }

  async uploadToRemoteStorage(_filepath, _backupInfo) {
    console.log("Remote upload not configured - implement uploadToRemoteStorage method");
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(
          (file) =>
            file.includes("stormneighbor_") && (file.endsWith(".sql") || file.endsWith(".gz"))
        )
        .map((file) => ({
          name: file,
          path: path.join(this.backupDir, file),
        }));

      if (backupFiles.length <= this.maxBackups) {
        return;
      }

      const fileStats = await Promise.all(
        backupFiles.map(async (file) => ({
          ...file,
          stats: await fs.stat(file.path),
        }))
      );

      fileStats.sort((a, b) => a.stats.mtime - b.stats.mtime);

      const filesToDelete = fileStats.slice(0, fileStats.length - this.maxBackups);

      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      }

      console.log(`Cleanup completed: ${filesToDelete.length} old backups removed`);
    } catch (error) {
      console.error("Backup cleanup failed:", error);
    }
  }

  async logBackupCompletion(backupInfo) {
    const logEntry = {
      timestamp: backupInfo.timestamp,
      type: backupInfo.type,
      filename: backupInfo.filename,
      success: backupInfo.success,
      size: backupInfo.size || null,
      duration: backupInfo.duration,
      error: backupInfo.error || null,
    };

    const logFile = path.join(this.backupDir, "backup.log");
    const logLine = JSON.stringify(logEntry) + "\n";

    try {
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error("Failed to write backup log:", error);
    }

    console.log("Backup logged:", logEntry);
  }

  async restoreBackup(backupFile, options = {}) {
    const startTime = Date.now();
    console.log(`Starting database restore from: ${backupFile}`);

    try {
      const backupPath = path.isAbsolute(backupFile)
        ? backupFile
        : path.join(this.backupDir, backupFile);

      await fs.access(backupPath);

      const dbUrl = new URL(process.env.DATABASE_URL);

      const password = dbUrl.password ? decodeURIComponent(dbUrl.password) : null;
      const username = dbUrl.username || "postgres";
      const database = dbUrl.pathname.slice(1);

      const pgRestoreOptions = [
        "--verbose",
        "--clean",
        "--no-acl",
        "--no-owner",
        `--host=${dbUrl.hostname}`,
        `--port=${dbUrl.port || 5432}`,
        `--username=${username}`,
        `--dbname=${database}`,
        backupPath,
      ];

      if (options.schemaOnly) {
        pgRestoreOptions.push("--schema-only");
      }

      if (options.dataOnly) {
        pgRestoreOptions.push("--data-only");
      }

      await this.executePgRestore(pgRestoreOptions, password);
      const duration = Date.now() - startTime;

      console.log(`Database restore completed successfully in ${duration}ms`);
      return { success: true, duration, file: backupFile };
    } catch (error) {
      console.error("Database restore failed:", error);
      throw error;
    }
  }

  async executePgRestore(options, password) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (password) {
        env.PGPASSWORD = password;
      }

      const pgRestore = spawn("pg_restore", options, {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      pgRestore.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pgRestore.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pgRestore.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`pg_restore failed with code ${code}: ${stderr}`));
        }
      });

      pgRestore.on("error", (error) => {
        reject(new Error(`pg_restore execution failed: ${error.message}`));
      });
    });
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(
        (file) => file.includes("stormneighbor_") && (file.endsWith(".sql") || file.endsWith(".gz"))
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
            compressed: file.endsWith(".gz"),
          };
        })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error("Failed to list backups:", error);
      return [];
    }
  }

  startScheduledBackups() {
    console.log("Starting scheduled backup tasks...");

    cron.schedule(this.schedules.daily, () => {
      console.log("Running scheduled daily backup...");
      this.createBackup("daily").catch((error) => {
        console.error("Scheduled daily backup failed:", error);
      });
    });

    cron.schedule(this.schedules.weekly, () => {
      console.log("Running scheduled weekly backup...");
      this.createBackup("weekly").catch((error) => {
        console.error("Scheduled weekly backup failed:", error);
      });
    });

    cron.schedule(this.schedules.monthly, () => {
      console.log("Running scheduled monthly backup...");
      this.createBackup("monthly").catch((error) => {
        console.error("Scheduled monthly backup failed:", error);
      });
    });

    console.log("Backup schedules configured:", this.schedules);
  }

  stopScheduledBackups() {
    cron.destroy();
    console.log("All scheduled backup tasks stopped");
  }

  async getBackupStats() {
    const backups = await this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      backupDirectory: this.backupDir,
      maxBackups: this.maxBackups,
      compressionEnabled: this.compressionEnabled,
      schedules: this.schedules,
    };
  }
}

module.exports = new DatabaseBackupService();
