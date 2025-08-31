1. Post Card Modal Glitch
Status: Open
Modals glitch at the bottom when swiping to close.
Users should not be able to open the next modal while one is open.
After closing a modal (by swipe or tapping outside), the next modal the user tries to open should appear immediately with no timeout or delay.

2. Keyboard UI Issue on Create Post
Status: Open
When the keyboard is open and the user taps "Post," the keyboard remains visible and does not darken like the rest of the screen.

3. Loading Screen
Status: Open
Find where the app is using the loading screen to verify purpose.
Ensure there are not multiple redundant loading screens.

4. Location Screen Flicker
Status: Open
After logging in, the location screen briefly appears for ~0.5 seconds and disappears. Investigate and fix.

5. Face ID / Passkey Login Keyboard Movement
Status: Open
Login screen elements shift upward after selecting the account via the Passkey icon.
Manually typing also moves elements when tapping email/password fields.
Decide if the screen should remain static while the keyboard appears, or keep current behavior.

6. Post Card Image Carousel
Status: Open
Swipe left/right on images directly within the post card (no full-screen).
Display small dots at the bottom representing total images.
Active dot color: main blue; inactive dots: dimmed/grey.
Smooth, fluid swipe transitions.
Handle edges (first/last image) with either stop or loop.
Swiping must not interfere with feed scrolling or post interactions.
Optional: tap left/right sides of the image to navigate (accessibility).

7. Full-Screen Post Image View
Status: Open
Clicking a post image opens it full-screen.
Display author name, likes, comments, and shares.
Allow swipe left/right for multiple images.
Tapping image or close button exits smoothly.
Transitions should be fluid and responsive.
Full-screen overlay should not interfere with background posts.

8. Post Card Modal Component Structure
Status: Open
Consider separating each modal into its own component/file for better modularity and maintainability.

9. Notification System Fixes
Status: Open
Review and fix issues with delivery, display, and user interaction.
Test real-time notifications (note: Expo may not support this fully).

10. User Following System
Status: Open
Implement follow/unfollow functionality.
Feed personalization based on followed users.
Notifications for posts/activity from followed users.
Privacy settings for follow/unfollow actions.

11. Profile Screen Updates
Status: Open
General Updates:
Remove all existing elements and replace with new structure.
Main background matches other tab screens.
User Profile Information Section:
Profile image (with Lucide React icon), user name, follower/following counts, posts count, profile description.
Profile Action Buttons:
Rounded buttons: Edit Profile, Share Profile. Can be in info section or separate.
Header / Icons:
Remove messages/notifications icons; keep only search icon right-aligned.
Profile Settings Screens (new screens, not modals):
Each screen has a back arrow, headers remain unchanged (no icons).
Screens: Privacy & Security, Location Settings, Notifications, Feed Preferences, Appearance.
Additional Options (styled differently): Help & Support, Privacy Policy, Terms & Agreements, Log Out.
Design Notes: Exact styling flexible; layout should differ from current profile screen.

12. App-Wide Color & Style Consistency
Status: Open
All loading spinners use main blue color.
Alerts, Quick Actions, and sliders maintain consistent color scheme.
Quick Actions in Create Post match slider colors when corresponding alerts exist.
Goal: consistent, cohesive UI across all interactive elements.

13. Create Post Screen Updates
Status: Open
Fix red "X" on post images being cutoff.
Location & Privacy Buttons:
Icon-only buttons.
Place Quick Actions badge directly after "Who can see this" button.
Maintain spacing from Post button; buttons must not move off-screen.
Quick Action Input Section (Optional):
Consider allowing user input per Quick Action (similar to Event component) for more detailed alerts.

14. Weather Screen Updates
Status: Open
Temperature Display:
Show today’s high, low, and current temperature.
Alert Integration:
Alerts appear if user selects alerts in slider.
Map displays alert locations, excluding creator’s exact location.
Optional: allow user to choose alert location during creation.
Handling Multiple Alerts:
Avoid overlapping alerts on map.
Optional “Alerts” box/icon shows all alerts; tap to view details.
Tap action: link to original post (if user-created) or show alert info (external sources).
Implementation Consideration:
Complex features like user-placed alerts may be deferred as future enhancements.

15. Home Screen Updates
Status: Open
Post Card Image Carousel:
Show three-dot indicator for multiple images; active dot in main blue, inactive dots dimmed.
Event Quick Action Component:
Event component below post description with date, location, “Going/Maybe” buttons showing number of users.
Component editable in Create Post screen; filled component appears in feed.
Ensure component doesn’t overcrowd post card; manage image + event spacing.
Post Functionality:
Users can delete posts; all buttons and modals must function correctly.
Post Card Badge Updates:
Change “Offer Help” → “Offering Help” on post card only; Quick Actions menu text remains “Offer Help”.

16. Admin Dashboard Website
Status: Open
Build admin dashboard for monitoring/managing app data:
User stats, engagement metrics, content moderation, bug tracking, ad/revenue management.

17. Ad Support / Revenue
Status: Open
Allow companies to post ads in home feed; app remains free.
Target businesses: storm recovery, home improvement, landscaping, etc.
Business accounts/pages may include profile info, ad submission, basic analytics.
Ads could appear like sponsored posts; content reviewed by owner or automated system.
Revenue models: impressions, clicks, flat fee.
Ad moderation and compliance required; analytics optional initially.

18. Age Groups / Parental Permissions
Status: Open
Parents create family group and add underage users; underage users log in via parent account.
Users under legal age cannot sign up independently; DOB field may be required.
Parental controls: content visibility, notifications, post restrictions.
Controls displayed only on underage accounts or via unified settings screen.
Ensure compliance with COPPA, GDPR-K, and manage data/access safely.

19. Real User Testing
Status: Open / Non-Urgent / Future-for-Right-Now
Objective: Test the app in real-world conditions outside your home network to ensure frontend and backend connectivity works correctly.
Testing Setup:
Find a way for users to test the app outside your home location, using different networks (work, friends/family homes, cellular data).
Family and friends can download the Expo app or use an alternative method to test by creating users and posting.
Verify the app works fully, including connecting to both frontend and backend, from various locations.
Determine if a Wi-Fi connection is required or if cellular data is sufficient.
Feedback Gathering:
Consider adding a feedback screen in the profile section.
Could be a form-style screen for testers to type what they think about the app.
Collect improvement suggestions, bug reports, or general feedback.
Avoid simple 0–10 ratings; focus on qualitative, actionable feedback.
Testing Account Management:
Limit the number of testing users.
Create dedicated testing accounts with permissions, allowing users to explore the app but controlling API calls or third-party service usage to avoid costs.
Environment & Setup Checks:
Confirm .env files and package.json configurations are correct.
Make sure all required packages and dependencies are installed.
Verify Expo setup; consider if downloading the Expo app is the most practical/free method.
Previous Issues:
Prior attempts to test failed due to slow backend response, while frontend loaded.
Feedback logs may have been lost due to cloning over old folders.
Ensure feedback logs persist and are not deleted when closing VSCode or re-cloning the repository.
Priority:
This is the top priority; other updates can wait until real-user testing is functional.

20. Unit Testing
Create a dedicated test file per feature or component.
Keep test file naming consistent (e.g., featureName.test.js or ComponentName.test.tsx).
Store them alongside the code they test or in a central __tests__/ folder.
Standardize console.log statements across all test files.
Logs should describe exactly what the test is doing, no emojis or decorative characters.
Keep the style consistent across all test files so logs are predictable and easy to read.
Use the same structure in every test file:
Arrange → setup the data/environment.
Act → perform the action being tested.
Assert → check the expected result.
Easier to debug since each test is clearly scoped.
Console logs make test runs readable and explain what’s happening.
Consistency keeps test files simple to maintain and extend.