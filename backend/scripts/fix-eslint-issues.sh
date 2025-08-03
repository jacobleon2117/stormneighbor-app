#!/bin/bash

echo "Comprehensive ESLint fixes for StormNeighbor Backend..."
echo "=================================================="

cd backend

echo "Creating backup of files before modifications..."
mkdir -p .backup/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backup/$(date +%Y%m%d_%H%M%S)"

cp -r src/ $BACKUP_DIR/
echo "Backup created in $BACKUP_DIR"

echo "Fixing src/config/cloudinary.js..."
sed -i 's/const result = await cloudinary.api.ping();/const _result = await cloudinary.api.ping();/' src/config/cloudinary.js
sed -i 's/public_id: (req, file) =>/public_id: (req, _file) =>/g' src/config/cloudinary.js
sed -i 's/\\\//\//g' src/config/cloudinary.js

echo "Fixing src/config/database.js..."
cat > temp_database.js << 'EOF'
// File: backend/src/config/database.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? {
      rejectUnauthorized: false,
      ca: null,
    }
  : false,
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully!");

    const result = await client.query("SELECT NOW()");
    console.log("Current database time:", result.rows[0].now);

    try {
      const postgisResult = await client.query("SELECT PostGIS_Version()");
      console.log("PostGIS version:", postgisResult.rows[0].postgis_version);
    } catch (postgisError) {
      console.log("PostGIS not enabled yet - we'll enable it next!");
    }

    client.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
};

const enablePostGIS = async () => {
  try {
    const client = await pool.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis_topology;");
    console.log("PostGIS extensions enabled!");
    client.release();
  } catch (error) {
    console.error("Failed to enable PostGIS:", error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  enablePostGIS,
};
EOF
mv temp_database.js src/config/database.js

echo "Fixing src/config/validateEnv.js..."
sed -i "s/'RESEND_API_KEY should start with \"re_\"/\"RESEND_API_KEY should start with \\\"re_\\\"/g" src/config/validateEnv.js
sed -i 's/process.exit(1);/throw new Error("Missing required environment variables");/' src/config/validateEnv.js

echo "Fixing src/controllers/authController.js..."
sed -i '/const crypto = require("crypto");/d' src/controllers/authController.js
sed -i "s/'SELECT id FROM users WHERE email = \$1'/\"SELECT id FROM users WHERE email = \$1\"/g" src/controllers/authController.js
sed -i "s/'If an account with that email exists, a reset code has been sent.'/\"If an account with that email exists, a reset code has been sent.\"/g" src/controllers/authController.js
sed -i "s/'User not found'/\"User not found\"/g" src/controllers/authController.js

echo "Fixing src/controllers/posts.js..."
sed -i "s/'Creating comment:'//\"Creating comment:\"/g" src/controllers/posts.js

echo "Fixing src/controllers/upload.js..."
sed -i "s/'No image file provided'/\"No image file provided\"/g" src/controllers/upload.js
sed -i "s/'Comment not found'/\"Comment not found\"/g" src/controllers/upload.js
sed -i "s/'Post not found'/\"Post not found\"/g" src/controllers/upload.js

echo "Fixing src/controllers/weatherController.js..."
sed -i 's/let searchRadius = radius || 25;/const searchRadius = radius || 25;/' src/controllers/weatherController.js
sed -i "s/'Failed to fetch NOAA alerts:'/\"Failed to fetch NOAA alerts:\"/g" src/controllers/weatherController.js

echo "Fixing src/middleware/cache.js..."
sed -i "s/'excellent':/\"excellent\":/g" src/middleware/cache.js
sed -i "s/'good':/\"good\":/g" src/middleware/cache.js
sed -i "s/'fair':/\"fair\":/g" src/middleware/cache.js
sed -i "s/'poor'/\"poor\"/g" src/middleware/cache.js

echo "Fixing src/middleware/database.js..."
sed -i 's/} catch (postgisError) {}/} catch (postgisError) {\n      \/\/ PostGIS not available - this is expected in some environments\n    }/' src/middleware/database.js
sed -i 's/(client) =>/(\_client) =>/g' src/middleware/database.js

echo "Fixing src/middleware/logging.js..."
sed -i 's/            responseData: sanitizeLogData(data),/          responseData: sanitizeLogData(data),/' src/middleware/logging.js
sed -i 's/          }),/        }),/' src/middleware/logging.js

echo "Fixing src/middleware/sanitize.js..."
sed -i 's/\\\"/"/g' src/middleware/sanitize.js

echo "Fixing src/routes/upload.js..."
sed -i 's/(error, req, res, next) =>/(error, req, res, _next) =>/' src/routes/upload.js

echo "Fixing src/services/emailService.js..."
sed -i 's/return await sendEmail(/return sendEmail(/g' src/services/emailService.js

echo "Running Prettier to fix formatting..."
npm run format

echo "Running ESLint auto-fix..."
npm run lint

echo "All fixes applied! Running final ESLint check..."
npm run lint:check

echo ""
echo "=================================================="
echo "ESLint fixes completed!"
echo "Checking results..."

REMAINING_ISSUES=$(npm run lint:check 2>&1 | grep -E "✖.*problems" | grep -o '[0-9]\+' | head -1)

if [ -z "$REMAINING_ISSUES" ] || [ "$REMAINING_ISSUES" -eq 0 ]; then
    echo "SUCCESS: All ESLint issues have been resolved!"
else
    echo "There are still $REMAINING_ISSUES issues remaining"
    echo "Running detailed analysis..."
    npm run lint:check
fi

echo ""
echo "Next steps:"
echo "1. Run tests: npm test"
echo "2. Run CI pipeline: git add . && git commit -m 'Fix ESLint issues' && git push"
echo "3. Continue with the next phase of your backend development!"

echo ""
echo "Backup of original files saved in: $BACKUP_DIR"