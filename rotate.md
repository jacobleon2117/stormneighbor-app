# 📋 PENDING TASKS & DECISIONS

## SECOND TASK:

**Weather API Migration**: Evaluate switching from OpenWeather to Tomorrow.io. OpenWeather API is currently deactivated. Need to:

- Research Tomorrow.io capabilities vs OpenWeather
- Analyze visual display options (clouds/rain/etc mapping)
- Determine compatibility with current tech stack
- Keep OpenWeather code as backup if needed

---

QUESTION #1: Firebase Service Account

BEST: Your current setup is perfect. Keep the active key 2214a8a60c716d3025b499970edca9511dfea3cd with the long expiration (Dec 31, 9999). Deleting old keys was
the right security move. No changes needed.

QUESTION #2: Supabase Database Password

BEST: Don't change it right now. Your current password is working fine and you just cleaned up the database. Only rotate it when you're ready for production
deployment. For now, focus on development - password rotation can wait until you deploy.

QUESTION #3: Supabase Connection Method

BEST: Keep your current setup (direct PostgreSQL connection in backend). You're NOT using Supabase-js in the frontend, and that's actually better for your
architecture. Your backend handles all database operations securely, and the frontend just talks to your API. This is the proper way to do it.

QUESTION #4: Expo Development Setup

BEST: Set up EAS Development Builds now. Your expo.dev being empty means you're missing the proper development workflow. Run npx eas build --profile development
--platform ios/android to create development builds. This will let you test your app properly without Expo Go limitations.

QUESTION #5: GitHub Branch Strategy

BEST: Create this workflow: dev → testing → main. Skip staging for now since you're the only developer. Create a dev branch for daily work, use testing for feature
testing, and main stays clean for releases. One branch per major feature when needed.

QUESTION #6: Supabase Environment

BEST: You're correct - "main (production)" refers to your Supabase project environment, not GitHub. You only need one database for now since you're in development.
When you're ready for production, you can create a separate Supabase project for production data.

QUESTION #7: UI/UX Redesign Planning

BEST: Wait until after core functionality is complete. Your current UI/UX is functional - finish all the backend features first, get the app working end-to-end,
THEN do a UI overhaul as version 2.0. Don't get distracted by design when core features aren't done.

QUESTION #8: Production Readiness

BEST: Address this in 2 phases: Phase 1 (now) - finish core features and fix major bugs. Phase 2 (later) - add monitoring, error tracking, performance
optimization, and security hardening. You're in Phase 1, so focus on completing features first.

QUESTION #9: Third-Party Service Consolidation

BEST: Keep all your current services - they're each best-in-class for their purpose:

- Supabase: Database (perfect for PostgreSQL + auth)
- Cloudinary: Image handling (best for this)
- Firebase: Push notifications (easiest mobile push)
- Resend: Email (cleanest email API)
- NOAA: Weather data (free and reliable)

Don't consolidate - each serves a specific purpose well. The complexity of managing 5 services is worth the benefits.

TLDR: Focus on EAS development builds and the dev → testing → main branch workflow. Everything else is fine as-is. Finish features before worrying about UI,
production readiness, or service consolidation.
