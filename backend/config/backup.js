// File: backend/src/config/backup.js
require("dotenv").config();

const backupConfig = {
  backupDir: process.env.BACKUP_DIR || require("path").join(__dirname, "../../backups"),

  maxBackups: parseInt(process.env.MAX_BACKUPS) || 30,

  compressionEnabled: process.env.BACKUP_COMPRESSION !== "false",
  compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL) || 9,

  schedules: {
    daily: process.env.BACKUP_DAILY_SCHEDULE || "0 2 * * *",
    weekly: process.env.BACKUP_WEEKLY_SCHEDULE || "0 3 * * 0",
    monthly: process.env.BACKUP_MONTHLY_SCHEDULE || "0 4 1 * *",
  },

  remoteUpload: process.env.BACKUP_REMOTE_UPLOAD === "true",

  s3: {
    bucket: process.env.BACKUP_S3_BUCKET,
    region: process.env.BACKUP_S3_REGION || "us-east-1",
    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
    prefix: process.env.BACKUP_S3_PREFIX || "database-backups/",
  },

  gcs: {
    bucket: process.env.BACKUP_GCS_BUCKET,
    projectId: process.env.BACKUP_GCS_PROJECT_ID,
    keyFilename: process.env.BACKUP_GCS_KEY_FILE,
    prefix: process.env.BACKUP_GCS_PREFIX || "database-backups/",
  },

  notifications: {
    enabled: process.env.BACKUP_NOTIFICATIONS === "true",
    email: process.env.BACKUP_NOTIFICATION_EMAIL,
    webhook: process.env.BACKUP_NOTIFICATION_WEBHOOK,
    onSuccess: process.env.BACKUP_NOTIFY_SUCCESS === "true",
    onFailure: process.env.BACKUP_NOTIFY_FAILURE !== "false",
  },

  postgresql: {
    binaryPath: process.env.POSTGRES_BIN_PATH,
    connectionTimeout: parseInt(process.env.BACKUP_CONNECTION_TIMEOUT) || 30000,
    dumpOptions: {
      format: process.env.BACKUP_FORMAT || "custom",
      verbose: process.env.BACKUP_VERBOSE !== "false",
      clean: process.env.BACKUP_CLEAN !== "false",
      noAcl: process.env.BACKUP_NO_ACL !== "false",
      noOwner: process.env.BACKUP_NO_OWNER !== "false",
    },
  },

  security: {
    allowDownload: process.env.BACKUP_ALLOW_DOWNLOAD !== "false",
    allowRestore: process.env.BACKUP_ALLOW_RESTORE === "true",
    maxDownloadSize: parseInt(process.env.BACKUP_MAX_DOWNLOAD_SIZE) || 1024 * 1024 * 1024,
    encryptBackups: process.env.BACKUP_ENCRYPTION === "true",
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  },
};

const validateBackupConfig = () => {
  const warnings = [];
  const errors = [];

  if (!backupConfig.backupDir) {
    errors.push("BACKUP_DIR must be specified");
  }

  if (backupConfig.remoteUpload && backupConfig.s3.bucket) {
    if (!backupConfig.s3.accessKeyId || !backupConfig.s3.secretAccessKey) {
      warnings.push("S3 credentials not configured - remote upload will fail");
    }
  }

  if (backupConfig.remoteUpload && backupConfig.gcs.bucket) {
    if (!backupConfig.gcs.projectId || !backupConfig.gcs.keyFilename) {
      warnings.push("GCS credentials not configured - remote upload will fail");
    }
  }

  if (backupConfig.security.encryptBackups && !backupConfig.security.encryptionKey) {
    errors.push("BACKUP_ENCRYPTION_KEY must be provided when encryption is enabled");
  }

  if (
    backupConfig.notifications.enabled &&
    !backupConfig.notifications.email &&
    !backupConfig.notifications.webhook
  ) {
    warnings.push("Backup notifications enabled but no email or webhook configured");
  }

  if (backupConfig.maxBackups < 1 || backupConfig.maxBackups > 365) {
    warnings.push("MAX_BACKUPS should be between 1 and 365");
  }

  if (errors.length > 0) {
    console.error("BACKUP CONFIG ERRORS:");
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Invalid backup configuration");
  }

  if (warnings.length > 0) {
    console.warn("BACKUP CONFIG WARNINGS:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log("SUCCESS: Backup configuration validated successfully");
  return true;
};

module.exports = {
  backupConfig,
  validateBackupConfig,
};
