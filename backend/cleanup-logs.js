#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("Cleaning up log files");

const logsDir = "./logs";
if (fs.existsSync(logsDir)) {
  console.log(`Found logs directory: ${logsDir}`);

  const files = fs.readdirSync(logsDir);
  let totalSizeFreed = 0;
  let filesDeleted = 0;

  files.forEach((file) => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    console.log(`File ${file}: ${sizeMB.toFixed(2)}MB`);

    fs.unlinkSync(filePath);
    totalSizeFreed += sizeMB;
    filesDeleted++;
    console.log(`Deleted: ${file}`);
  });

  console.log(`Cleaned up ${filesDeleted} files, freed ${totalSizeFreed.toFixed(2)}MB`);

  if (fs.readdirSync(logsDir).length === 0) {
    fs.rmdirSync(logsDir);
    console.log("Removed empty logs directory");
  }
} else {
  console.log("No logs directory found - nothing to clean");
}

console.log("\nSearching for other log files");
const findLogFiles = (dir, depth = 0) => {
  if (depth > 3) return;

  try {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      if (item === "node_modules") return;

      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        findLogFiles(itemPath, depth + 1);
      } else if (item.endsWith(".log") && !itemPath.includes("node_modules")) {
        const sizeMB = stats.size / (1024 * 1024);
        console.log(`Found: ${itemPath} (${sizeMB.toFixed(2)}MB)`);

        if (sizeMB > 1) {
          fs.unlinkSync(itemPath);
          console.log(`Deleted large log: ${itemPath}`);
        }
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
};

findLogFiles("./");

console.log("\nLog cleanup complete");
console.log("\nTips to prevent future log bloat:");
console.log(' LOG_LEVEL is now set to "warn" (only warnings and errors)');
console.log(" Log files are limited to 5MB each");
console.log(" Logs are kept for only 1 day");
console.log(" Run this script periodically if needed");
