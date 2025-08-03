#!/usr/bin/env node

const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironments() {
  console.log("StormNeighbor Environment Setup\n");

  try {
    try {
      execSync("railway --version", { stdio: "ignore" });
      console.log("SUCCESS: Railway CLI found");
    } catch (error) {
      console.log("ERROR: Railway CLI not found");
      console.log("Install with: npm install -g @railway/cli");
      console.log("Then login with: railway login");
      return;
    }

    console.log("\nEnvironment Configuration");

    const supabaseUrl = await question("Enter your Supabase project URL: ");
    const supabaseKey = await question("Enter your Supabase service key: ");
    const resendKey = await question("Enter your Resend API key: ");
    const cloudinaryName = await question("Enter your Cloudinary cloud name: ");
    const cloudinaryApiKey = await question("Enter your Cloudinary API key: ");
    const cloudinarySecret = await question("Enter your Cloudinary API secret: ");
    const jwtSecret = await question("Enter a JWT secret (32+ characters): ");

    if (jwtSecret.length < 32) {
      console.log("ERROR: JWT secret must be at least 32 characters");
      return;
    }

    const environments = {
      staging: {
        NODE_ENV: "staging",
        DATABASE_URL: `${supabaseUrl}?sslmode=require`,
        DATABASE_KEY: supabaseKey,
        DATABASE_SSL: "true",
        DATABASE_SSL_REJECT_UNAUTHORIZED: "false",
        JWT_SECRET: jwtSecret,
        RESEND_API_KEY: resendKey,
        FROM_EMAIL: "staging@stormneighbor.com",
        FROM_NAME: "StormNeighbor Staging",
        CLOUDINARY_CLOUD_NAME: cloudinaryName,
        CLOUDINARY_API_KEY: cloudinaryApiKey,
        CLOUDINARY_API_SECRET: cloudinarySecret,
        NOAA_API_BASE_URL: "https://api.weather.gov",
        CLIENT_URL: "https://stormneighbor-staging.vercel.app",
      },
      production: {
        NODE_ENV: "production",
        DATABASE_URL: `${supabaseUrl}?sslmode=require`,
        DATABASE_KEY: supabaseKey,
        DATABASE_SSL: "true",
        DATABASE_SSL_REJECT_UNAUTHORIZED: "false",
        JWT_SECRET: jwtSecret,
        RESEND_API_KEY: resendKey,
        FROM_EMAIL: "noreply@stormneighbor.com",
        FROM_NAME: "StormNeighbor",
        CLOUDINARY_CLOUD_NAME: cloudinaryName,
        CLOUDINARY_API_KEY: cloudinaryApiKey,
        CLOUDINARY_API_SECRET: cloudinarySecret,
        NOAA_API_BASE_URL: "https://api.weather.gov",
        CLIENT_URL: "https://stormneighbor.com",
      },
    };

    console.log("\nSetting up staging environment...");
    for (const [key, value] of Object.entries(environments.staging)) {
      execSync(`railway variables set ${key}="${value}" --service stormneighbor-backend-staging`, {
        stdio: "inherit",
      });
    }

    const setupProd = await question("\nSet up production environment? (y/N): ");
    if (setupProd.toLowerCase() === "y") {
      console.log("Setting up production environment...");
      for (const [key, value] of Object.entries(environments.production)) {
        execSync(`railway variables set ${key}="${value}" --service stormneighbor-backend-prod`, {
          stdio: "inherit",
        });
      }
    }

    console.log("\nSUCCESS: Environment setup completed!");
    console.log("\nNext steps:");
    console.log("1. Deploy to staging: npm run deploy:staging");
    console.log("2. Test staging environment");
    console.log("3. Deploy to production: npm run deploy:production");
  } catch (error) {
    console.error("ERROR: Setup failed:", error.message);
  } finally {
    rl.close();
  }
}

setupEnvironments();
