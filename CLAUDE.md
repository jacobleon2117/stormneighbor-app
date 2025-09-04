# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StormNeighbor is a React Native mobile app with Node.js backend for neighborhood emergency coordination and community weather alerts. Users share posts, request/offer help during storms, view weather alerts, and communicate with neighbors in their geographic area.

## Quick Start Commands

### Frontend (React Native/Expo)

```bash
# Development
npm run start              # Start Expo dev server
npm run start:clear        # Start with cache cleared
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator

# Code Quality
npm run lint              # ESLint checking
npm run type-check        # TypeScript validation
npm test                  # Jest tests
```

### Backend (Node.js/Express)

```bash
# Development
npm run dev               # Development with nodemon
npm run test              # Run full test suite (36 tests)
npm run test:watch        # Watch mode testing

# Database
npm run db:setup          # Setup database schema
npm run db:test           # Test database connection
npm run env:check         # Validate environment variables

# Production
npm run start             # Production server
npm run health:check      # Application health check
```

## Architecture

### Tech Stack

- **Frontend**: React Native with Expo Router v5.x (file-based routing), TypeScript
- **Backend**: Node.js 18+ with Express.js, PostgreSQL with PostGIS
- **Authentication**: JWT with refresh tokens stored in Expo SecureStore
- **APIs**: NOAA Weather API, Firebase push notifications, Cloudinary images
- **Testing**: Jest with 36/36 tests passing

### Key Patterns

**Authentication Flow**

- JWT tokens with automatic refresh via Axios interceptors
- Multi-step onboarding: location permissions → home address setup → main app
- Context-based auth state management in `/frontend/hooks/useAuth.tsx`

**API Service Layer**

- Centralized API client in `/frontend/services/api.ts` with token management
- RESTful endpoints: `/api/v1/{auth,posts,weather,alerts,users,messages}`
- PostGIS geospatial queries for location-based post matching

**Navigation Structure**

- Expo Router file-based routing with `(auth)` and `(tabs)` groups
- Tab navigation hides for modal screens (search, notifications, messages)
- Authentication gates in `app/_layout.tsx` handle routing decisions

**Component Architecture**

- Custom UI components in `/frontend/components/` with consistent styling
- Lucide React Native icons throughout
- Modal components use Animated.Value for custom animations

## Development Workflow

### Environment Setup

- Frontend uses Expo environment variables with IP-based local URLs
- Backend requires comprehensive environment validation via `npm run env:check`
- PostgreSQL database with PostGIS extensions for geospatial features

### Code Standards

- ESLint + Prettier enforced on both frontend and backend
- TypeScript on frontend, comprehensive Jest testing on backend
- Pre-commit hooks validate code quality and run tests

### Testing Strategy

- Backend: 36 Jest tests with Supertest covering all API endpoints
- Frontend: Limited test coverage, primarily manual testing with Expo
- Database: Separate test environment with schema validation

## Key Implementation Details

### Location Services

- PostGIS handles geospatial queries for neighbor matching by city/state/radius
- Multi-step location onboarding determines user's home address
- Weather data integrates with NOAA API for real-time alerts

### Security

- Helmet, CORS, rate limiting, and input validation on all endpoints
- JWT refresh token rotation with secure storage
- Environment variable validation prevents deployment with missing configs

### Real-time Features

- Socket.io for live notifications and messaging
- Firebase push notifications for mobile alerts
- Cloudinary integration for image uploads with optimization

## Known Issues & Areas for Improvement

### High Priority UI/UX Issues

- PostCard modal interactions can glitch when swiping to close
- Loading screen should delay spinner display for better UX
- Keyboard handling needs improvement during authentication flow

### Incomplete Features

- Comments system has backend API but needs frontend completion
- Search functionality exists but needs location-based filtering enhancement
- Admin dashboard routes exist but no frontend implementation

### Performance Considerations

- Image carousel for post images needs implementation
- Location accuracy could be fine-tuned for better neighbor matching
- Some unused dependencies may need cleanup

## Deployment

- Backend deploys to Render.com with Docker containerization
- CI/CD pipeline via GitHub Actions with quality gates
- Health monitoring endpoints for production status checks
- Database migrations managed via custom scripts in `/backend/src/scripts/`

## Contributing

Run `npm run lint` and `npm run type-check` on frontend before commits. Backend has comprehensive scripts for validation: `npm run ci:test` runs linting, formatting, and full test suite. Always test database connections with `npm run db:test` after environment changes.
