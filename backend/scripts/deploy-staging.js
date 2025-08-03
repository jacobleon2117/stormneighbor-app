#!/usr/bin/env node

const { execSync } = require("child_process");

async function deployStaging() {
  console.log("Deploying to staging...");

  try {
    console.log("Running pre-deployment checks...");
    execSync("npm run env:check", { stdio: "inherit" });
    execSync("npm run lint:check", { stdio: "inherit" });

    console.log("Deploying to Railway staging...");
    execSync("railway up --service stormneighbor-backend-staging", { stdio: "inherit" });

    console.log("SUCCESS: Staging deployment completed!");
    console.log("Staging URL: https://stormneighbor-backend-staging.up.railway.app");
  } catch (error) {
    console.error("ERROR: Deployment failed:", error.message);
    process.exitCode = 1;
  }
}

deployStaging();
