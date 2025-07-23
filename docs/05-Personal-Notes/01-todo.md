# To-Do List

---

### 07/22/2025

- [✅] Create a `ProfileSetupScreen.js` for setting up the user account after signing up. This will include location, profile image, customization, and address to help find their neighborhood/groups.
- [❌] Create an `AccountRecovery.js` screen to enable users to recover their accounts.
- [✅] Replace Apple emoji (`✅`) with a Lucide icon in the UI.
- [❌] Create an `AccountDeletion.js` screen to allow users to delete their account and data. This screen is part of settings (main screens), not the auth flow, and will only be available after account creation.
- [❌] Add loading visuals/skeletons after auth checks, e.g., after email verification redirect back to signup screen.
- [❌] Create a `ContactSupport.js` screen to support the flow from `ChangePasswordScreen.js` to finish the auth screens.
- [✅] Move timer/countdown text from `EmailVerificationScreen.js` into the "Resend Email" button (e.g., "Resend Email 60s").
- [❌] Fix `RegisterScreen.js` layout—header/title "Create Account" is too close to the dynamic island.
- [🔄] Set up "Forgot Password" functionality to send users a reset email.
- [❌] Implement Google and Apple sign-in.
- [❌] Once all auth pages and flows are done, remove `ScreenNavigator.js` and update `App.js` to handle login, signup, and auth state accordingly.

---

### 07/23/2025

- [✅] Remove all emojis used in the codebase (both backend and frontend).
- [✅] Sync backend and frontend updates.
- [✅] Update screens in `src/screens/auth/profile` to use the new `AuthLayout.js` and `authStyles.js`.
- [❌] Remove success Alert popups from LoginScreen and RegisterScreen
- [❌] Replace success alerts with automatic navigation flow
- [❌] Add inline error messages instead of Alert popups for form errors
- [❌] Add loading states to all form submission buttons (already partially done)
- [❌] Create smooth transitions between auth screens
- [❌] Set up automatic navigation after successful login/register
- [❌] Implement proper auth state management in App.js
- [❌] Create navigation logic: New users → Profile Setup, Existing users → Main App
- [❌] Replace all Alert.alert error messages with inline form errors
- [❌] Add form validation with real-time feedback
- [❌] Create consistent error message styling

### This are current bugs/issues/erros that need to be fixed

- [❌] Issue (Needs Fixed) - Extension postgis is installed in the public schema. Move it to another schema.

- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.spatial_ref_sys\` is public, but RLS has not been enabled.     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"spatial_ref_sys","type":"table","schema":"public"}     | rls_disabled_in_public_public_spatial_ref_sys
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.neighborhoods\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"neighborhoods","type":"table","schema":"public"}       | rls_disabled_in_public_public_neighborhoods
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.users\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"users","type":"table","schema":"public"}               | rls_disabled_in_public_public_users
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.weather_alerts\` is public, but RLS has not been enabled.      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"weather_alerts","type":"table","schema":"public"}      | rls_disabled_in_public_public_weather_alerts
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.posts\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"posts","type":"table","schema":"public"}               | rls_disabled_in_public_public_posts
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.comments\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"comments","type":"table","schema":"public"}            | rls_disabled_in_public_public_comments
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.reactions\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"reactions","type":"table","schema":"public"}           | rls_disabled_in_public_public_reactions
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.emergency_resources\` is public, but RLS has not been enabled. | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"emergency_resources","type":"table","schema":"public"} | rls_disabled_in_public_public_emergency_resources
- [❌] rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.notifications\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"notifications","type":"table","schema":"public"}       | rls_disabled_in_public_public_notifications

### These "ERRORS" are simple fixes

- [❌] ERROR: 'setLoading' is declared but its value is never read | CODE: [loading, setLoading] = useState(false); | FILE(S): ProfileSetupScreenIndividual.js & LocationSetupScreen.js & EmailVerificationScreen.js


- [❌] ERROR: 'AuthFooter' is declared but its value is never read | CODE: import AuthLayout, {AuthHeader, AuthButtons, AuthFooter} | FILE: ContactSupportScreen.js

- [❌] ERROR: 'Phone' is declared but its value is never read | CODE: import { Mail, MessageCircle, Phone, ArrowRight } from "lucide-react-native"; FILE: ContactSupportScreen.js

- [❌] ERROR: is declared but its value is never read | CODE: import { Shield, ArrowLeft, RotateCcw } from "lucide-react-native";'ArrowLeft'| FILE: VerifyCodeScreen

- [❌] ERROR: 'res' is declared but its value is never read | CODE:app.use((req, res, next) => {req.io = io;next();}); | FILE: server.js

- [❌] ERROR: 'req' is declared but its value is never read. | CODE: app.get("/health", (req, res) => { | FILE: server.js

- [❌] ERROR: 'req' is declared but its value is never read | CODE: app.use((err, req, res, next) => { | FILE: server.js

- [❌] ERROR: 'next' is declared but its value is never read | CODE: app.use((err, req, res, next) => { | FILE: server.js

- [❌] ERROR: 'req' is declared but its value is never read | CODE: app.use((req, res) => { | FILE: server.js

- [❌] ERROR: 'query' is declared but its value is never read | CODE: const { body, query } = require("express-validator"); | FILE: neighborhoods.js

- [❌] ERROR: 'bio' is declared but its value is never read | CODE: bio, LINE: 255 | FILE: authController.js

---
