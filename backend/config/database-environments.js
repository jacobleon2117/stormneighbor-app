const { getConfig } = require("./environments");

function getDatabaseConfig() {
  const config = getConfig();
  const baseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: config.database.ssl
      ? {
        rejectUnauthorized: false,
        ca: null,
      }
      : false,
    max: config.database.poolSize,
    connectionTimeoutMillis: config.database.connectionTimeout,
    idleTimeoutMillis: 30000,
  };

  if (config.isProduction) {
    return {
      ...baseConfig,
      statement_timeout: 60000,
      query_timeout: 30000,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 60000,
      max: 20,
    };
  }

  if (config.isStaging) {
    return {
      ...baseConfig,
      statement_timeout: 30000,
      query_timeout: 15000,
    };
  }

  if (config.isTest) {
    return {
      ...baseConfig,
      max: 2,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    };
  }

  return baseConfig;
}

module.exports = {
  getDatabaseConfig,
};
