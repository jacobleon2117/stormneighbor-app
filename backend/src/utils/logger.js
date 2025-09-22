const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

const errorTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "5m",
  maxFiles: "1d",
  zippedArchive: true,
  createSymlink: true,
  symlinkName: "error-current.log",
});

const combinedTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "5m",
  maxFiles: "1d",
  zippedArchive: true,
  createSymlink: true,
  symlinkName: "combined-current.log",
});

const transports = [];
if (process.env.DISABLE_FILE_LOGGING !== "true") {
  transports.push(errorTransport, combinedTransport);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "info"),
  format: logFormat,
  defaultMeta: { service: "stormneighbor-backend" },
  transports,
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: developmentFormat }));
}

if (process.env.NODE_ENV === "test") {
  logger.transports.forEach((t) => (t.silent = true));
}

const cleanupLargeLogs = () => {
  const logsDir = "logs";
  try {
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      files.forEach((file) => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.size > 10 * 1024 * 1024) {
          fs.writeFileSync(
            filePath,
            `[TRUNCATED: File was ${(stats.size / 1024 / 1024).toFixed(2)}MB on ${new Date().toISOString()}]\n`
          );
          logger.warn(`Truncated large log file: ${filePath}`);
        }

        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        if (stats.mtime.getTime() < twoDaysAgo && !file.includes("current")) {
          fs.unlinkSync(filePath);
          logger.warn(`Deleted old log file: ${filePath}`);
        }
      });
    }
  } catch (error) {
    logger.warn(`Log cleanup failed: ${error.message}`);
  }
};

cleanupLargeLogs();

module.exports = logger;
