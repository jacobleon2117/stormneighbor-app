jacobleon@Mac stormneighbor-app % cd backend 
jacobleon@Mac backend % npm start

> weather-neighborhood-backend@1.0.0 start
> node src/server.js

2025-09-26 16:30:40 [info]: WORKING: Validating environment variables
2025-09-26 16:30:40 [info]: WORKING: Environment validated (22 variables configured)
2025-09-26 16:30:40 [info]: Environment: development
2025-09-26 16:30:40 [info]: Development mode settings:
2025-09-26 16:30:40 [info]: INFO: Client URL: http://192.168.1.89:19006
2025-09-26 16:30:40 [info]: INFO: Database SSL: true
2025-09-26 16:30:40 [info]: 
Configured services:
2025-09-26 16:30:40 [info]: INFO: Database: SUCCESS
2025-09-26 16:30:40 [info]: INFO: Email (Resend): SUCCESS
2025-09-26 16:30:40 [info]: INFO: Weather (NOAA): SUCCESS
2025-09-26 16:30:40 [info]: Images (Cloudinary): SUCCESS
2025-09-26 16:30:40 [info]: JWT Security: SUCCESS
2025-09-26 16:30:40 [info]: Environment variables configured properly
app.js loaded
2025-09-26 16:30:41 [info]: INFO: Validating environment configuration

2025-09-26 16:30:41 [info]: SUCCESS: .env file found
2025-09-26 16:30:41 [info]: SUCCESS: DATABASE_URL: post****gres
2025-09-26 16:30:41 [info]: SUCCESS: JWT_SECRET: 4416****fc92
2025-09-26 16:30:41 [info]: SUCCESS: PORT: 3000
2025-09-26 16:30:41 [info]: SUCCESS: NODE_ENV: development
2025-09-26 16:30:41 [info]: SUCCESS: FIREBASE_PROJECT_ID: stormneighbor-app
2025-09-26 16:30:41 [info]: SUCCESS: FIREBASE_PRIVATE_KEY: ----****----
2025-09-26 16:30:41 [info]: SUCCESS: FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@stormneighbor-app.iam.gserviceaccount.com
2025-09-26 16:30:41 [info]: SUCCESS: NOAA_API_BASE_URL: https://api.weather.gov
2025-09-26 16:30:41 [info]: SUCCESS: CLOUDINARY_CLOUD_NAME: dixhgba3x
2025-09-26 16:30:41 [info]: SUCCESS: CLOUDINARY_API_KEY: 451123813779455
2025-09-26 16:30:41 [info]: SUCCESS: CLOUDINARY_API_SECRET: F659****cioc
2025-09-26 16:30:41 [info]: SUCCESS: CORS_ORIGIN: *
2025-09-26 16:30:41 [info]: SUCCESS: RATE_LIMIT_WINDOW_MS: 900000
2025-09-26 16:30:41 [info]: SUCCESS: RATE_LIMIT_MAX_REQUESTS: 100
2025-09-26 16:30:41 [info]: 
INFO: Environment Validation Results:
2025-09-26 16:30:41 [info]: SUCCESS: Environment configuration is valid!

2025-09-26 16:30:41 [info]: WARNING: 1 warning(s):

2025-09-26 16:30:41 [info]:   WARNING: Using default value for CORS_ORIGIN: *
2025-09-26 16:30:41 [info]: 
2025-09-26 16:30:41 [info]: INFO: Environment: development
2025-09-26 16:30:41 [info]: INFO: Port: 3000
2025-09-26 16:30:41 [info]: INFO: Database: Configured
2025-09-26 16:30:41 [info]: INFO: JWT: Configured
2025-09-26 16:30:41 [info]: INFO: Push Notifications: Enabled
2025-09-26 16:30:41 [info]: INFO: Image Uploads: Enabled
2025-09-26 16:30:41 [info]: 
app instance: true
2025-09-26 16:30:41 [info]: Initializing SSL/TLS Security Middleware
2025-09-26 16:30:41 [info]: HTTPS Enforcement: ENABLED
2025-09-26 16:30:41 [info]: HSTS: max-age=300
2025-09-26 16:30:41 [info]: Trusted Proxies: 127.0.0.1
2025-09-26 16:30:41 [info]: Using memory store for registration protection
2025-09-26 16:30:41 [info]: Using memory store for password reset protection
2025-09-26 16:30:41 [info]: Using memory store for password reset protection
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/auth
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/users
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/posts
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/comments
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/upload
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/weather
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/neighborhoods
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/alerts
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/search
2025-09-26 16:30:41 [info]: Firebase Admin SDK initialized successfully
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/notifications
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/messages
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/feedback
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/admin/backups
2025-09-26 16:30:41 [info]: Loaded route: /api/v1/admin
2025-09-26 16:30:41 [info]: Server configured → 0.0.0.0:3000
2025-09-26 16:30:41 [info]: 
SERVER STARTED SUCCESSFULLY
2025-09-26 16:30:41 [info]: ══════════════════════════════════════════════════
2025-09-26 16:30:41 [info]: STATUS: RUNNING - Server listening on 0.0.0.0:3000
2025-09-26 16:30:41 [info]: SUCCESS: Local Access → http://localhost:3000
2025-09-26 16:30:41 [info]: DEV NETWORK ACCESS → http://192.168.1.223:3000
2025-09-26 16:30:41 [info]: Starting session cleanup job
2025-09-26 16:30:41 [info]: Session cleanup job scheduled for 2:00 AM UTC daily
2025-09-26 16:30:41 [info]: SUCCESS: Session Cleanup Job Active
2025-09-26 16:30:41 [info]: SUCCESS: Push Notification Service Active
2025-09-26 16:30:41 [info]: Backup directory initialized: ./backups
2025-09-26 16:30:46 [info]: Starting session cleanup...
2025-09-26 16:30:46 [info]: SUCCESS: New database client connected
2025-09-26 16:30:46 [info]: [2025-09-26T21:30:46.811Z] DB Pool: New client connected
2025-09-26 16:30:46 [info]: [2025-09-26T21:30:46.811Z] DB Pool: Client acquired from pool
2025-09-26 16:30:46 [info]: [2025-09-26T21:30:46.850Z] DB Pool: Client released back to pool
2025-09-26 16:30:46 [info]: SUCCESS: Session cleanup completed in 418ms. Sessions removed: [object Object]
2025-09-26 16:31:16 [info]: [2025-09-26T21:31:16.889Z] DB Pool: Client removed from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:20 [warn]: Invalid access token:
2025-09-26 16:31:20 [error]: Auth middleware error:
2025-09-26 16:31:20 [info]: [2025-09-26T21:31:20.958Z] [cc545b0547488539e90f2e6f024ea7b4] Response 500 - 8ms
192.168.1.219 - - [26/Sep/2025:21:31:20 +0000] "GET /api/v1/auth/profile HTTP/1.1" 500 82 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:26 [info]: SUCCESS: New database client connected
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.306Z] DB Pool: New client connected
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.306Z] DB Pool: Client acquired from pool
2025-09-26 16:31:26 [info]: SUCCESS: New database client connected
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.910Z] DB Pool: New client connected
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.910Z] DB Pool: Client acquired from pool
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.950Z] DB Pool: Client released back to pool
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.955Z] DB Pool: Client acquired from pool
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.995Z] DB Pool: Client released back to pool
2025-09-26 16:31:26 [info]: [2025-09-26T21:31:26.997Z] DB Pool: Client released back to pool
192.168.1.219 - - [26/Sep/2025:21:31:26 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 501 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:31:26 [warn]: [2025-09-26T21:31:26.998Z] [bb776d6a10979ccccf29c7f4053ef770] SLOW REQUEST
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.176Z] DB Pool: Client acquired from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.189Z] DB Pool: Client acquired from pool
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.216Z] DB Pool: Client released back to pool
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.216Z] [fc471096ee32a1f44b2da13d813f2305] Response 401 - 41ms
192.168.1.219 - - [26/Sep/2025:21:31:27 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 401 89 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.226Z] DB Pool: Client released back to pool
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.226Z] [9d7177defa104ba6e3cd578fc1895204] Response 401 - 37ms
192.168.1.219 - - [26/Sep/2025:21:31:27 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 401 89 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.235Z] DB Pool: Client acquired from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.248Z] DB Pool: Client acquired from pool
2025-09-26 16:31:27 [error]: Error refreshing access token: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.271Z] DB Pool: Client released back to pool
2025-09-26 16:31:27 [error]: Token refresh error: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.272Z] [6ae231f5344978af754aefe810bcd1b5] Response 500 - 38ms
192.168.1.219 - - [26/Sep/2025:21:31:27 +0000] "POST /api/v1/auth/refresh-token HTTP/1.1" 500 76 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:31:27 [error]: Error refreshing access token: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.287Z] DB Pool: Client released back to pool
2025-09-26 16:31:27 [error]: Token refresh error: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:31:27 [info]: [2025-09-26T21:31:27.288Z] [0e589b5dcbe54070a78784383bc17a6c] Response 500 - 41ms
192.168.1.219 - - [26/Sep/2025:21:31:27 +0000] "POST /api/v1/auth/refresh-token HTTP/1.1" 500 76 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:34 [info]: [2025-09-26T21:31:34.208Z] [117faad5a7314018ee64ba65a6eb6ef2] Response 401 - 0ms
192.168.1.219 - - [26/Sep/2025:21:31:34 +0000] "PUT /api/v1/auth/profile HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:51 [info]: [2025-09-26T21:31:51.133Z] [abae4181aeb913a54f17f0379fef1919] Response 401 - 0ms
192.168.1.219 - - [26/Sep/2025:21:31:51 +0000] "PUT /api/v1/auth/profile HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:56 [info]: [2025-09-26T21:31:56.088Z] [372d779e0470987ac00cee8e9a7495d6] Response 401 - 0ms
192.168.1.219 - - [26/Sep/2025:21:31:56 +0000] "PUT /api/v1/auth/notification-preferences HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:31:57 [info]: [2025-09-26T21:31:57.296Z] DB Pool: Client removed from pool
2025-09-26 16:31:57 [info]: [2025-09-26T21:31:57.311Z] DB Pool: Client removed from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:57 [info]: [2025-09-26T21:31:57.393Z] [1a0185727f0ad54a074c3fd1bcaf8dbd] Response 401 - 1ms
192.168.1.219 - - [26/Sep/2025:21:31:57 +0000] "PUT /api/v1/auth/notification-preferences HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:57 [info]: [2025-09-26T21:31:57.534Z] [7233217fdfc3e0fdbab82419579f84d3] Response 401 - 1ms
192.168.1.219 - - [26/Sep/2025:21:31:57 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:57 [info]: [2025-09-26T21:31:57.547Z] [f37d7f561ba5a561fe3340afc8614111] Response 401 - 0ms
192.168.1.219 - - [26/Sep/2025:21:31:57 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:59 [info]: [2025-09-26T21:31:59.743Z] [ca4eb89858d6b111539b75e59e9cd824] Cache MISS: GET /current
2025-09-26 16:31:59 [info]: [2025-09-26T21:31:59.744Z] [ca4eb89858d6b111539b75e59e9cd824] Cache MISS: GET /current
Invalid cf-visitor header JSON: "undefined" is not valid JSON
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:31:59 [info]: [2025-09-26T21:31:59.756Z] [e5169da83af790758d1a2c9e8c8f3357] Response 401 - 0ms
192.168.1.219 - - [26/Sep/2025:21:31:59 +0000] "GET /api/v1/posts?page=1&limit=20&postType=safety_alert HTTP/1.1" 401 87 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:32:00 [info]: SUCCESS: New database client connected
2025-09-26 16:32:00 [info]: [2025-09-26T21:32:00.041Z] DB Pool: New client connected
2025-09-26 16:32:00 [info]: [2025-09-26T21:32:00.041Z] DB Pool: Client acquired from pool
2025-09-26 16:32:00 [info]: [2025-09-26T21:32:00.092Z] DB Pool: Client released back to pool
192.168.1.219 - - [26/Sep/2025:21:32:00 +0000] "GET /api/v1/alerts?city=Owasso&state=OK HTTP/1.1" 200 225 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:32:01 [info]: Weather cached: 36.309120423500055, -95.78236694069555
192.168.1.219 - - [26/Sep/2025:21:32:01 +0000] "GET /api/v1/weather/current?lat=36.309120423500055&lng=-95.78236694069555 HTTP/1.1" 200 - "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:32:01 [warn]: [2025-09-26T21:32:01.024Z] [ca4eb89858d6b111539b75e59e9cd824] SLOW REQUEST
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:32:06 [info]: [2025-09-26T21:32:06.201Z] [25234dea47b52c62a144a5007f2a4a3c] Response 400 - 1ms
192.168.1.219 - - [26/Sep/2025:21:32:06 +0000] "GET /api/v1/alerts HTTP/1.1" 400 68 "-" "Expo/1017756 CFNetwork/3860.100.1 Darwin/25.0.0"
2025-09-26 16:32:30 [info]: [2025-09-26T21:32:30.134Z] DB Pool: Client removed from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:33:02 [info]: SUCCESS: New database client connected
2025-09-26 16:33:02 [info]: [2025-09-26T21:33:02.434Z] DB Pool: New client connected
2025-09-26 16:33:02 [info]: [2025-09-26T21:33:02.434Z] DB Pool: Client acquired from pool
2025-09-26 16:33:03 [info]: SUCCESS: New database client connected
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.050Z] DB Pool: New client connected
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.050Z] DB Pool: Client acquired from pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.089Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.091Z] DB Pool: Client acquired from pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.131Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.132Z] DB Pool: Client released back to pool
192.168.1.223 - - [26/Sep/2025:21:33:03 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 501 "-" "Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0"
2025-09-26 16:33:03 [warn]: [2025-09-26T21:33:03.132Z] [7860fa4893aef8426a8022acd12376ab] SLOW REQUEST
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.216Z] DB Pool: Client acquired from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.219Z] DB Pool: Client acquired from pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.256Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.257Z] [520b235d6bdfc79447d5f8e5b3c5a62e] Response 401 - 39ms
192.168.1.223 - - [26/Sep/2025:21:33:03 +0000] "GET /api/v1/auth/profile HTTP/1.1" 401 89 "-" "Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0"
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.257Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.257Z] [e0df997b14b0c57944f2837d044acd0b] Response 401 - 41ms
192.168.1.223 - - [26/Sep/2025:21:33:03 +0000] "GET /api/v1/posts?page=1&limit=20 HTTP/1.1" 401 89 "-" "Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0"
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.263Z] DB Pool: Client acquired from pool
Invalid cf-visitor header JSON: "undefined" is not valid JSON
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.265Z] DB Pool: Client acquired from pool
2025-09-26 16:33:03 [error]: Error refreshing access token: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.301Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [error]: Token refresh error: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.301Z] [6f75c824bdb1ba4e6e8c5415a59a7890] Response 500 - 37ms
192.168.1.223 - - [26/Sep/2025:21:33:03 +0000] "POST /api/v1/auth/refresh-token HTTP/1.1" 500 76 "-" "Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0"
2025-09-26 16:33:03 [error]: Error refreshing access token: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.303Z] DB Pool: Client released back to pool
2025-09-26 16:33:03 [error]: Token refresh error: column u.role does not exist
error: column u.role does not exist
    at /Users/jacobleon/stormneighbor-app/backend/node_modules/pg/lib/client.js:545:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async TokenService.refreshAccessToken (/Users/jacobleon/stormneighbor-app/backend/src/services/tokenService.js:96:19)
    at async refreshToken (/Users/jacobleon/stormneighbor-app/backend/src/controllers/authController.js:895:22)
2025-09-26 16:33:03 [info]: [2025-09-26T21:33:03.303Z] [bf027ae56b92849b1fc270d059513221] Response 500 - 40ms
192.168.1.223 - - [26/Sep/2025:21:33:03 +0000] "POST /api/v1/auth/refresh-token HTTP/1.1" 500 76 "-" "Expo/54.0.6 CFNetwork/3826.400.120 Darwin/24.6.0"
^C2025-09-26 16:33:09 [info]: WORKING: Shutting down database pool
2025-09-26 16:33:09 [info]: 
SHUTDOWN INITIATED (SIGINT)
2025-09-26 16:33:09 [info]: ══════════════════════════════════════════════════
2025-09-26 16:33:09 [info]: Stopping session cleanup job
2025-09-26 16:33:09 [info]: Cron job stopped
2025-09-26 16:33:09 [info]: Graceful shutdown completed
2025-09-26 16:33:09 [info]: SUCCESS: Database pool closed gracefully
2025-09-26 16:33:09 [info]: WORKING: Shutting down database pool
2025-09-26 16:33:09 [error]: ERROR: Error closing database pool:
2025-09-26 16:33:09 [info]: [2025-09-26T21:33:09.097Z] DB Pool: Client removed from pool
2025-09-26 16:33:09 [info]: [2025-09-26T21:33:09.098Z] DB Pool: Client removed from pool