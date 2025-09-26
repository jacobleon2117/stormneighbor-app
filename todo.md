➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #0: Quick Check (I just did a full rotate of credentials 09/26/2025 - Today)
➕ Just need to double check these, I did a full rotate of credentials so that should be completed:
        ➖ [❌] Rotate all exposed secrets & remove .env from version control
        ➖ [❌] Rotate Firebase and Cloudinary credentials
        ➖ [❌] Enable SSL certificate validation for production DB
        ➖ [❌] Restrict production CORS to trusted domains
        ➖ [❌] Audit for unauthorized access & possible compromise
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #1: GitGuardian
➕ Secrets incidents detected double check codebase - (Might be from the old keys in the file called PRODUCTION_AUDIT_REPORT.md):
        ➖ [❌] Resend API key
        ➖ [❌] Redis CLI Password
        ➖ [❌] PostgreSQL URI
        ➖ [❌] Generic Password
        ➖ [❌] Generic High Entropy Secret
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #2: Expo Go (USING IOS SIMULATOR)
➕ The app is currently not working properly:
        ➖ [❌] Check logs and see what errors are currently there
        ➖ [❌] Need to check backend codebase and frontend codebase to see what's going on
        ➖ [❌] The app is experiencing major problems that need to be addressed before anything else is done
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #3: Security & Privacy & Security Concerns
➕ Review and strengthen security and privacy measures - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Enhanced input validation
        ➖ [❌] XSS prevention improvements
        ➖ [❌] Rate limiting on frontend
        ➖ [❌] Privacy settings enhancements
➕ Session Management:
        ➖ [❌] Rate limiting data stored in memory - (resets on restart)
        ➖ [❌] No distributed session management for scaling
        ➖ [❌] JWT tokens cannot be invalidated before expiry
➕ Database:
        ➖ [❌] Small production pool size (20) may not handle load
        ➖ [❌] Missing connection retry logic for failures
        ➖ [❌] No automated backup verification system
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #4: Secure environment variables
➕ Improve management of environment variables - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Use environment variable management service (AWS Secrets Manager, etc.)
        ➖ [❌] Never commit actual secrets to any file
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #5: Audit access
➕ Implement and review auditing for access and credentials - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Check if these credentials have been used maliciously
        ➖ [❌] Monitor all connected services for unauthorized access
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #6: Account Deletion
➕ All current accounts in the codebase and database need to be deleted:
        ➖ [❌] jacobleon2117@gmail.com account needs to be fully removed and deleted from codebase and database
        ➖ [❌] jacobleon222@gmail.com account needs to be fully removed and deleted from codebase and database
        ➖ [❌] Check and see if there is any other accounts located in the codebase and database then we need to delete them
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #7: Frontend Concerns
➕ Review frontend configuration and security issues - (subject to change, review for potential risks and missing configurations):
        ➖ [❌] Development API endpoint hardcoded: `http://192.168.1.223:3000`
        ➖ [❌] Missing OpenWeather API key
        ➖ [❌] Push notifications disabled in development
        ➖ [❌] No offline functionality implementation - (Future for now, but start the code and file but don't use it then add notes in the file of what to do later on in that file.)
➕ Security:
        ➖ [❌] No certificate pinning for API calls
        ➖ [❌] Local storage security needs review
        ➖ [❌] Missing app transport security configuration
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #8: Infrastructure Concerns
➕ Review infrastructure and deployment setup - (subject to change, ensure proper deployment and monitoring):
        ➖ [❌] Docker Compose file incomplete - (only 1 line - Has been updated, need to double check this)
        ➖ [❌] Missing container orchestration - (Would need to be looked over and double checked)
        ➖ [❌] No persistent volume configuration
        ➖ [❌] Render.com free tier limitations for production - (No longer being used, removed from codebase currently)
➕ Monitoring:
        ➖ [❌] Optional Sentry integration not enforced
        ➖ [❌] No default monitoring solution
        ➖ [❌] Missing alerting configuration
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #9: Create Screen Bugs & Updates
➕ Fix and enhance create screen functionality - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] BUG #1: Currently if you tap the red "X" the keyboard closes and the image never gets removed
        ➖ [❌] FIX FOR BUG #1: Fix the red "X" to remove the image without closing the keyboard and ensure the image is removed on first tap
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #10: Profile Screen Bugs & Updates
➕ Review and fix profile screen features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] BUG #1: Cannot add an image to profile picture (avatar)
        ➖ [❌] FIX FOR BUG #1: Fix the bug to allow users to add a profile picture to their avatar
        ➖ [❌] UPDATE #1: Update menu UI:
        ➖ [❌] Remove borders in menu screens
        ➖ [❌] Make white container for menu rounded
        ➖ [❌] Place logout button in its own white rounded container matching main menu screens
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #11: Post Card Updates & Bugs & Comment Functionality
➕ Review and update post card features; enhance post and comment capabilities - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Fully implement liking, commenting, and sharing features; update comments modal to show comments and implement new UI/UX components/features
        ➖ [❌] Update more options modal:
                ➖ [❌]If post belongs to user: show edit and delete options
                ➖ [❌] If post doesn’t belong to user: hide edit/delete options
                ➖ [❌] Reorder options: Save, About this account, Unfollow/Follow (based on current follow status), Hide, Report
                ➖ [❌] Separate edit/delete options in a bottom section from other options
        ➖ [❌] Ensure all modals and features for post card are fully implemented (reporting, editing post, etc.)
        ➖ [❌] Edit own comments functionality
        ➖ [❌] Pin important posts
        ➖ [❌] Post analytics (view count, engagement metrics)
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #12: Conversation Features
➕ Review and improve messaging and conversation features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Message search within conversations
        ➖ [❌] File/image sharing in messages
        ➖ [❌] Message reactions
        ➖ [❌] Conversation muting/unmuting
        ➖ [❌] Conversation archiving
        ➖ [❌] Typing indicators
        ➖ [❌] Message read receipts
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #13: Update Search & Notifications & Messages Screens
➕ Improve navigation on search, notifications, and messages screens - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Implement swipe-left to close functionality similar to profile screen’s back navigation
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #14: Notification Enhancements
➕ Improve notification handling and user control - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Notification categories/grouping
        ➖ [❌] Bulk delete notifications
        ➖ [❌] Notification settings per category
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #15: Alert System
➕ Develop and refine alert system features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Alert subscription management
        ➖ [❌] Custom alert creation by users
        ➖ [❌] Alert sharing functionality
        ➖ [❌] Alert comment system
        ➖ [❌] Alert verification/reporting
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #16: Home Screen Bugs & Updates
➕ Improve home screen scrolling behavior - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Header hides when user swipes up to scroll down the list of posts, shows when user swipes down; stays visible if user reaches the latest post
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #17: Weather Screen Bugs & Updates & Enhancements
➕ Improve weather screen features, interactivity, and map interactions - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] BUG #1: Arrow button does not take user directly to current location
        ➖ [❌] FIX FOR BUG #1: Fix issue to ensure arrow navigates to user location; troubleshoot location retrieval if needed
        ➖ [❌] Display badges/UI for posts/alerts on weather map:
                ➖ [❌] Show alerts (community, etc.) in approximate city/state location
                ➖ [❌] Prevent alerts from stacking on top of each other
                ➖ [❌] Optional: create modal to show currently selected alerts instead of multiple badges on map
        ➖ [❌] Interactive weather map with user interaction
        ➖ [❌] Weather history/trends display
        ➖ [❌] Custom weather alert thresholds
        ➖ [❌] Weather-based post filtering
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #18: UI/UX Improvements
➕ Improve overall UI/UX design and experience - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Enhanced loading states on buttons
        ➖ [❌] Modal animations and state management
        ➖ [❌] Better error handling and user feedback
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #19: Accessibility
➕ Improve app accessibility - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Add accessibility labels
        ➖ [❌] Screen reader support
        ➖ [❌] Keyboard navigation
        ➖ [❌] High contrast mode support
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #20: Weather API Migration
➕ Evaluate switching from OpenWeather to Tomorrow.io. OpenWeather API is currently deactivated:
        ➖ [❌] Research Tomorrow.io capabilities vs OpenWeather
        ➖ [❌] Analyze visual display options (clouds/rain/etc mapping)
        ➖ [❌] Determine compatibility with current tech stack
        ➖ [❌] Keep OpenWeather code as backup if needed
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #21: Cloudinary Upload Handling
➕ Ensure file uploads are safe from collisions - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Avoid overwriting uploads with identical timestamps
        ➖ [❌] Append a random string or UUID to uploaded filenames to ensure uniqueness
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #22: Additional Requirements Needed
➕ Complete missing app requirements and compliance features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] App Transport Security (ATS) configuration
        ➖ [❌] Privacy policy implementation
        ➖ [❌] App Store metadata completion
        ➖ [❌] TestFlight beta testing setup
        ➖ [❌] Crash reporting implementation
        ➖ [❌] Performance optimization
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #23: Performance & Technical
➕ Review and optimize performance-related features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Image caching and optimization
        ➖ [❌] Infinite scroll optimizations
        ➖ [❌] Background app refresh
        ➖ [❌] Push notification handling improvements
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖



**Color Legend**
[❌] INCOMPLETE
[🕙] STARTED
[🟢] COMPLETED