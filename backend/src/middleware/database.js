// File: backend/src/middleware/database.js
const { pool } = require("../config/database");

const dbStats = {
  totalQueries: 0,
  slowQueries: 0,
  errors: 0,
  connectionErrors: 0,
  averageQueryTime: 0,
  queryTimes: [],
  activeConnections: 0,
  startTime: Date.now(),
};

const getMonitoredClient = async (req) => {
  const requestId = req?.requestId || "unknown";
  const startTime = Date.now();

  try {
    const client = await pool.connect();
    dbStats.activeConnections++;

    console.log(
      `[${new Date().toISOString()}] [${requestId}] DB Connection acquired - Active: ${dbStats.activeConnections}`
    );

    const originalQuery = client.query.bind(client);
    client.query = async (...args) => {
      const queryStart = Date.now();
      dbStats.totalQueries++;

      try {
        if (process.env.NODE_ENV === "development") {
          const queryText = args[0]?.substring(0, 100) + (args[0]?.length > 100 ? "..." : "");
          console.log(`[${new Date().toISOString()}] [${requestId}] DB Query: ${queryText}`);
        }

        const result = await originalQuery(...args);
        const queryDuration = Date.now() - queryStart;

        dbStats.queryTimes.push(queryDuration);
        if (dbStats.queryTimes.length > 100) {
          dbStats.queryTimes.shift();
        }

        dbStats.averageQueryTime =
          dbStats.queryTimes.reduce((a, b) => a + b, 0) / dbStats.queryTimes.length;

        if (queryDuration > 1000) {
          dbStats.slowQueries++;
          console.warn(
            `[${new Date().toISOString()}] [${requestId}] SLOW QUERY (${queryDuration}ms):`,
            {
              query: args[0]?.substring(0, 200),
              duration: `${queryDuration}ms`,
              rowCount: result.rowCount,
            }
          );
        }

        console.log(
          `[${new Date().toISOString()}] [${requestId}] DB Query completed - ${queryDuration}ms, ${result.rowCount} rows`
        );
        return result;
      } catch (queryError) {
        dbStats.errors++;
        console.error(`[${new Date().toISOString()}] [${requestId}] DB Query error:`, {
          message: queryError.message,
          query: args[0]?.substring(0, 200),
          duration: `${Date.now() - queryStart}ms`,
        });
        throw queryError;
      }
    };

    const originalRelease = client.release.bind(client);
    client.release = (err) => {
      dbStats.activeConnections--;
      const connectionDuration = Date.now() - startTime;

      console.log(
        `[${new Date().toISOString()}] [${requestId}] DB Connection released - Duration: ${connectionDuration}ms, Active: ${dbStats.activeConnections}`
      );

      if (err) {
        console.error(
          `[${new Date().toISOString()}] [${requestId}] DB Connection released with error:`,
          err.message
        );
      }

      return originalRelease(err);
    };

    return client;
  } catch (connectionError) {
    dbStats.connectionErrors++;
    console.error(
      `[${new Date().toISOString()}] [${requestId}] DB Connection error:`,
      connectionError.message
    );
    throw connectionError;
  }
};

const checkDatabaseHealth = async () => {
  try {
    const client = await pool.connect();
    const startTime = Date.now();

    try {
      await client.query("SELECT NOW() as current_time");

      let postgisVersion = null;
      try {
        const postgisResult = await client.query("SELECT PostGIS_Version() as version");
        postgisVersion = postgisResult.rows[0].version;
      } catch (postgisError) {
      }

      const statsResult = await client.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections
      `);

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
        postgis: postgisVersion ? `v${postgisVersion}` : "not available",
        connections: {
          active: parseInt(statsResult.rows[0].active_connections),
          total: parseInt(statsResult.rows[0].total_connections),
          max: parseInt(statsResult.rows[0].max_connections),
        },
        pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      connections: {
        active: 0,
        total: 0,
        max: 0,
      },
    };
  }
};

const getDatabaseStats = () => {
  const uptime = Date.now() - dbStats.startTime;

  return {
    ...dbStats,
    uptime: `${Math.floor(uptime / 1000 / 60)} minutes`,
    queriesPerMinute:
      dbStats.totalQueries > 0 ? (dbStats.totalQueries / (uptime / 1000 / 60)).toFixed(2) : "0",
    errorRate:
      dbStats.totalQueries > 0
        ? ((dbStats.errors / dbStats.totalQueries) * 100).toFixed(2) + "%"
        : "0%",
    slowQueryRate:
      dbStats.totalQueries > 0
        ? ((dbStats.slowQueries / dbStats.totalQueries) * 100).toFixed(2) + "%"
        : "0%",
    averageQueryTime: `${dbStats.averageQueryTime.toFixed(2)}ms`,
    pool: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
  };
};

const databaseMiddleware = (req, res, next) => {
  req.getDbClient = () => getMonitoredClient(req);
  next();
};

pool.on("connect", (_client) => {
  console.log(`[${new Date().toISOString()}] DB Pool: New client connected`);
});

pool.on("acquire", (_client) => {
  console.log(`[${new Date().toISOString()}] DB Pool: Client acquired from pool`);
});

pool.on("release", (err, _client) => {
  if (err) {
    console.error(
      `[${new Date().toISOString()}] DB Pool: Client released with error:`,
      err.message
    );
  } else {
    console.log(`[${new Date().toISOString()}] DB Pool: Client released back to pool`);
  }
});

pool.on("remove", (_client) => {
  console.log(`[${new Date().toISOString()}] DB Pool: Client removed from pool`);
});

pool.on("error", (err, _client) => {
  console.error(`[${new Date().toISOString()}] DB Pool: Unexpected error:`, err.message);
  dbStats.connectionErrors++;
});

module.exports = {
  getMonitoredClient,
  checkDatabaseHealth,
  getDatabaseStats,
  databaseMiddleware,
};
