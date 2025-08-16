// File: backend/src/routes/backup.js
const express = require("express");
const { body, param } = require("express-validator");
const { auth } = require("../middleware/auth");
const { adminAuth, requirePermission } = require("../middleware/adminAuth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  getBackupStats,
  testBackupSystem,
} = require("../controllers/backupController");

const router = express.Router();

router.use(auth);
router.use(adminAuth);

const createBackupValidation = [
  body("type")
    .optional()
    .isIn(["manual", "daily", "weekly", "monthly", "test"])
    .withMessage("Type must be one of: manual, daily, weekly, monthly, test"),
  body("schemaOnly").optional().isBoolean().withMessage("schemaOnly must be a boolean"),
  body("dataOnly").optional().isBoolean().withMessage("dataOnly must be a boolean"),
  body("excludeTables").optional().isArray().withMessage("excludeTables must be an array"),
  body("excludeTables.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Table names must be between 1 and 100 characters"),
];

const restoreBackupValidation = [
  param("filename")
    .isString()
    .trim()
    .matches(/^stormneighbor_[a-z]+_[\d-T]+\.sql(\.gz)?$/)
    .withMessage("Invalid backup filename format"),
  body("confirmRestore")
    .equals("true")
    .withMessage("Database restore requires explicit confirmation"),
  body("schemaOnly").optional().isBoolean().withMessage("schemaOnly must be a boolean"),
  body("dataOnly").optional().isBoolean().withMessage("dataOnly must be a boolean"),
];

const filenameValidation = [
  param("filename")
    .isString()
    .trim()
    .matches(/^stormneighbor_[a-z]+_[\d-T]+\.sql(\.gz)?$/)
    .withMessage("Invalid backup filename format"),
];

router.get("/test", requirePermission("backups", "test"), testBackupSystem);

router.get("/stats", requirePermission("backups", "read"), getBackupStats);

router.get("/", requirePermission("backups", "read"), listBackups);

router.post(
  "/",
  requirePermission("backups", "create"),
  createBackupValidation,
  handleValidationErrors,
  createBackup
);

router.get(
  "/download/:filename",
  requirePermission("backups", "download"),
  filenameValidation,
  handleValidationErrors,
  downloadBackup
);

router.post(
  "/restore/:filename",
  requirePermission("backups", "restore"),
  restoreBackupValidation,
  handleValidationErrors,
  restoreBackup
);

router.delete(
  "/:filename",
  requirePermission("backups", "delete"),
  filenameValidation,
  handleValidationErrors,
  deleteBackup
);

module.exports = router;
