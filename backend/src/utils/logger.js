const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO  ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.log("   Data:", data);
    }
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR ${message}`);
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("   Error:", error);
      } else {
        console.error("   Error:", error.message);
      }
    }
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN  ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.warn("   Data:", data);
    }
  },

  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SUCCESS ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.log("   Data:", data);
    }
  },

  api: (method, path, statusCode, responseTime) => {
    const timestamp = new Date().toISOString();
    const status = statusCode >= 400 ? "ERROR" : statusCode >= 300 ? "WARN" : "SUCCESS";
    console.log(`[${timestamp}] ${status} ${method} ${path} - ${statusCode} (${responseTime}ms)`);
  },
};

module.exports = logger;
