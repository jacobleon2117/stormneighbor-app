#!/usr/bin/env node
const EnvironmentValidator = require("../utils/envValidator");
const logger = require("../utils/logger");

function main() {
  logger.info("Environment Validation Script\n");

  const validator = new EnvironmentValidator();
  const result = validator.validate();

  if (!result.isValid) {
    logger.info(
      "ERROR: Environment validation failed. Please fix the errors above before starting the application."
    );

    if (process.argv.includes("--generate-template")) {
      logger.info("\nWORKING: Generating .env template");
      const template = validator.generateEnvTemplate();
      const fs = require("fs");
      const path = require("path");

      const templatePath = path.join(process.cwd(), ".env.template");
      fs.writeFileSync(templatePath, template);
      logger.info(`SUCCESS: Template saved to ${templatePath}`);
    }

    process.exitCode = 1;
  }

  if (result.warnings.length > 0) {
    logger.info(
      "WARNING: Environment validation completed with warnings. Application will start but some features may be limited."
    );
  } else {
    logger.info("SUCCESS: Environment validation passed");
  }

  if (process.argv.includes("--verbose")) {
    logger.info("\nConfiguration Summary:");
    Object.entries(result.config).forEach(([key, value]) => {
      logger.info(`  ${key}: ${validator.maskSensitive(key, value)}`);
    });
  }

  process.exitCode = 1;
}

if (process.argv.includes("--help")) {
  logger.info(`
  Environment Validation Script

  Usage: node src/scripts/validateEnv.js [options]

  Options:
    --help              Show this help message
    --generate-template Generate a .env template file
    --verbose          Show detailed configuration summary
    
  Environment Variables Required:
  `);

  const validator = new EnvironmentValidator();
  const required = validator.getRequiredVariables();

  required.forEach((variable) => {
    logger.info(`  ${variable.name}: ${variable.description}`);
  });

  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = main;
