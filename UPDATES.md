#### REAL USER TESTING [VERY-URGENT]
- Need to find a way to test the app outside my home location (not using the same wifi).
- Have family and friends download the expo app or find a way for them to test the app by creating users and posting.
- Make sure it actully fully works and im able to connect to the frontend and backend from let's say at work, another family's house.
- Do i need to be on a wifi connection? Stay off a wifi connection?
- The app isn't fully ready for real users so getting this working will be a life savor and i'll be able the gather feedback.
- Maybe we can add a screen in the profile screen that is for gathering feedback? Make it to where I can actaully see and read the feedback from the testing users. Should we make it a form style feedback screen? Let them type out what they currently think of the app and what needs to be changed or fixed? I'm not looking for a rating 0/10 but a rating on what they currently think or what I should add or do to improve the development stage of the app so I don't send to production and then gather feedback, which i'll still do but want to get real-world testing users first.
- This is the top of the todo list, everything eles can wait. We also need to make sure we limit the testing users so maybe we cna create the testing accounts right and set permission on those accounts but also allow them to do whatever they want to but limit the amount of API calls or calls from thrid party services so I don't get charged by those third party services.
- What do you think, should we make sure the .env files are correct, the packages.json are correct and make sure everything is setup and we have everything we need? Do I make them download the expo app and is that the only free way?
- As you know we have already tried to get this to work beforehand but it never worked i think it was something to do with the backend sicne the frontend was loading but it was very very slow to load up?


#### LOGIN SCREEN UPDATES [NON-URGENT]
- So there's something going on with the location setup screen, currently after I login, I see a location setup screen (or could be a different screen but similar "UNSURE") then it goes away then i'm on the home feed? why's that?
- Need to make sure the login screen (the screen that says "Welcome Back") needs these updates, make sure to keep the title of the screen in the same spot the create account title is in the sign up screen, move the sign in button to where the create account button is in the sign up screen, basically need to make sure the title, description, and button for the sign up and login are in the same location on both screens to keep the UI/UX similar and designed better.


#### LOADING SCREEN UPDATES [NON-URGENT]
- Update the loading screen to just have the app name "StormNeighbor" when the app is loading up, if the app is taking forever to load just add a loading spinner under the "StromNeighbor" title with no text, Just the loading spinner.
- Make sure the title for this screen is centered right in the middle of the screen.


#### WELCOME SCREEN UPDATES [NON-URGENT]
- Change the description to this, "Get real-time, local severe weather alerts and updates from your community."
- Need to make the current asset image I have called welcome-screen-bg.png and make it take up the entire welcome screen background.
- At the bottom of the screen make a white container, rounded at the top left and right sides then add the title, description and the two buttons: "Get Started" and "Already have an account? Log In" in this new container. Same navigation just different design/styled screen.
- Let's make it to where if the user taps either buttons that the bottom container moves up and takes up the entire screen replacing the elements inside the container with either the sign up screen or login screen.
- If the user has an account already but is in the sign up screen and then they click the label for logging in instead in the sign up screen then just show the login screen like normal, same for the other way around.
- The image I have in the assets folder is already darkend so don't worry about any styling to the image.


#### CREATE SCREEN UPDATES [NON-URGENT]
- The divider above the gallery, camera, and more/less button needs to be removed.
- The red "X" in the top right corner of the img to remove the img is being cutoff by something invisible?
- Make the location and privacy buttons just have the icon in the button, after the who can see this button move the quick actions badge that get's placed in the post screen after the user selects an option right after that button, make sure the quick action buttons stay the same as they're already are when displayed. Make sure there's a big enough gap from these 3 buttons from the post button. Make sure none of these buttons go off the screen nor move at all.
- Make sure the create screen keyboard, quick actions and everything else is darkened when the user hit's post.
- Do you think each quick action option should have a section in the typing area where the user can fill out information about that alert? Like the idea for the event component?


#### WEATHER SCREEN UPDATES [NON-URGENT]
- Need to make sure the high and low elemet is fully functional, this should be the high for today and the low for today, the current tempature.
- If a user made an alert (saftey alert, weather alert, or a cumminuity post alert) then those alerts should pop up on the weather screen if a user chooses alerts in the slider in the weather screen and should be displayed on the weather screen map in the area of that alert. If the user who made the alert let's make sure to not place the alert on the map where the user is located for privcay but also make sure to place it in the area of the alert. How should we do this ecaxtly?, should we make it to where the user can select where the alert is? like if i make a post right, and i use one of the quick actions and i chose event should i be able to look at the map while in the create post screen, move the map around and place the alert anywhere i want it to be? Also we should make sure the alerts that would go on the wetaher screen arn't directly on top of each other but we could make it to where is the user slectes alerts in the weather screen in the slider right, then we can place a icon or the same design box we have for wind, temp, etc but it says alerts then the user cna tap on it and see all the alerts and information about the alerts? then the user can tap on oneof the alerts and go to the post that the user made ofr that alert unless it wasn't made by that user l;et's say the national weather alert was made by the weather center rith then itll just say the alert but if i made a post and it was an event then the user can click on it in the weather screen and it can say like go ot post or view post or a go to icon link that takes the user to that post?
- If this idea is too advance for now, then we can put it in a todo for future implementaion, what do you think?


#### GENERAL UI UPDATES [NON-URGENT]
- Every loading spinner needs to be the main blue color everywhere throughout the entire app.
- Make sure each alert badge / quick actions / sliders are using the same color schem. For example make sure any sliders that have the same items have the same colors for both like the alerts/weather screens have. Make sure the quick actions in the create post screen have the same colors that the sliders have only if there are corresponding alerts that match.
- Remove all current elements and components from the search screens, messages screen, and notifcations screen. Keep the headers just remove the elements that go on the actaully screen. I'll give updates on the UI/UX designs, styling, etc later on.


#### HOME SCREEN UPDATES [NON-URGENT]
- If the user posted more than one image in their post then we need to display a three dot UI element stating that there's more image and the user should be able to swipe right and left on the images to look at the different images that the post has. This new element will have an active color (main blue color) and a disbaled color. The active color is to show the user which image they're currently on and if the user swipes right or left the active color will switch to the second dot showing the user that they're on the second image in that post, then the same if there's other images. The blue main color (active image) follows the user when they're swipping through the post card images, don't show the active/disabled three dots if it's just one post only add the new element if there's only mulitple images within that post.
- When it comes to the events alert badge, how should we display these events? I understand we have an alerts screen but if im scrolling through my home feed I want those events to stand out. Like maybe we create an events component that goes inside the post card if the user selects the quick action option "Event" and we keep the alert badge in the top right corner of the post card but a new component that goes like under the post card description or whatever the user typed in. Then we could have like buttons like "Going" and "Maybe" with both buttons displaying the number amount of people who tapped which ever button. The component could have like the date, location, then the buttons and then in the create post screen we make it to where the user can edit the event component and it'll display the exact same but empty in the create screen then after the user edits it then the same component goes in the post card in the home feed filled out. I like this idea becuase it give the user the option to customize this component and make their post stand out more. We would also need to make sure the new event component doesn't take up the whole post card, for exmaple if the user selects event and want's to add an image how should we handle that spacing? don't allow any images or do allow images just make sure the event component isn't too big because if the user want's to post an event with an image that shows the event then they need to do that since that would be the best practice sense the user might want to post and image with the event.
- Need to make sure user can actually delete their post from the home feed, currently there's a button but does nothing. Also need to make all buttons actaully work and do what they're needed to do. For exmaple the modals work but the options/buttons are not functional.
- For the post card badge (the element in the top right corner of the post card when the user makes a post with one of the quick actions options), I think we should change the "Offer Help" badge to "Offering Help" for only the post card and keep the quick actions the same text as "Offer Help".


#### PROFILE SCREEN UPDATES [NON-URGENT]
- Remove everything from the current profile screen, then replace the elements with these updates.
- You can name these sections whatever but for the first section i'll just call it the user profile information section. This section will have the user profile image, name, follower count, following, posts count and profile description. The profile img will have an lucide react icon for changing their profile image.
- Under the user profile information section add these buttons (rounded rectangles), edit profile and share profile. This section can be with the user profile information section or a new section up to you.
- Remove the messages, notifcations icons from only the profile screen and leave the search icon make sure the search icon is right aligned basically just replace the messages icon with the search icon. Make sure the search icon is the only icon in the profile screen header please.
- Make sure the main background for this screen is like the other tab screens. So for example the background should be like the home screen's background.
- Under the other sections add the profile settings screens, which we can make these new screens and not make them a modal or a pop up. Each profile screen will have a back arrow that takes them back to where they were before entering that screen. Make sure the headers stay the same and DONT add any icons to these new screen headers for now please.
    - Privacy & Security
    - Location Settings
    - Notifications
    - Feed Preferences
    - Appearance
- Under the new screens add these options styled differently.
    - Help & Support
    - Privacy Policy
    - Terms & Aggreements
    - Log out
- I don't have an exact styling/design in mind we can update it after it's fully changed. Just make sure it's different from what it is now.


#### POST CARD UPDATES [NON-URGENT]
- Maybe we need to seperate each modal into it's own component (sepereate file), would this be better or keep as is?


#### NOTIFICATION UPDATES [NON-URGENT]
- Need to fix everything about the notification system.


#### ADMIN DASHBOARD FEATURE [FUTURE]
- Need to create a admin dashboard website for me to look at.


#### FOLLOWING FEATURE [FUTURE]
- Need to add a following feature


#### AD SUPPORT / REVENUE [FUTURE]
- This is a major feature that I want to add, I don't have any expereince in development for supporting ads so this will defentily be a time to research about this.
- I want to be able for other company's to post ads on the home feed for other to see, It could be small business, or even top 500 companies in the world. It doesn't matter but I need more information on this subject.
- Also i would say users that have a business for like tree cleanup/removal, yard work, roof repairs, anything that deals with fixing things after a storm, or any nature related services would be my main tagrets for revenue. Should we only make it to where those types of compnays can post ads and as well has home improvment companys? home depot, lowes, etc. We would need to make a new feature for adding a business page right?
- How exactly would this work?
- If you think about it if a big company want's to post ads right, who manages that? the company's social team? Me? Do they come to me asking for ad placements and give me the information to post like descriptions? Images? Do I make their accounts?
- I would think this would be the only type of revenue possible, I don't want to make the app cost money to buy or a subscription based app.


#### AGE GROUPS / PARENTAL PERMISSIONS [FUTURE]
- When it comes to the idea for younger users to use the app so the whole family can be updated about weather and stuff, how could we make sure we're being legal?
- For exmaple a family of five wants to use the app, mother, father, 18 year old, 14 year old and a 10 year old. Should we create a system where the parents create a family group and add the underage family members to their account then the underage family members can login through those credentials?
- Underage users who try to join aren't allowed till the parent signs up for them under the parent account? Does that mean we have to add a date of birth form field to the sign up screen?
- We would also need to update the profile settings to have parential controls only for the underage accounts or should we just make that a screen no matter what in the profile screen?