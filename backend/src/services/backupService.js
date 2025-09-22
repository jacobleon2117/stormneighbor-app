const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const cron = require("node-cron");
const logger = require("../utils/logger");

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

    this.cronTasks = [];
    this.initializeBackupDirectory();
  }

  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      logger.error("Failed to create backup directory:", error);
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

    logger.info(`Starting ${type} database backup: ${filename}`);

    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const password = dbUrl.password ? decodeURIComponent(dbUrl.password) : null;
      const username = dbUrl.username || "postgres";
      const database = dbUrl.pathname.slice(1);

      const tempFile = this.compressionEnabled ? filepath.replace(".gz", "") : filepath;

      const pgDumpOptions = [
        "--verbose",
        "--clean",
        "--no-acl",
        "--no-owner",
        "--format=custom",
        `--file=${tempFile}`,
        `--host=${dbUrl.hostname}`,
        `--port=${dbUrl.port || 5432}`,
        `--username=${username}`,
        `--dbname=${database}`,
      ];

      if (options.schemaOnly) pgDumpOptions.push("--schema-only");
      if (options.dataOnly) pgDumpOptions.push("--data-only");
      if (options.excludeTables)
        options.excludeTables.forEach((table) => pgDumpOptions.push(`--exclude-table=${table}`));

      await this.executePgDump(pgDumpOptions, password);

      if (this.compressionEnabled) await this.compressBackup(tempFile, filepath);

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

      logger.info("Backup completed successfully:", {
        file: filename,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
      });

      if (this.remoteUpload) await this.uploadToRemoteStorage(filepath, backupInfo);
      await this.cleanupOldBackups();
      await this.logBackupCompletion(backupInfo);

      return backupInfo;
    } catch (error) {
      logger.error("Backup failed:", error);

      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        logger.warn("Failed to remove incomplete backup file:", cleanupError.message);
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

  executePgDump(options, password) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (password) env.PGPASSWORD = password;

      const pgDump = spawn("pg_dump", options, { env, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "",
        stderr = "";

      pgDump.stdout.on("data", (data) => (stdout += data.toString()));
      pgDump.stderr.on("data", (data) => (stderr += data.toString()));

      pgDump.on("close", (code) =>
        code === 0
          ? resolve({ stdout, stderr })
          : reject(new Error(`pg_dump failed with code ${code}: ${stderr}`))
      );

      pgDump.on("error", (err) => reject(new Error(`pg_dump execution failed: ${err.message}`)));
    });
  }

  compressBackup(inputPath, _outputPath) {
    return new Promise((resolve, reject) => {
      const gzip = spawn("gzip", ["-9", inputPath]);

      gzip.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`Compression failed with code ${code}`))
      );
      gzip.on("error", reject);
    });
  }

  uploadToRemoteStorage(_filepath, _backupInfo) {
    logger.info("Remote upload not configured - implement uploadToRemoteStorage method");
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(
          (file) =>
            file.includes("stormneighbor_") && (file.endsWith(".sql") || file.endsWith(".gz"))
        )
        .map((file) => ({ name: file, path: path.join(this.backupDir, file) }));

      if (backups.length <= this.maxBackups) return;

      const filesWithStats = await Promise.all(
        backups.map(async (file) => ({ ...file, stats: await fs.stat(file.path) }))
      );

      filesWithStats.sort((a, b) => a.stats.mtime - b.stats.mtime);

      const toDelete = filesWithStats.slice(0, filesWithStats.length - this.maxBackups);
      for (const file of toDelete) {
        await fs.unlink(file.path);
        logger.info(`Deleted old backup: ${file.name}`);
      }
    } catch (error) {
      logger.error("Backup cleanup failed:", error);
    }
  }

  async logBackupCompletion(backupInfo) {
    const logFile = path.join(this.backupDir, "backup.log");
    const logLine =
      JSON.stringify({
        timestamp: backupInfo.timestamp,
        type: backupInfo.type,
        filename: backupInfo.filename,
        success: backupInfo.success,
        size: backupInfo.size || null,
        duration: backupInfo.duration,
        error: backupInfo.error || null,
      }) + "\n";

    try {
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      logger.error("Failed to write backup log:", error);
    }

    logger.info("Backup logged:", backupInfo);
  }

  async restoreBackup(backupFile, options = {}) {
    const startTime = Date.now();
    logger.info(`Starting restore from: ${backupFile}`);

    try {
      const backupPath = path.isAbsolute(backupFile)
        ? backupFile
        : path.join(this.backupDir, backupFile);
      await fs.access(backupPath);

      const dbUrl = new URL(process.env.DATABASE_URL);
      const password = dbUrl.password ? decodeURIComponent(dbUrl.password) : null;
      const username = dbUrl.username || "postgres";
      const database = dbUrl.pathname.slice(1);

      const restoreOptions = [
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

      if (options.schemaOnly) restoreOptions.push("--schema-only");
      if (options.dataOnly) restoreOptions.push("--data-only");

      await this.executePgRestore(restoreOptions, password);

      const duration = Date.now() - startTime;
      logger.info(`Restore completed in ${duration}ms`);
      return { success: true, duration, file: backupFile };
    } catch (error) {
      logger.error("Restore failed:", error);
      throw error;
    }
  }

  executePgRestore(options, password) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (password) env.PGPASSWORD = password;

      const pgRestore = spawn("pg_restore", options, { env, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "",
        stderr = "";

      pgRestore.stdout.on("data", (data) => (stdout += data.toString()));
      pgRestore.stderr.on("data", (data) => (stderr += data.toString()));

      pgRestore.on("close", (code) =>
        code === 0
          ? resolve({ stdout, stderr })
          : reject(new Error(`pg_restore failed with code ${code}: ${stderr}`))
      );

      pgRestore.on("error", (err) =>
        reject(new Error(`pg_restore execution failed: ${err.message}`))
      );
    });
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(
          (file) =>
            file.includes("stormneighbor_") && (file.endsWith(".sql") || file.endsWith(".gz"))
        )
        .map(async (file) => {
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
        });

      return (await Promise.all(backups)).sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error("Failed to list backups:", error);
      return [];
    }
  }

  startScheduledBackups() {
    ["daily", "weekly", "monthly"].forEach((type) => {
      const task = cron.schedule(this.schedules[type], () => {
        logger.info(`Running scheduled ${type} backup...`);
        this.createBackup(type).catch((err) =>
          logger.error(`Scheduled ${type} backup failed:`, err)
        );
      });
      this.cronTasks.push(task);
    });

    logger.info("Scheduled backup tasks configured:", this.schedules);
  }

  stopScheduledBackups() {
    this.cronTasks.forEach((task) => task.stop());
    this.cronTasks = [];
    logger.info("All scheduled backup tasks stopped");
  }

  async getBackupStats() {
    const backups = await this.listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

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
