#!/usr/bin/env node
const EnvironmentValidator = require("../utils/envValidator");

function main() {
  console.log("Environment Validation Script\n");

  const validator = new EnvironmentValidator();
  const result = validator.validate();

  if (!result.isValid) {
    console.log(
      "ERROR: Environment validation failed. Please fix the errors above before starting the application."
    );

    if (process.argv.includes("--generate-template")) {
      console.log("\nWORKING: Generating .env template");
      const template = validator.generateEnvTemplate();
      const fs = require("fs");
      const path = require("path");

      const templatePath = path.join(process.cwd(), ".env.template");
      fs.writeFileSync(templatePath, template);
      console.log(`SUCCESS: Template saved to ${templatePath}`);
    }

    process.exitCode = 1;
  }

  if (result.warnings.length > 0) {
    console.log(
      "WARNING: Environment validation completed with warnings. Application will start but some features may be limited."
    );
  } else {
    console.log("SUCCESS: Environment validation passed");
  }

  if (process.argv.includes("--verbose")) {
    console.log("\nConfiguration Summary:");
    Object.entries(result.config).forEach(([key, value]) => {
      console.log(`  ${key}: ${validator.maskSensitive(key, value)}`);
    });
  }

  process.exitCode = 1;
}

if (process.argv.includes("--help")) {
  console.log(`
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
    console.log(`  ${variable.name}: ${variable.description}`);
  });

  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = main;
