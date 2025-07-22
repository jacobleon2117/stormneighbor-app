- Create a "ProfileSetupScreen.js" this screen will be for setting up the user(s) account after signing up. This will include, location, profile image, customization, address so they can find their neighborhood/groups.

- Create a screen called "AccountRecovery.js" to have the ability for the user(s) to recover their account(s).



- Need to replace apple emoji with a lucide icon -> {/* <Text style={styles.successIcon}>✅</Text> */}


- Create a screen called "AccountDeletion.js" to have the user(s) to delete their account and data. I would consider this apart of auth since it's dealing with data and personal information being deleted. This screen won't be available untill the user has created their account so therefor this screen isn't apart of any auth flow - This screen is apart of the settings screen which is apart of the main screens which aren't created yet.

- Need to add "loading" visuals after the user either does something to cause the app to check for auth/privileges. For example if the user needs to verify their email that they're using to signup then they have to check their inbox and click a link, then after that it'll take them back to the signup screen then there should be some type of loading skeleton/loading visuals.

- Create a screen called ContactSupport.js to make the flow for the screen "ChangePasswordScreen.js" to help towards finishing the auth screens.

- Remove the timer/count down text in the screen "EmailVerificationScreen.js" and put the timer in the "Resend Email" button. For example "Resend Email 60s".

- Fix the screen RegisterScreen.js, the header/title "Create Account" is to far up really close to the dynamic island.

- Setup forgot password so user get's and email to reset their password.

- Implement Google and Apple sign in.

- After all auth pages are done and each auth screen has a flow either forward into the app or backwards then we can remove the "ScreenNavigator.js" file and make sure the main App.js file is setup to handle logging in and signing up. As well make sure it handles anything to deal with auth.