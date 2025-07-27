# Storm Neighbor Backend - Production Ready TODO List

## Recently Fixed

### Post Creation & Display Issues:
- [✅] **Post creation validation** - Fixed title optional validation
- [✅] **Network connectivity** - Fixed API base URL from localhost to IP
- [✅] **User location detection** - Fixed property path mapping
- [✅] **Geographic post filtering** - Fixed PostgreSQL function data types
- [✅] **Quick action templates** - Fixed post type validation and React keys
- [✅] **Implement like/unlike system** - Users can only like posts once, toggle working properly
- [✅] **Add reaction state management** - Backend properly handles toggle, frontend responds correctly
- [✅] **Add optimistic UI updates** - Immediate feedback on like/unlike actions
- [✅] **Fix PostCard design** - Redesigned with proper layout, profile images, and consistent styling
- [✅] **Fix PostCard component** - Redesigned with proper width matching, profile images, MapPin icons, and clean layout
- [✅] **Enable Row Level Security (RLS)** - Main app tables now secured with RLS
- [✅] **Fix function search paths** - Added explicit search_path to database functions
- [✅] **Database security warnings resolved** - Remaining warnings are safe to ignore (PostGIS system table)
- [✅] **Add comment count to posts** - Fixed in PostCard component, displays actual counts
- [✅] **Add reaction count to posts** - Fixed in PostCard component, displays actual counts  

## Critical - Must Fix Before UI/UX Focus

### Post System Issues
- [❌] **Update getPosts API to include user reactions** - Modify backend to return whether current user has liked each post
- [❌] **Add proper reaction counts from database** - Currently returning 0, need to count actual reactions

### UI/UX Improvements - Essential Screens
- [❌] **Create Post Comments Screen** - CRITICAL: Full-screen comments view with slide-in navigation from post comment button
- [❌] **Redesign User Onboarding Flow** - CRITICAL: Improve location setup, notification preferences, and profile completion screens
- [❌] **Create Settings Screen** - Essential account management, logout, privacy settings, notification preferences
- [❌] **Create Edit Profile Screen** - Allow users to update profile info, location, and profile picture after initial setup
- [❌] **Remove loading spinner from ProfileScreen** - Clean up unnecessary loading states
- [❌] **Fix AlertsScreen integration** - Connect with backend for user location-based alerts
- [❌] **Add weather service integration** - Connect with national weather services for real alerts
- [❌] **Enable alert creation from home feed** - Allow users to create community alerts

### Authentication & Security
- [❌] **Implement real email service** - Replace mock `sendEmail` function in authController with actual service (SendGrid, AWS SES, or Mailgun)
- [❌] **Add JWT refresh tokens** - Currently only access tokens, need refresh token flow
- [❌] **Add password complexity validation** - Ensure secure passwords in production
- [❌] **Add account lockout** - After failed login attempts
- [❌] **Implement CSRF protection** - Add CSRF tokens for state-changing operations
- [❌] **Add input sanitization** - Prevent XSS attacks in user content

### Database & Data Integrity
- [❌] **Add database connection pooling configuration** - Optimize connection management
- [❌] **Implement database migrations system** - Currently using raw SQL updates
- [❌] **Add data validation at database level** - Constraints, triggers, etc.
- [❌] **Add backup strategy** - Automated database backups
- [❌] **Implement soft deletes** - Instead of hard deletes for posts/comments

### Core Functionality (From TODO comments in code)
- [❌] **Implement real-time notifications** - Currently just emits events (line 354 in posts controller)
- [❌] **Add post expiration handling** - Cleanup expired posts automatically
- [❌] **Implement user blocking/reporting** - Safety feature for community

## High Priority - Core Features Missing

### Search & Discovery
- [❌] **Implement full-text search** - Search posts by content, tags, etc.
- [❌] **Add post filtering system** - By type, priority, distance, etc.
- [❌] **Add trending/popular posts** - Algorithm for post ranking
- [❌] **Implement post recommendations** - Based on user activity/location

### File Management
- [❌] **Image upload system** - Currently posts can have images but no upload endpoint
- [❌] **Image resizing/optimization** - Compress images for performance
- [❌] **File storage strategy** - AWS S3, Cloudinary, etc.
- [❌] **Profile image upload** - Users can't currently upload profile pictures

### Missing Route Implementations
- [❌] **Complete neighborhoods routes** - Currently loading but need implementation
- [❌] **Complete alerts routes** - Weather alerts system
- [❌] **Complete weather routes** - Weather integration
- [❌] **Add admin routes** - Content moderation, user management

### User Management
- [❌] **User verification system** - Email verification flow
- [❌] **User roles/permissions** - Admin, moderator, regular user
- [❌] **User profile completion tracking** - Ensure required fields
- [❌] **User activity tracking** - Last seen, post count, etc.

## Medium Priority - Performance & Scalability

### Performance Optimization
- [❌] **Add Redis caching** - Cache frequent queries (nearby posts, user profiles)
- [❌] **Implement pagination** - Large result sets need proper pagination
- [❌] **Add database query optimization** - Analyze and optimize slow queries
- [❌] **Add CDN for static files** - Images, profile pictures
- [❌] **Implement data compression** - Gzip responses

### API Improvements
- [❌] **Add API versioning** - /api/v1/posts, etc.
- [❌] **Implement GraphQL** - Alternative to REST for flexible queries
- [❌] **Add API documentation** - Swagger/OpenAPI docs
- [❌] **Add request/response logging** - Structured logging with request IDs
- [❌] **Add API analytics** - Track usage, popular endpoints

### Real-time Features
- [❌] **Implement WebSocket authentication** - Secure real-time connections
- [❌] **Add typing indicators** - For comments
- [❌] **Add online user presence** - Show who's online
- [❌] **Implement push notifications** - Mobile push notifications

## Low Priority - Nice to Have

### Advanced Features
- [❌] **Add post drafts** - Save posts without publishing
- [❌] **Implement post scheduling** - Schedule posts for later
- [❌] **Add post analytics** - View counts, engagement metrics
- [❌] **Implement post sharing** - Share posts outside app
- [❌] **Add post bookmarking** - Save posts for later

### Social Features
- [❌] **User following system** - Follow other users
- [❌] **Private messaging** - DMs between users
- [❌] **User reputation system** - Karma/points based on helpful posts
- [❌] **Community guidelines** - Terms of service, community rules

### Integration & External Services
- [❌] **Weather API integration** - Real weather data
- [❌] **Maps integration** - Better location services
- [❌] **Social media login** - Google, Facebook, Apple Sign-In
- [❌] **Analytics integration** - Google Analytics, Mixpanel
- [❌] **Error tracking** - Sentry, Bugsnag for production error monitoring

## Infrastructure & Deployment

### Production Setup
- [❌] **Environment configuration** - Separate dev/staging/prod configs
- [❌] **Docker containerization** - Container deployment
- [❌] **CI/CD pipeline** - Automated testing and deployment
- [❌] **Load balancing** - Multiple server instances
- [❌] **SSL/TLS configuration** - HTTPS enforcement

### Monitoring & Logging
- [❌] **Health check endpoints** - Detailed health monitoring
- [❌] **Performance monitoring** - APM tools (New Relic, DataDog)
- [❌] **Log aggregation** - Centralized logging (ELK stack)
- [❌] **Alerting system** - Notifications for errors/downtime
- [❌] **Database monitoring** - Query performance, connection pool health

### Security Hardening
- [❌] **Security headers** - Enhance existing helmet configuration
- [❌] **Rate limiting per user** - Currently global rate limiting
- [❌] **IP whitelisting** - For admin endpoints
- [❌] **Audit logging** - Track admin actions
- [❌] **Penetration testing** - Security assessment

## Immediate Action Items (This Week)

1. [❌] **POST COMMENTS SCREEN (CRITICAL)** - Create full-screen comments view with proper navigation (4-6 hours)
2. [❌] **REDESIGN ONBOARDING FLOW (CRITICAL)** - Improve location, notifications, and profile setup screens (6-8 hours)
3. [❌] **CREATE SETTINGS SCREEN** - Essential account management and preferences (3-4 hours)
4. [❌] **ADD REAL REACTION COUNTS** - Update getPosts API to include user reaction state and actual counts (2-3 hours)
5. [❌] **ALERTS SYSTEM** - Connect AlertsScreen with backend and weather services (4-6 hours)
6. [❌] **Implement email service** - Replace mock email function
7. [❌] **Set up file upload** - For images and profile pictures

## Milestone: Ready for UI/UX Focus

Once the **CRITICAL** and **HIGH PRIORITY** items are complete:

- [❌] Secure authentication system
- [❌] Complete CRUD operations for all features
- [❌] File upload capabilities
- [❌] Real-time functionality
- [❌] Basic performance optimizations
- [❌] Production-ready infrastructure
