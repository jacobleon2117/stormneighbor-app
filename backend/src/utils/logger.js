const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ℹ️  ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.log("   Data:", data);
    }
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${message}`);
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
    console.warn(`[${timestamp}] ⚠️  ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.warn("   Data:", data);
    }
  },

  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${message}`);
    if (data && process.env.NODE_ENV === "development") {
      console.log("   Data:", data);
    }
  },

  api: (method, path, statusCode, responseTime) => {
    const timestamp = new Date().toISOString();
    const status = statusCode >= 400 ? "❌" : statusCode >= 300 ? "⚠️" : "✅";
    console.log(
      `[${timestamp}] ${status} ${method} ${path} - ${statusCode} (${responseTime}ms)`
    );
  },
};

module.exports = logger;
