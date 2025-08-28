- ### MESSAGES, SEARCH, AND NOTIFICATIONS SCREENS
- #### FILE: messages.tsx, search.tsx, notifications.tsx
    - Make sure each header in these screens are the exact same.
    - remove all icons from these headers then add these icons to these screens:
    - SEARCH SCREEN: NO ICONS FOR NOW
    - NOTIFCATIONS SCREEN: NO ICONS FOR NOW
    - MESSAGES SCREEN: NO ICONS FOR NOW
- #### ERRORS: Fix errors
    - Need to make sure we fix all errors in this screen before moving on to another screen.
    - Also need to make sure this screen is fully completed and has no placeholder data/information/text/emojis/etc.
    - Make sure there isn't unused import/etc if we for sure don't need them remove them but if they're there but arent used and need to be used we need to make sure they're being used.
    - Lucide react icons only.




**LOGIN SCREEN UPDATES**
#### STEP #1:
    - If user uses their face ID to login, go ahead and auto login so if the face ID fills in the email and password automatically, go ahead and auto login the user instead of them having to tap sign in.
    - The login auth screen needs to be changed, I think putting the elements inside that screen in the middle of the screen without changing the layout of the elements but just moving them into the middle of the screen would be a better UI/UX.




**HOME SCREEN UPDATES**
#### STEP #1: POST CARD UPDATES
    - Remove the "X" icon from the comments modal
    - Remove the placeholder text "Comments coming soon..." in the comment modal
    - Remove the "X" icon from the more modal
    - Make sure the user can tap off any modal to close or swipe down to close the modals for all MODALS PLEASE
    - If the user opens up the more modal right. then taps an option that goes to another modal then make sure to have an back arrow to go back to the last modal.
    - Remove the dividers in the more modal for the "Report Post" and "Hide Post" options and keep the main divider under "More Options"
    - Add more options to the more modal, follow this order below as well:
        - Follow
        - Hide
        - Report
        - Block User
            - This is what each option is for:
            - Follow this will be if the user isn't following the account and can follow and unfollow in the same button
            - The hide option will hide the post from the users feed, if the user taps this then a modal will come up like how the comment and more modal works with these options to select:
                - Report this post
                - Mute (account name)
                - Undo
            - Report option will report the post and if the user taps this then a modal will come up like how the comment and more modal works with these options to select:
                - I just dont like it
                - Bullying or unwanted content
                - Suicide, self injury or eating disorders
                - Violence, hate r exploitation
                - selling or promting restricted items
                - Nudity or sexual activity
                - Scam, fraud or spam
                - intellectual property
                - i want to request a community note
            - Block User option will block the user right then and there and should be able to undo the action if it was a mistake in the same button/modal
    - The share button should use the same modal as the comment and more buttons. This will open a modal to users they follow right and also have more options to share to, like Imessages, copy link, share to, snapchat, instagram, etc.
        - The users followers in the share modal will be displayed in a row of 3 and then should be able to swip down and up to show follower list so the user can see their followers. make sure the user can swipe up or down to see their follower list. Only show 6 full profile elements then cut off the next row to show there's more below the 6 that are presnt visual already, if the user doesnt have more than 6 followers then only show 6, if the user has 8 show the same vut off profile imgs at the 3 row of profile imgs but keep them in order so for exmaple, i see 6 profile img of my followers but i have have a total of 8 right so i should see 6 full profile imgs but then see 2 cut off profile imgs letting me know to swipe up to go down and see the last 2 and make sure they contuine in the next row and not centered or right laigned so the bottom row of followers i have the last 2 will be left aligned so keep with next if that makes sense.
    - The other options to share will go at the bottom of the share modal in it's on container where i can swipe right to see more options and swipe back to the frist option, the first and last option in this container should stop and not contuine if there's nothing else in that slider if that makes sense, if i swipe right to the last option then stop, if i swipe back to the start of the slider then stop at the first one.




### WEATHER SCREEN
- #### FILE: weather.tsx
    - Need to make sure the high and low elemet is fully functional, this should be the high for today and the low for today, the current tempature.
    - If a user made an alert (saftey alert, weather alert, or a cumminuity post alert) then those alerts should pop up on the weather screen if a user chooses alerts in the slider in the weather screen and should be displayed on the weather screen map in the area of that alert. If the user who made the alert let's make sure to not place the alert on the map where the user is located for privcay but also make sure to place it in the area of the alert. How should we do this ecaxtly?, should we make it to where the user can select where the alert is? like if i make a post right, and i use one of the quick actions and i chose event should i be able to look at the map while in the create post screen, move the map around and place the alert anywhere i want it to be? Also we should make sure the alerts that would go on the wetaher screen arn't directly on top of each other but we could make it to where is the user slectes alerts in the weather screen in the slider right, then we can place a icon or the same design box we have for wind, temp, etc but it says alerts then the user cna tap on it and see all the alerts and information about the alerts? then the user can tap on oneof the alerts and go to the post that the user made ofr that alert unless it wasn't made by that user l;et's say the national weather alert was made by the weather center rith then itll just say the alert but if i made a post and it was an event then the user can click on it in the weather screen and it can say like go ot post or view post or a go to icon link that takes the user to that post?
        - If this idea is advanmce we can put it in a todo for future implementaion, what do you think?
- #### ERRORS: Fix errors
    - Need to make sure we fix all errors in this screen before moving on to another screen.
    - Also need to make sure this screen is fully completed and has no placeholder data/information/text/emojis/etc.
    - Make sure there isn't unused import/etc if we for sure don't need them remove them but if they're there but arent used and need to be used we need to make sure they're being used.
    - Lucide react icons only.


