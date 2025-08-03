#!/usr/bin/env node

const { execSync } = require("child_process");

const ENVIRONMENTS = {
  staging: "stormneighbor-backend-staging",
  production: "stormneighbor-backend-prod",
};

async function deployToRailway(environment = "staging") {
  console.log(`Deploying to ${environment}...`);

  try {
    if (!ENVIRONMENTS[environment]) {
      throw new Error(`Invalid environment: ${environment}. Use 'staging' or 'production'`);
    }

    try {
      execSync("railway --version", { stdio: "ignore" });
    } catch (error) {
      throw new Error("Railway CLI not installed. Install with: npm install -g @railway/cli");
    }

    console.log("Running pre-deployment checks...");

    execSync("npm run env:check", { stdio: "inherit" });

    if (environment === "production") {
      console.log("Running full test suite...");
      execSync("npm run ci:test", { stdio: "inherit" });
    }

    console.log("Checking code quality...");
    execSync("npm run lint:check", { stdio: "inherit" });

    console.log("Checking database migrations...");
    execSync("npm run db:migrate:check", { stdio: "inherit" });

    const serviceName = ENVIRONMENTS[environment];
    console.log(`Deploying to Railway service: ${serviceName}`);

    execSync(`railway up --service ${serviceName}`, { stdio: "inherit" });

    console.log(`SUCCESS: Deployment to ${environment} completed successfully!`);

    console.log("Running post-deployment health check...");
    setTimeout(() => {
      try {
        const serviceUrl =
          environment === "production"
            ? "https://stormneighbor-backend-production.up.railway.app"
            : "https://stormneighbor-backend-staging.up.railway.app";

        execSync(`curl -f ${serviceUrl}/health`, { stdio: "inherit" });
        console.log("SUCCESS: Health check passed!");
      } catch (error) {
        console.warn("WARN: Health check failed - service may still be starting up");
      }
    }, 30000);
  } catch (error) {
    console.error("ERROR: Deployment failed:", error.message);
    process.exitCode = 1;
  }
}

const environment = process.argv[2] || "staging";
deployToRailway(environment);
