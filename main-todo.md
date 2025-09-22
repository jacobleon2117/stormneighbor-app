# CREATE SCREEN BUGS & UPDATES

- BUG #1: Currently if you tap the red "X" the keyboard closes and the image never get's removed, the image can be removed after the keyboard closes which this needs to be fixed.
- FIX FOR BUG #1: Fix the red "X" from removing the image without closing the keyboard and also make sure it actually removes the image when the user taps the red "X" the first time.

---

# POST CARD BUGS & UPDATES

- UPDATE #1: We need to fully implement liking, commenting, and sharing features. So we would need to update the comments modal to show comments and implment new UI/UX components/features to the comments modal.
- UPDATE #2: The more options modal needs to be updated as well, if the user taps more on their post they will see the options to delete their post and edit their post, if the post isn't theirs then they wont see those options. The order of the current options in the more options modal should be like this, Save, About this account, unfollow or follow depending if that user is following that user who made the post and if they arent, then hide, report. After that add the edit post or delete post options. Make sure to sepereate the delete and edit post options from the rest keep the other options together without sepreeting them with a divider then divide the top section from the delete and edit bottom section.
- UPDATE #3: Need to make sure every modal and feature for the post card is fully implemented, like reporting, editing post, etc.

---

# HOME SCREEN BUGS & UPDATES:

- UPDATE #1: Header hides when user(s) swipes up to go down the list of post. Header shows up when the user(s) swipe down to go up the list, If the user reaches back to the lastest post then the header stays, if they swipe up to go down the list then it hides.

---

# UPDATE SEARCH, NOTIFICATIONS & MESSAGES SCREENS:

- Make it to where I can swipe left to close these screens like how the profile screen has screens inside it that I can swipe to go back, make these just like that function.

# PROFILE SCREEN BUGS & UPDATES

- BUG #1: I can't add an image to my profile picture (avatar).
- FIX FOR BUG #1: Need to fix the bug to allow user(s) to add an profile picture to their account avatar.

- UPDATE #1: Remove borders in the menu of screens, make the white container for the menu rounded and keep it white, add the logout button to it's own white container with the same border radius (rounded) as the main menu screens update the logout button to match with the new white rounded container.

---

# WEATHER SCREEN BUGS & UPDATES

- BUG #1: If I use the arrow (go to users current location) It doesn't take me directly to the users location (the blue dot on the map).
- FIX FOR BUG #1: Need to update code to fix this issue, if it's an issue with getting the users location then we need to find the exact problem.

- UPDATE #1: Need to place badges/UI on the weather map that shows post/weather/etc alerts on the map where the alert was made. For exmaple if another user created a post with the community alert badge, I should be able to go to the weather screen and use the slider and tap community option and it should display that alert in the proxy where the alert was made, let's not display the direct location of that alert but maybe just have it set to where it shows the alert in the city, state, etc. Make sure the alerts don't stack ontop of each other. Maybe create a modal where it shows the curretn seleted alerts instead of displayling multiple alert bagdes on the map but into one modal. What do you think?

# FILE: cloudinary.js

Date.now() is only millisecond-level, so if two uploads happen in the same millisecond, they could overwrite.
Safer approach: append a random string or UUID:
