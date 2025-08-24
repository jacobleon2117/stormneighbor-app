#!/usr/bin/env node
require("dotenv").config();
const https = require("https");
const http = require("http");
const sslConfig = require("../src/config/sslConfig");

class SSLTester {
  constructor() {
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";
    this.httpsUrl = process.env.HTTPS_URL || this.baseUrl.replace("http:", "https:");
  }

  async testSSLConfig() {
    console.log("WORKING: Testing SSL/TLS Configuration\n");

    try {
      console.log("WORKING: Validating SSL configuration");
      const validation = sslConfig.validateConfig();

      if (validation.valid) {
        console.log("SUCCESS: SSL configuration is valid");
      } else {
        console.log("WARNING: SSL configuration issues found:");
        validation.issues.forEach((issue) => console.log(`   • ${issue}`));
      }

      console.log("\nWORKING: SSL Configuration Summary:");
      const summary = sslConfig.getConfigSummary();
      Object.entries(summary).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      console.log("\nWORKING: Testing Security Endpoints");

      try {
        const auditResponse = await this.makeRequest(`${this.baseUrl}/security-audit`);
        console.log("SUCCESS: Security audit endpoint accessible");

        if (auditResponse.data) {
          console.log(` HTTPS Enforced: ${auditResponse.data.ssl.enforced}`);
          console.log(` Connection Secure: ${auditResponse.data.ssl.secure}`);
          console.log(` Protocol: ${auditResponse.data.ssl.protocol}`);
        }
      } catch (error) {
        console.log("ERROR: Security audit endpoint failed:", error.message);
      }

      try {
        await this.makeRequest(`${this.baseUrl}/health`);
        console.log("SUCCESS: Health endpoint accessible");
      } catch (error) {
        console.log("ERROR: Health endpoint failed:", error.message);
      }

      console.log("\nWORKING: SSL Security Recommendations:");
      this.showRecommendations(summary);
    } catch (error) {
      console.error("ERROR: SSL test failed:", error.message);
    }
  }

  async testHTTPSRedirect() {
    console.log("\nWORKING: Testing HTTPS Redirect");

    if (!sslConfig.getSSLConfig().forceHTTPS) {
      console.log("WARNING: HTTPS enforcement is disabled");
      return;
    }

    try {
      const httpUrl = this.baseUrl.replace("https:", "http:");
      const response = await this.makeRequest(httpUrl, { followRedirects: false });

      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        if (location && location.startsWith("https:")) {
          console.log("SUCCESS: HTTP to HTTPS redirect working");
          console.log(` Redirects to: ${location}`);
        } else {
          console.log("ERROR: Redirect exists but not to HTTPS");
        }
      } else {
        console.log("ERROR: No HTTP to HTTPS redirect found");
      }
    } catch (error) {
      console.log("ERROR: HTTPS redirect test failed:", error.message);
    }
  }

  async testSecurityHeaders() {
    console.log("\nWORKING: Testing Security Headers");

    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`);
      const headers = response.headers;

      const securityHeaders = {
        "strict-transport-security": "HSTS",
        "x-content-type-options": "X-Content-Type-Options",
        "x-frame-options": "X-Frame-Options",
        "x-xss-protection": "X-XSS-Protection",
        "referrer-policy": "Referrer-Policy",
        "content-security-policy": "Content Security Policy",
      };

      console.log("Security Headers Status:");
      Object.entries(securityHeaders).forEach(([header, description]) => {
        if (headers[header]) {
          console.log(`SUCCESS: ${description}: ${headers[header]}`);
        } else {
          console.log(`ERROR: ${description}: Not set`);
        }
      });

      const dangerousHeaders = ["x-powered-by", "server"];
      console.log("\nDangerous Headers Check:");
      dangerousHeaders.forEach((header) => {
        if (headers[header]) {
          console.log(`ERROR: ${header}: ${headers[header]} (should be removed)`);
        } else {
          console.log(`SUCCESS: ${header}: Properly removed`);
        }
      });
    } catch (error) {
      console.log("ERROR: Security headers test failed:", error.message);
    }
  }

  async testCertificateInfo() {
    console.log("\nWORKING: Testing Certificate Information");

    if (!this.httpsUrl.startsWith("https:")) {
      console.log("WARNING: HTTPS URL not configured, skipping certificate test");
      return;
    }

    try {
      const url = new URL(this.httpsUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: "/health",
        method: "GET",
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();

        if (cert && Object.keys(cert).length > 0) {
          console.log("SUCCESS: Certificate information:");
          console.log(` Subject: ${cert.subject.CN}`);
          console.log(` Issuer: ${cert.issuer.CN}`);
          console.log(` Valid From: ${cert.valid_from}`);
          console.log(` Valid To: ${cert.valid_to}`);
          console.log(` Serial Number: ${cert.serialNumber}`);

          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 30) {
            console.log(`ERROR: Certificate expires in ${daysUntilExpiry} days`);
          } else {
            console.log(`ERROR: Certificate valid for ${daysUntilExpiry} more days`);
          }
        } else {
          console.log("ERROR: No certificate information available");
        }

        req.destroy();
      });

      req.on("error", (error) => {
        console.log("ERROR: Certificate test failed:", error.message);
      });

      req.end();
    } catch (error) {
      console.log("ERROR: Certificate test failed:", error.message);
    }
  }

  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith("https:");
      const client = isHttps ? https : http;
      const followRedirects = options.followRedirects !== false;

      const req = client.get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : null,
            };

            if (
              followRedirects &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              return this.makeRequest(res.headers.location, options).then(resolve).catch(reject);
            }

            resolve(response);
          } catch (parseError) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data,
            });
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });
  }

  showRecommendations(summary) {
    const recommendations = [];

    if (!summary.httpsEnforced && summary.environment === "production") {
      recommendations.push("Enable HTTPS enforcement for production");
    }

    if (!summary.hstsEnabled) {
      recommendations.push("Enable HSTS (HTTP Strict Transport Security)");
    }

    if (summary.hstsMaxAge < 31536000 && summary.environment === "production") {
      recommendations.push("Increase HSTS max-age to at least 1 year for production");
    }

    if (summary.securityLevel === "Development" && summary.environment !== "development") {
      recommendations.push("Update security level for non-development environment");
    }

    if (recommendations.length === 0) {
      console.log("SUCCESS: No security recommendations, configuration looks good");
    } else {
      recommendations.forEach((rec) => console.log(`   • ${rec}`));
    }
  }

  async runAllTests() {
    console.log("WORKING: Running Complete SSL/TLS Security Test Suite\n");

    await this.testSSLConfig();
    await this.testHTTPSRedirect();
    await this.testSecurityHeaders();
    await this.testCertificateInfo();

    console.log("\nSUCCESS: SSL/TLS testing completed");
    console.log("\nINFO: Next steps:");
    console.log(" Review any security warnings above");
    console.log(" Test with your actual domain in production");
    console.log(" Use SSL Labs (ssllabs.com) for comprehensive testing");
    console.log(" Monitor certificate expiration dates");
  }
}

async function main() {
  const command = process.argv[2];
  const tester = new SSLTester();

  try {
    switch (command) {
    case "config":
      await tester.testSSLConfig();
      break;
    case "redirect":
      await tester.testHTTPSRedirect();
      break;
    case "headers":
      await tester.testSecurityHeaders();
      break;
    case "cert":
      await tester.testCertificateInfo();
      break;
    case "all":
    default:
      await tester.runAllTests();
      break;
    }
  } catch (error) {
    console.error("ERROR: Test failed:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { SSLTester };
