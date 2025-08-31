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
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
});

const combinedTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: logFormat,
  defaultMeta: { service: "stormneighbor-backend" },
  transports: [errorTransport, combinedTransport],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: developmentFormat }));
}

if (process.env.NODE_ENV === "test") {
  logger.transports.forEach((t) => (t.silent = true));
}

module.exports = logger;
