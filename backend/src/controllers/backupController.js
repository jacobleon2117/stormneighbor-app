const backupService = require("../services/backupService");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const createBackup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { type = "manual", schemaOnly = false, dataOnly = false, excludeTables = [] } = req.body;

    logger.info(`Admin ${req.user.userId} initiating ${type} backup`);

    const backupInfo = await backupService.createBackup(type, {
      schemaOnly,
      dataOnly,
      excludeTables,
    });

    res.status(201).json({
      success: true,
      message: "Database backup created successfully",
      data: {
        backup: backupInfo,
        downloadUrl: `/api/v1/admin/backups/download/${backupInfo.filename}`,
      },
    });
  } catch (error) {
    logger.error("Backup creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create database backup",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const listBackups = async (_req, res) => {
  try {
    const backups = await backupService.listBackups();
    const stats = await backupService.getBackupStats();

    res.json({
      success: true,
      message: "Backup list retrieved successfully",
      data: {
        backups,
        stats,
        count: backups.length,
      },
    });
  } catch (error) {
    logger.error("Failed to list backups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve backup list",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const backups = await backupService.listBackups();
    const backup = backups.find((b) => b.filename === filename);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup file not found",
      });
    }

    const backupPath = require("path").join(backupService.backupDir, filename);

    res.setHeader("Content-Type", backup.compressed ? "application/gzip" : "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", backup.size);

    logger.info(`Admin ${req.user.userId} downloading backup: ${filename}`);

    const fs = require("fs");
    const fileStream = fs.createReadStream(backupPath);

    fileStream.on("error", (error) => {
      logger.error("File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to download backup file",
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error("Backup download failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download backup",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const backups = await backupService.listBackups();
    const backup = backups.find((b) => b.filename === filename);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup file not found",
      });
    }

    const backupPath = require("path").join(backupService.backupDir, filename);
    await require("fs").promises.unlink(backupPath);

    logger.info(`Admin ${req.user.userId} deleted backup: ${filename}`);

    res.json({
      success: true,
      message: "Backup deleted successfully",
      data: {
        filename,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Backup deletion failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete backup",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const restoreBackup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { filename } = req.params;
    const { schemaOnly = false, dataOnly = false, confirmRestore = false } = req.body;

    if (!confirmRestore) {
      return res.status(400).json({
        success: false,
        message: "Database restore requires explicit confirmation",
        hint: "Set confirmRestore: true in request body",
      });
    }

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    logger.info(`Admin ${req.user.userId} initiating database restore from: ${filename}`);

    const result = await backupService.restoreBackup(filename, {
      schemaOnly,
      dataOnly,
    });

    res.json({
      success: true,
      message: "Database restore completed successfully",
      data: {
        restore: result,
        restoredAt: new Date().toISOString(),
        restoredBy: req.user.userId,
      },
    });
  } catch (error) {
    logger.error("Database restore failed:", error);
    res.status(500).json({
      success: false,
      message: "Database restore failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const getBackupStats = async (_req, res) => {
  try {
    const stats = await backupService.getBackupStats();

    res.json({
      success: true,
      message: "Backup statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("Failed to get backup stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve backup statistics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

const testBackupSystem = async (_req, res) => {
  try {
    const testBackup = await backupService.createBackup("test", {
      schemaOnly: true,
    });

    const testPath = require("path").join(backupService.backupDir, testBackup.filename);
    await require("fs").promises.unlink(testPath);

    res.json({
      success: true,
      message: "Backup system test completed successfully",
      data: {
        testDuration: testBackup.duration,
        backupDirectory: backupService.backupDir,
        postgresqlAvailable: true,
        compressionEnabled: backupService.compressionEnabled,
      },
    });
  } catch (error) {
    logger.error("Backup system test failed:", error);
    res.status(500).json({
      success: false,
      message: "Backup system test failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      troubleshooting: {
        checkPostgreSQL: "Ensure pg_dump and pg_restore are installed and accessible",
        checkPermissions: "Verify write permissions to backup directory",
        checkDatabaseURL: "Ensure DATABASE_URL is correctly configured",
      },
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  getBackupStats,
  testBackupSystem,
};
