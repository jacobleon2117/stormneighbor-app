➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #1: Security & Privacy & Security Concerns
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
# TASK #2: Secure environment variables
➕ Improve management of environment variables - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Use environment variable management service (AWS Secrets Manager, etc.)
        ➖ [❌] Never commit actual secrets to any file
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #3: Audit access
➕ Implement and review auditing for access and credentials - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Check if these credentials have been used maliciously
        ➖ [❌] Monitor all connected services for unauthorized access
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #4: Frontend Concerns
➕ Security:
        ➖ [🕙] No certificate pinning for API calls - (Verified: Not implemented, needs production setup)
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #5: Infrastructure Concerns
➕ Monitoring:
        ➖ [❌] Optional Sentry integration not enforced
        ➖ [❌] No default monitoring solution
        ➖ [❌] Missing alerting configuration
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #6: Create Screen Bugs & Updates
➕ Fix and enhance create screen functionality - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] BUG #1: Currently if you tap the red "X" the keyboard closes and the image never gets removed
        ➖ [❌] FIX FOR BUG #1: Fix the red "X" to remove the image without closing the keyboard and ensure the image is removed on first tap
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #7: Profile Screen Bugs & Updates
➕ Review and fix profile screen features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] BUG #1: Cannot add an image to profile picture (avatar)
        ➖ [❌] FIX FOR BUG #1: Fix the bug to allow users to add a profile picture to their avatar
        ➖ [❌] UPDATE #1: Update menu UI:
        ➖ [❌] Remove borders in menu screens
        ➖ [❌] Make white container for menu rounded
        ➖ [❌] Place logout button in its own white rounded container matching main menu screens
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #8: Post Card Updates & Bugs & Comment Functionality
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
# TASK #9: Conversation Features
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
# TASK #10: Update Search & Notifications & Messages Screens
➕ Improve navigation on search, notifications, and messages screens - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Implement swipe-left to close functionality similar to profile screen’s back navigation
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #11: Notification Enhancements
➕ Improve notification handling and user control - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Notification categories/grouping
        ➖ [❌] Bulk delete notifications
        ➖ [❌] Notification settings per category
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #12: Alert System
➕ Develop and refine alert system features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Alert subscription management
        ➖ [❌] Custom alert creation by users
        ➖ [❌] Alert sharing functionality
        ➖ [❌] Alert comment system
        ➖ [❌] Alert verification/reporting
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #13: Home Screen Bugs & Updates
➕ Improve home screen scrolling behavior - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Header hides when user swipes up to scroll down the list of posts, shows when user swipes down; stays visible if user reaches the latest post
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #14: Weather Screen Bugs & Updates & Enhancements
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
# TASK #15: UI/UX Improvements
➕ Improve overall UI/UX design and experience - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Enhanced loading states on buttons
        ➖ [❌] Modal animations and state management
        ➖ [❌] Better error handling and user feedback
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #16: Accessibility
➕ Improve app accessibility - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Add accessibility labels
        ➖ [❌] Screen reader support
        ➖ [❌] Keyboard navigation
        ➖ [❌] High contrast mode support
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #17: Weather API Migration
➕ Evaluate switching from OpenWeather to Tomorrow.io. OpenWeather API is currently deactivated:
        ➖ [❌] Research Tomorrow.io capabilities vs OpenWeather
        ➖ [❌] Analyze visual display options (clouds/rain/etc mapping)
        ➖ [❌] Determine compatibility with current tech stack
        ➖ [❌] Keep OpenWeather code as backup if needed
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #18: Additional Requirements Needed
➕ Complete missing app requirements and compliance features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] App Transport Security (ATS) configuration
        ➖ [❌] Privacy policy implementation
        ➖ [❌] App Store metadata completion
        ➖ [❌] TestFlight beta testing setup
        ➖ [❌] Crash reporting implementation
        ➖ [❌] Performance optimization
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #19: Performance & Technical
➕ Review and optimize performance-related features - (subject to change, review features and see what is missing, fixed, changed):
        ➖ [❌] Image caching and optimization
        ➖ [❌] Infinite scroll optimizations
        ➖ [❌] Background app refresh
        ➖ [❌] Push notification handling improvements
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #21: Can't log out on IOS Simulator and Expo Go
➕ Need to fix a bunch of issues with ios sim
        ➖ [❌] Fix logging out
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖
# TASK #22: Finish the apple and google login/signup options
➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

**Color Legend**
[❌] INCOMPLETE
[🕙] STARTED
[🟢] COMPLETED