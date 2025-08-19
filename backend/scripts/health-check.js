const https = require("https");
const http = require("http");

const ENDPOINTS = {
  local: "http://localhost:3000",
  staging: "https://stormneighbor-backend-staging.up.railway.app",
  production: "https://stormneighbor-backend-production.up.railway.app",
};

async function healthCheck(environment = "local") {
  const baseUrl = ENDPOINTS[environment];

  if (!baseUrl) {
    console.error(`ERROR: Unknown environment: ${environment}`);
    console.log("INFO: Available environments:", Object.keys(ENDPOINTS).join(", "));
    process.exitCode = 1;
  }

  console.log(`WORKING: Health check for ${environment}: ${baseUrl}`);

  try {
    const response = await makeRequest(`${baseUrl}/health`);
    const data = JSON.parse(response);

    console.log(`Status: ${data.status}`);
    console.log(`Uptime: ${data.uptime}`);
    console.log(`Memory: ${data.memory.heapUsed} / ${data.memory.heapTotal}`);
    console.log(`Database: ${data.database.status}`);
    console.log(`Response time: ${data.database.responseTime}`);

    if (data.analytics) {
      console.log(`Total requests: ${data.analytics.totalRequests}`);
      console.log(`Error rate: ${data.analytics.errorRate}`);
    }

    console.log("\nWORKING: Testing endpoints");

    const endpoints = ["/health", "/api/weather/current?lat=30.2672&lng=-97.7431"];

    for (const endpoint of endpoints) {
      try {
        await makeRequest(`${baseUrl}${endpoint}`);
        console.log(`SUCCESS: ${endpoint}`);
      } catch (error) {
        console.log(`ERROR: ${endpoint}: ${error.message}`);
      }
    }

    console.log(`\n ${environment} environment is healthy`);
  } catch (error) {
    console.error(`ERROR: Health check failed for ${environment}:`, error.message);
    process.exitCode = 1;
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("ERROR: Request timeout"));
    });
  });
}

const environment = process.argv[2] || "local";
healthCheck(environment);
