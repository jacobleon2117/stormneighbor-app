# Could not perform log cleanup: ENOENT: no such file or directory, stat 'logs/combined-current.log'

2025-09-08 06:23:53 [info]: Starting StormNeighbor API Server
2025-09-08 06:23:53 [info]: Node.js Version: v20.11.1
2025-09-08 06:23:53 [info]: Environment: development
2025-09-08 06:23:53 [info]: Validating environment variables
2025-09-08 06:23:53 [info]: WORKING: Validating environment variables
2025-09-08 06:23:53 [info]: WORKING: Environment validated (22 variables configured);
2025-09-08 06:23:53 [info]: Environment: development
2025-09-08 06:23:53 [info]: Development mode settings:
2025-09-08 06:23:53 [info]: INFO: Client URL: <http://192.168.1.89:19006>
2025-09-08 06:23:53 [info]: INFO: Database SSL: true
2025-09-08 06:23:53 [info]:
Configured services:
2025-09-08 06:23:53 [info]: INFO: Database: SUCCESS
2025-09-08 06:23:53 [info]: INFO: Email (Resend);: SUCCESS
2025-09-08 06:23:53 [info]: INFO: Weather (NOAA);: SUCCESS
2025-09-08 06:23:53 [info]: Images (Cloudinary): SUCCESS
2025-09-08 06:23:53 [info]: JWT Security: SUCCESS
2025-09-08 06:23:53 [info]: Environment variables configured properly
2025-09-08 06:23:53 [info]: Validating application dependencies
2025-09-08 06:23:53 [info]: WORKING: Validating environment configuration

2025-09-08 06:23:53 [info]: SUCCESS: .env file found
2025-09-08 06:23:53 [info]: SUCCESS: DATABASE_URL: post\***\*gres
2025-09-08 06:23:53 [info]: SUCCESS: JWT_SECRET: 7858\*\***faf2
2025-09-08 06:23:53 [info]: SUCCESS: PORT: 3000
2025-09-08 06:23:53 [info]: SUCCESS: NODE_ENV: development
2025-09-08 06:23:53 [info]: SUCCESS: FIREBASE_PROJECT_ID: stormneighbor-app
2025-09-08 06:23:53 [info]: SUCCESS: FIREBASE_PRIVATE_KEY: ----\***\*----
2025-09-08 06:23:53 [info]: SUCCESS: FIREBASE_CLIENT_EMAIL: <firebase-adminsdk-fbsvc@stormneighbor-app.iam.gserviceaccount.com>
2025-09-08 06:23:53 [info]: SUCCESS: NOAA_API_BASE_URL: <https://api.weather.gov>
2025-09-08 06:23:53 [info]: SUCCESS: CLOUDINARY_CLOUD_NAME: dixhgba3x
2025-09-08 06:23:53 [info]: SUCCESS: CLOUDINARY_API_KEY: 762177726556555
2025-09-08 06:23:53 [info]: SUCCESS: CLOUDINARY_API_SECRET: SovY\*\***S1Rs
2025-09-08 06:23:53 [info]: SUCCESS: CORS_ORIGIN: \*
2025-09-08 06:23:53 [info]: SUCCESS: RATE_LIMIT_WINDOW_MS: 900000
2025-09-08 06:23:53 [info]: SUCCESS: RATE_LIMIT_MAX_REQUESTS: 100
2025-09-08 06:23:53 [info]:
WORKING: Environment Validation Results:
2025-09-08 06:23:53 [info]: SUCCESS: Environment configuration is valid!

2025-09-08 06:23:53 [info]: WARNING: 1 warning(s):

2025-09-08 06:23:53 [info]: WARNING: Using default value for CORS_ORIGIN: \*
2025-09-08 06:23:53 [info]:
2025-09-08 06:23:53 [info]: INFO: Environment: development
2025-09-08 06:23:53 [info]: INFO: Port: 3000
2025-09-08 06:23:53 [info]: INFO: Database: Configured
2025-09-08 06:23:53 [info]: INFO: JWT: Configured
2025-09-08 06:23:53 [info]: INFO: Push Notifications: Enabled
2025-09-08 06:23:53 [info]: INFO: Image Uploads: Enabled
2025-09-08 06:23:53 [info]:
2025-09-08 06:23:53 [info]: WORKING: Initializing SSL/TLS Security
2025-09-08 06:23:53 [info]: SUCCESS: SSL/TLS Security initialized for development environment
2025-09-08 06:23:53 [info]: HTTPS Enforcement: ENABLED
2025-09-08 06:23:53 [info]: HSTS: max-age=300
2025-09-08 06:23:53 [info]: Trusted Proxies: 127.0.0.1
2025-09-08 06:23:53 [info]: Loading authentication routes...
2025-09-08 06:23:53 [info]: Loading user routes...
2025-09-08 06:23:53 [info]: Loading post routes...
2025-09-08 06:23:53 [info]: Loading comment routes...
2025-09-08 06:23:53 [info]: Loading upload routes...
2025-09-08 06:23:53 [info]: Loading weather routes...
2025-09-08 06:23:53 [info]: Loading neighborhood routes...
2025-09-08 06:23:53 [info]: Loading alert routes...
2025-09-08 06:23:53 [info]: Loading search routes...
2025-09-08 06:23:53 [info]: Loading notification routes...
2025-09-08 06:23:54 [info]: Firebase Admin SDK initialized successfully
2025-09-08 06:23:54 [info]: Loading message routes...
2025-09-08 06:23:54 [info]: Loading feedback routes...
2025-09-08 06:23:54 [info]: Loading backup routes...
2025-09-08 06:23:54 [info]: Loading admin routes...
2025-09-08 06:23:54 [info]: All routes loaded successfully
2025-09-08 06:23:54 [info]: Express application initialized
2025-09-08 06:23:54 [info]: Validating background services
2025-09-08 06:23:54 [info]: TESTING: Server Port Configuration
2025-09-08 06:23:54 [info]: STATUS: Port 3000 - 0.0.0.0
2025-09-08 06:23:54 [info]:
SERVER STARTED SUCCESSFULLY
2025-09-08 06:23:54 [info]: ══════════════════════════════════════════════════
2025-09-08 06:23:54 [info]: STATUS: RUNNING - Server listening on 0.0.0.0:3000
2025-09-08 06:23:54 [info]: SUCCESS: Local Access → <http://localhost:3000>
2025-09-08 06:23:54 [info]: SUCCESS: Network Access → <http://192.168.1.89:3000>
2025-09-08 06:23:54 [info]: INFORMATION: Base URL → <http://localhost:3000>
2025-09-08 06:23:54 [info]: INFORMATION: Environment → development
2025-09-08 06:23:54 [info]: SUCCESS: Health Check → <http://localhost:3000/health>
2025-09-08 06:23:54 [info]: SUCCESS: Analytics → <http://localhost:3000/analytics>
2025-09-08 06:23:54 [info]: SUCCESS: Cache Stats → <http://localhost:3000/cache/stats>
2025-09-08 06:23:54 [info]:
SECURITY SYSTEMS
2025-09-08 06:23:54 [info]: SUCCESS: Enhanced HTTP Headers Active
2025-09-08 06:23:54 [info]: SUCCESS: Input Sanitization Active
2025-09-08 06:23:54 [info]: SUCCESS: Rate Limiting Active
2025-09-08 06:23:54 [info]: SUCCESS: SQL Injection Detection Active
2025-09-08 06:23:54 [info]:
MONITORING SYSTEMS
2025-09-08 06:23:54 [info]: SUCCESS: Request Tracking Active
2025-09-08 06:23:54 [info]: SUCCESS: Performance Monitoring Active
2025-09-08 06:23:54 [info]: SUCCESS: Error Logging Active
2025-09-08 06:23:54 [info]:
DATABASE & CACHING
2025-09-08 06:23:54 [info]: SUCCESS: Intelligent Response Caching Active
2025-09-08 06:23:54 [info]: SUCCESS: Database Middleware Active
2025-09-08 06:23:54 [info]:
AUTHENTICATION
2025-09-08 06:23:54 [info]: SUCCESS: JWT Token System Active
2025-09-08 06:23:54 [info]: SUCCESS: Session Management Active
2025-09-08 06:23:54 [info]:
BACKGROUND SERVICES
2025-09-08 06:23:54 [info]: VALIDATING: Session Cleanup Service
2025-09-08 06:23:54 [info]: Starting session cleanup job
2025-09-08 06:23:54 [info]: Session cleanup job scheduled for 2:00 AM UTC daily
2025-09-08 06:23:54 [info]: SUCCESS: Session Cleanup Job Active
2025-09-08 06:23:54 [info]: INFORMATION: Next Cleanup → Daily at 2:00 AM UTC
2025-09-08 06:23:54 [info]: SUCCESS: Background Jobs Initialized
2025-09-08 06:23:54 [info]:
PUSH NOTIFICATIONS
2025-09-08 06:23:54 [info]: VALIDATING: Firebase Push Service
2025-09-08 06:23:54 [info]: SUCCESS: Push Notification Service Active
2025-09-08 06:23:54 [info]: INFORMATION: Firebase Project → stormneighbor-app
2025-09-08 06:23:54 [info]:
READY TO SERVE
2025-09-08 06:23:54 [info]: ══════════════════════════════════════════════════
2025-09-08 06:23:54 [info]: SUCCESS: StormNeighbor API Server is fully operational!
2025-09-08 06:23:54 [info]:
API ENDPOINTS
2025-09-08 06:23:54 [info]: ▶ Authentication:
2025-09-08 06:23:54 [info]: POST /api/v1/auth/register
2025-09-08 06:23:54 [info]: POST /api/v1/auth/login
2025-09-08 06:23:54 [info]: POST /api/v1/auth/logout
2025-09-08 06:23:54 [info]: POST /api/v1/auth/refresh-token
2025-09-08 06:23:54 [info]: ▶ Community & Posts:
2025-09-08 06:23:54 [info]: GET /api/v1/posts
2025-09-08 06:23:54 [info]: POST /api/v1/posts
2025-09-08 06:23:54 [info]: GET /api/v1/neighborhoods
2025-09-08 06:23:54 [info]: ▶ Weather & Alerts:
2025-09-08 06:23:54 [info]: GET /api/v1/weather
2025-09-08 06:23:54 [info]: GET /api/v1/alerts
2025-09-08 06:23:54 [info]: ▶ Notifications:
2025-09-08 06:23:54 [info]: POST /api/v1/notifications/register
2025-09-08 06:23:54 [info]: GET /api/v1/notifications/devices
2025-09-08 06:23:54 [info]:
SYSTEM INFORMATION
2025-09-08 06:23:54 [info]: INFORMATION: Session cleanup runs daily at 2:00 AM UTC
2025-09-08 06:23:54 [info]: INFORMATION: Max 5 active sessions per user
2025-09-08 06:23:54 [info]: INFORMATION: System status available at /health
2025-09-08 06:23:54 [info]: INFORMATION: Admin access requires special role assignment
2025-09-08 06:23:54 [info]:
DEVELOPMENT TOOLS
2025-09-08 06:23:54 [info]: ▶ Testing & Debugging:
2025-09-08 06:23:54 [info]: POST /api/v1/auth/send-test-email - Send test email
2025-09-08 06:23:54 [info]: GET /analytics - API usage statistics
2025-09-08 06:23:54 [info]: GET /cache/stats - Cache performance
2025-09-08 06:23:54 [info]: GET /api/v1/auth/test-email - Test email service
2025-09-08 06:23:54 [info]: DELETE /cache - Clear cache
2025-09-08 06:23:54 [info]: GET /api/v1/notifications/status - Push notification status
2025-09-08 06:23:54 [info]: npm run push:test - Test push notifications
2025-09-08 06:23:54 [info]:
NEXT STEPS
2025-09-08 06:23:54 [info]: 1. Test frontend connection
2025-09-08 06:23:54 [info]: 2. Verify database connectivity
2025-09-08 06:23:54 [info]: 3. Check API endpoints at /health
2025-09-08 06:23:54 [info]: 4. Review logs for any warnings
2025-09-08 06:23:54 [info]:
══════════════════════════════════════════════════
2025-09-08 06:23:54 [info]: BOOTSTRAP COMPLETE - Server ready for connections
2025-09-08 06:23:54 [info]: ══════════════════════════════════════════════════
2025-09-08 06:23:54 [info]: Backup directory initialized: ./backups
2025-09-08 06:23:59 [info]: Starting session cleanup...
2025-09-08 06:23:59 [info]: SUCCESS: New database client connected
2025-09-08 06:23:59 [info]: [2025-09-08T11:23:59.468Z] DB Pool: New client connected
2025-09-08 06:23:59 [info]: [2025-09-08T11:23:59.468Z] DB Pool: Client acquired from pool
2025-09-08 06:23:59 [warn]: SECURITY_EVENT
2025-09-08 06:23:59 [info]: [2025-09-08T11:23:59.591Z] DB Pool: Client released back to pool
2025-09-08 06:23:59 [info]: SUCCESS: Session cleanup completed in 472ms
2025-09-08 06:24:09 [info]: [2025-09-08T11:24:09.366Z] DB Pool: Client acquired from pool
2025-09-08 06:24:09 [info]: SUCCESS: New database client connected
2025-09-08 06:24:09 [info]: [2025-09-08T11:24:09.990Z] DB Pool: New client connected
2025-09-08 06:24:09 [info]: [2025-09-08T11:24:09.991Z] DB Pool: Client acquired from pool
2025-09-08 06:24:10 [warn]: SECURITY_EVENT
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.159Z] DB Pool: Client released back to pool
2025-09-08 06:24:10 [info]: [AUDIT] POST /login - Status: 200 - Time: 801ms - IP: 192.168.1.219 - User: anonymous
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.165Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:10 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 524 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.383Z] DB Pool: Client acquired from pool
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.420Z] DB Pool: Client released back to pool
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.420Z] DB Pool: Client acquired from pool
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.458Z] [fe05b79b4ee498b3] DB Query completed - 37ms, 1 rows
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.518Z] [fe05b79b4ee498b3] DB Query completed - 60ms, 0 rows
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.519Z] [fe05b79b4ee498b3] DB Connection released - Duration: 99ms, Active: 0
2025-09-08 06:24:10 [info]: [2025-09-08T11:24:10.519Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:10 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 200 211 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:33 [info]: [2025-09-08T11:24:33.949Z] DB Pool: Client acquired from pool
2025-09-08 06:24:33 [info]: [2025-09-08T11:24:33.988Z] [fe05b79b4ee498b3] DB Query completed - 39ms, 1 rows
2025-09-08 06:24:33 [info]: [2025-09-08T11:24:33.989Z] DB Pool: Client released back to pool
2025-09-08 06:24:33 [info]: [2025-09-08T11:24:33.990Z] DB Pool: Client acquired from pool
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.100Z] [fe05b79b4ee498b3] DB Query completed - 109ms, 1 rows
2025-09-08 06:24:34 [info]: [AUDIT] PUT /profile - Status: 200 - Time: 154ms - IP: 192.168.1.219 - User: 28
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.102Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:34 +0000] "PUT /api/v1/auth/profile HTTP/1.1" 200 57 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.135Z] DB Pool: Client acquired from pool
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.174Z] [fe05b79b4ee498b3] DB Query completed - 39ms, 1 rows
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.175Z] DB Pool: Client released back to pool
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.176Z] DB Pool: Client acquired from pool
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.216Z] [fe05b79b4ee498b3] DB Query completed - 40ms, 1 rows
2025-09-08 06:24:34 [info]: [2025-09-08T11:24:34.218Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:34 +0000] "GET /api/v1/auth/profile HTTP/1.1" 200 906 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.898Z] DB Pool: Client acquired from pool
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.935Z] [fe05b79b4ee498b3] DB Query completed - 37ms, 1 rows
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.936Z] DB Pool: Client released back to pool
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.936Z] DB Pool: Client acquired from pool
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.975Z] [fe05b79b4ee498b3] DB Query completed - 39ms, 1 rows
2025-09-08 06:24:37 [info]: [AUDIT] PUT /notification-preferences - Status: 200 - Time: 79ms - IP: 192.168.1.219 - User: 28
2025-09-08 06:24:37 [info]: [2025-09-08T11:24:37.976Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:37 +0000] "PUT /api/v1/auth/notification-preferences HTTP/1.1" 200 74 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.026Z] DB Pool: Client acquired from pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.066Z] [fe05b79b4ee498b3] DB Query completed - 39ms, 1 rows
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.066Z] DB Pool: Client released back to pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.067Z] DB Pool: Client acquired from pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.106Z] [fe05b79b4ee498b3] DB Query completed - 39ms, 1 rows
2025-09-08 06:24:39 [info]: [AUDIT] PUT /notification-preferences - Status: 200 - Time: 83ms - IP: 192.168.1.219 - User: 28
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.107Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:39 +0000] "PUT /api/v1/auth/notification-preferences HTTP/1.1" 200 74 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.211Z] DB Pool: Client acquired from pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.248Z] [fe05b79b4ee498b3] DB Query completed - 36ms, 1 rows
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.249Z] DB Pool: Client released back to pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.249Z] DB Pool: Client acquired from pool
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.289Z] [fe05b79b4ee498b3] DB Query completed - 40ms, 0 rows
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.289Z] [d1789e7e85e792c7] DB Query completed - 40ms, 0 rows
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.290Z] [d1789e7e85e792c7] DB Connection released - Duration: 41ms, Active: 0
2025-09-08 06:24:39 [info]: [2025-09-08T11:24:39.290Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:39 +0000] "GET /api/v1/posts?page=1&limit=20&city=Owasso&state=Ok HTTP/1.1" 200 205 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.168Z] DB Pool: Client removed from pool
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.457Z] [769c2bb49cf27932] Cache MISS: GET /current
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.474Z] DB Pool: Client acquired from pool
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.518Z] [fe05b79b4ee498b3] DB Query completed - 44ms, 0 rows
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.518Z] [d1789e7e85e792c7] DB Query completed - 44ms, 0 rows
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.519Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:40 +0000] "GET /api/v1/alerts?city=Owasso&state=Ok HTTP/1.1" 200 225 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:40 [info]: SUCCESS: New database client connected
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.796Z] DB Pool: New client connected
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.796Z] DB Pool: Client acquired from pool
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.834Z] DB Pool: Client released back to pool
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.835Z] DB Pool: Client acquired from pool
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.871Z] [c7bfa23e564c80f5] DB Query completed - 36ms, 1 rows
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.915Z] [c7bfa23e564c80f5] DB Query completed - 43ms, 0 rows
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.917Z] [c7bfa23e564c80f5] DB Connection released - Duration: 83ms, Active: 0
2025-09-08 06:24:40 [info]: [2025-09-08T11:24:40.917Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:40 +0000] "GET /api/v1/posts?page=1&limit=20&postType=safety_alert HTTP/1.1" 200 205 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:41 [info]: Weather data cached for 36.27857900, -95.83020670
2025-09-08 06:24:41 [info]: [2025-09-08T11:24:41.790Z] [769c2bb49cf27932] Cached response: GET /current (TTL: 600s)
192.168.1.219 - - [08/Sep/2025:11:24:41 +0000] "GET /api/v1/weather/current?lat=36.27857900&lng=-95.83020670 HTTP/1.1" 200 - "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:24:41 [warn]: [2025-09-08T11:24:41.794Z] [769c2bb49cf27932] SLOW REQUEST:
2025-09-08 06:24:57 [info]: [2025-09-08T11:24:57.056Z] DB Pool: Client acquired from pool
2025-09-08 06:24:57 [info]: [2025-09-08T11:24:57.097Z] [c7bfa23e564c80f5] DB Query completed - 41ms, 0 rows
2025-09-08 06:24:57 [info]: [2025-09-08T11:24:57.753Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:24:57 +0000] "GET /api/v1/alerts?latitude=36.27857900&longitude=-95.83020670&city=Owasso&state=Ok HTTP/1.1" 200 267 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:25:10 [info]: [2025-09-08T11:25:10.549Z] DB Pool: Client removed from pool
2025-09-08 06:25:14 [info]: [2025-09-08T11:25:14.866Z] DB Pool: Client acquired from pool
2025-09-08 06:25:14 [info]: [2025-09-08T11:25:14.904Z] [c7bfa23e564c80f5] DB Query completed - 37ms, 1 rows
2025-09-08 06:25:14 [info]: [2025-09-08T11:25:14.905Z] DB Pool: Client released back to pool
2025-09-08 06:25:15 [info]: SUCCESS: New database client connected
2025-09-08 06:25:15 [info]: [2025-09-08T11:25:15.190Z] DB Pool: New client connected
2025-09-08 06:25:15 [info]: [2025-09-08T11:25:15.190Z] DB Pool: Client acquired from pool
2025-09-08 06:25:15 [info]: [AUDIT] PUT /notification-preferences - Status: 200 - Time: 369ms - IP: 192.168.1.219 - User: 28
2025-09-08 06:25:15 [info]: [2025-09-08T11:25:15.235Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:25:15 +0000] "PUT /api/v1/auth/notification-preferences HTTP/1.1" 200 74 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:25:17 [info]: Validation errors:
2025-09-08 06:25:17 [info]: [2025-09-08T11:25:17.105Z] [1d69cba3ee377704] Response 400 - 4ms
2025-09-08 06:25:17 [info]: [AUDIT] GET /security-settings - Status: 400 - Time: 5ms - IP: 192.168.1.219 - User: anonymous
192.168.1.219 - - [08/Sep/2025:11:25:17 +0000] "GET /api/v1/users/security-settings HTTP/1.1" 400 178 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:25:27 [warn]: [SECURITY] API_ABUSE_DETECTED:
192.168.1.219 - - [08/Sep/2025:11:25:27 +0000] "GET /api/v1/users/security-settings HTTP/1.1" 429 96 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:25:43 [info]: [2025-09-08T11:25:43.757Z] DB Pool: Client acquired from pool
2025-09-08 06:25:43 [info]: [2025-09-08T11:25:43.794Z] DB Pool: Client released back to pool
2025-09-08 06:25:43 [info]: [2025-09-08T11:25:43.795Z] DB Pool: Client acquired from pool
2025-09-08 06:25:43 [info]: [2025-09-08T11:25:43.846Z] [c041672f852d303e] Response 404 - 93ms
2025-09-08 06:25:43 [info]: [AUDIT] GET /api/v1/notifications - Status: 404 - Time: 94ms - IP: 192.168.1.219 - User: 28
2025-09-08 06:25:43 [info]: [2025-09-08T11:25:43.847Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:25:43 +0000] "GET /api/v1/notifications HTTP/1.1" 404 110 "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"
2025-09-08 06:25:44 [info]: [2025-09-08T11:25:44.946Z] DB Pool: Client removed from pool
2025-09-08 06:25:48 [info]: [2025-09-08T11:25:48.131Z] DB Pool: Client acquired from pool
2025-09-08 06:25:48 [info]: [2025-09-08T11:25:48.172Z] DB Pool: Client released back to pool
2025-09-08 06:25:48 [info]: [2025-09-08T11:25:48.173Z] DB Pool: Client acquired from pool
2025-09-08 06:25:48 [info]: [2025-09-08T11:25:48.264Z] DB Pool: Client released back to pool
192.168.1.219 - - [08/Sep/2025:11:25:48 +0000] "GET /api/v1/messages/conversations HTTP/1.1" 304 - "-" "Expo/1017721 CFNetwork/3826.600.41 Darwin/24.6.0"

jacobleon@Mac frontend % npm start

> stormneighbor-frontend@1.0.0 start
> expo start

env: load .env
env: export EXPO_PUBLIC_API_BASE_URL EXPO_PUBLIC_API_TIMEOUT EXPO_PUBLIC_APP_ENV EXPO_PUBLIC_PROJECT_ID EXPO_PUBLIC_APP_NAME EXPO_PUBLIC_APP_VERSION EXPO_PUBLIC_BUNDLE_ID EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS EXPO_PUBLIC_ENABLE_LOCATION_SERVICES EXPO_PUBLIC_ENABLE_IMAGE_UPLOADS EXPO_PUBLIC_ENABLE_REAL_TIME_UPDATES EXPO_PUBLIC_BASE_WEB_URL EXPO_PUBLIC_APP_URL_SCHEME
Starting project at /Users/jacobleon/stormneighbor-app/frontend
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀▀ ██▀█ █ ▄▄▄▄▄ █
█ █ █ █▄▀██▀██ █ █ █ █
█ █▄▄▄█ █ ▄ █ ▄▀ ██ █▄▄▄█ █
█▄▄▄▄▄▄▄█ █ ▀▄█ █▄█▄▄▄▄▄▄▄█
█▄ █▄▀▀▄▄▀▀█ ▄▀▄▄▀ ▄▀▄▄▀█
█▄█▄▀██▄▀█▀▀ ▀ ▀▄▄▀ ▀▀█▄▄█
██▄▄█ █▄▀█▀▄ █ █▀█ ▄█ ██▀█
█▄▀ ██ ▄█ ▄ █▀██ ▄▄ ▀▀██▄█
█▄▄████▄█▀▀ █ ▀▄ ▄▄▄ █ ▄ █
█ ▄▄▄▄▄ █▄▄▀▄ █▄ █▄█ ▀ ▄█
█ █ █ █▀ ▀▀▄▄▀▀▄ ▄▄ █▀▄██
█ █▄▄▄█ █▀▀ ██ █ █▄ ▄█▄█
█▄▄▄▄▄▄▄█▄████▄▄█▄███▄▄█▄▄█

› Metro waiting on exp://192.168.1.223:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Using Expo Go
› Press s │ switch to development build

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
iOS Bundled 1218ms node_modules/expo-router/entry.js (3335 modules)
WARN expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at <https://docs.expo.dev/develop/development-builds/introduction/>.
WARN `expo-notifications` functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations. Learn more: <https://expo.fyi/dev-client>.
LOG SUCCESS: DevTools available globally. Use DevTools.completeReset() to clear all data
LOG No token found, dispatching logout
iOS Bundled 110ms node_modules/expo-router/entry.js (1 module)
WARN expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at <https://docs.expo.dev/develop/development-builds/introduction/>.
WARN `expo-notifications` functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations. Learn more: <https://expo.fyi/dev-client>.
LOG SUCCESS: DevTools available globally. Use DevTools.completeReset() to clear all data
LOG No token found, dispatching logout
LOG Attempting login for: <jacobleon2117@gmail.com>
LOG API Base URL: <http://192.168.1.223:3000/api/v1>
LOG Login response received
LOG Login successful, tokens saved
ERROR Error getting push token: [Error: Error encountered while fetching Expo token, expected an OK response, received: 400 (body: "{"errors":[{"code":"VALIDATION_ERROR","type":"USER","message":"\"projectId\": Invalid uuid.","isTransient":false,"requestId":"24c540af-bee2-41aa-a8bd-01a018acca04"}]}").]
LOG Onboarding check: {"addressState": undefined, "hasHomeLocation": undefined, "hasLegacyLocation": undefined, "hasLocationPreferences": undefined, "homeCity": undefined, "homeState": undefined, "locationCity": undefined, "locationPreferences": undefined, "needsLocationOnboarding": true, "needsPermissionsOnboarding": true}
LOG Redirecting to location permissions setup
ERROR Error requesting location permissions: [Error: One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.]
LOG Refreshing user profile
LOG Profile data received: {"addressState": "Oklahoma", "hasLocationData": true, "latitude": null, "locationCity": "Owasso", "longitude": null}
LOG Profile refreshed successfully
LOG Notification preferences saved successfully
LOG Final notification preferences saved successfully
LOG Weather screen - determining best location for weather
LOG Using home address for weather
LOG User profile changed, has location: null
LOG No API key available for location weather data
LOG Loading weather data for location: {"city": "Owasso", "latitude": "36.27857900", "longitude": "-95.83020670", "source": "home", "state": "Ok"}
LOG Fetching weather data for coordinates: 36.27857900, -95.83020670
LOG Throttling weather API call - waiting 30 seconds between calls
LOG Found 0 recent community alerts
LOG Weather API response: {"dataKeys": ["location", "current", "forecast", "lastUpdated", "source"], "hasData": true, "success": true}
LOG Setting weather data: {"current": {"detailedForecast": "Mostly sunny, with a high near 80. South wind 5 to 10 mph.", "icon": "<https://api.weather.gov/icons/land/day/sct?size=medium>", "isDaytime": true, "shortForecast": "Mostly Sunny", "temperature": 80, "temperatureUnit": "F", "windDirection": "S", "windSpeed": "5 to 10 mph"}, "forecast": [{"detailedForecast": "Mostly sunny, with a high near 80. South wind 5 to 10 mph.", "endTime": "2025-09-08T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/sct?size=medium", "isDaytime": true, "name": "Today", "number": 1, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Sunny", "startTime": "2025-09-08T06:00:00-05:00", "temperature": 80, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "S", "windSpeed": "5 to 10 mph"}, {"detailedForecast": "A slight chance of showers and thunderstorms after 1am. Partly cloudy, with a low around 60. Southeast wind 5 to 10 mph. Chance of precipitation is 20%.", "endTime": "2025-09-09T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/sct/tsra_hi,20?size=medium", "isDaytime": false, "name": "Tonight", "number": 2, "probabilityOfPrecipitation": [Object], "shortForecast": "Partly Cloudy then Slight Chance Showers And Thunderstorms", "startTime": "2025-09-08T18:00:00-05:00", "temperature": 60, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "5 to 10 mph"}, {"detailedForecast": "A slight chance of showers and thunderstorms before 7am. Mostly sunny, with a high near 83. South wind 5 to 10 mph. Chance of precipitation is 20%.", "endTime": "2025-09-09T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/tsra_hi,20/sct?size=medium", "isDaytime": true, "name": "Tuesday", "number": 3, "probabilityOfPrecipitation": [Object], "shortForecast": "Slight Chance Showers And Thunderstorms then Mostly Sunny", "startTime": "2025-09-09T06:00:00-05:00", "temperature": 83, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "S", "windSpeed": "5 to 10 mph"}, {"detailedForecast": "Mostly clear, with a low around 62. Southeast wind 5 to 10 mph.", "endTime": "2025-09-10T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/few?size=medium", "isDaytime": false, "name": "Tuesday Night", "number": 4, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Clear", "startTime": "2025-09-09T18:00:00-05:00", "temperature": 62, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "5 to 10 mph"}, {"detailedForecast": "Mostly sunny, with a high near 87. South wind around 5 mph.", "endTime": "2025-09-10T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/sct?size=medium", "isDaytime": true, "name": "Wednesday", "number": 5, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Sunny", "startTime": "2025-09-10T06:00:00-05:00", "temperature": 87, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "S", "windSpeed": "5 mph"}, {"detailedForecast": "Partly cloudy, with a low around 65. Southeast wind around 5 mph.", "endTime": "2025-09-11T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/sct?size=medium", "isDaytime": false, "name": "Wednesday Night", "number": 6, "probabilityOfPrecipitation": [Object], "shortForecast": "Partly Cloudy", "startTime": "2025-09-10T18:00:00-05:00", "temperature": 65, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "5 mph"}, {"detailedForecast": "Sunny, with a high near 90. South wind around 5 mph.", "endTime": "2025-09-11T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/few?size=medium", "isDaytime": true, "name": "Thursday", "number": 7, "probabilityOfPrecipitation": [Object], "shortForecast": "Sunny", "startTime": "2025-09-11T06:00:00-05:00", "temperature": 90, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "S", "windSpeed": "5 mph"}], "lastUpdated": "2025-09-08T11:24:41.789Z", "location": {"latitude": 36.278579, "longitude": -95.8302067}, "source": "NOAA"}
LOG Weather data loaded successfully
LOG Map ready for overlays
LOG Fetching alerts with params: {"city": "Owasso", "latitude": "36.27857900", "longitude": "-95.83020670", "state": "Ok"}
LOG Alerts API response: {"data": {"alerts": [], "lastUpdated": "2025-09-08T11:24:57.751Z", "location": {"city": "Owasso", "coordinates": [Object], "state": "Ok"}, "sources": {"database": 0, "noaa": 0, "total": 0}}, "message": "Alerts retrieved successfully", "success": true}
ERROR Failed to load security settings: [AxiosError: Request failed with status code 400]
ERROR Failed to load security settings: [AxiosError: Request failed with status code 429]
WARN [expo-notifications]: `shouldShowAlert` is deprecated. Specify `shouldShowBanner` and / or `shouldShowList` instead.
LOG Local notification sent: Test Storm Alert
ERROR Load notifications error: [AxiosError: Request failed with status code 404]

some logs in the logs backend folder is like 355207 lines of text......this is a major issue....
i would double check those log files in the backend and see whats going on.
