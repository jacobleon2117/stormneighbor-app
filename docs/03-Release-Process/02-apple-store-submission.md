# Apple App Store Submission Guide

This document explains the step-by-step process I follow to submit my app to the Apple App Store.

---

## 1. Prepare Your App for Submission

- Update the version and build number in Xcode (under your project settings).
- Make sure all app icons and launch screens are included and correctly sized.
- Ensure the app passes all validation checks by running Product > Archive in Xcode.
- Test the archived build on a real device using TestFlight if possible.

---

## 2. Archive and Upload the Build

- In Xcode, go to **Product > Archive**.
- Once archiving completes, open the Organizer window.
- Select the archive and click **Distribute App**.
- Choose **App Store Connect** as the destination.
- Follow prompts to upload the build (may take a few minutes).

---

## 3. Set Up the App Store Connect Listing

- Log in to [App Store Connect](https://appstoreconnect.apple.com).
- Select **My Apps** and choose your app.
- Go to the **App Store** tab and select **Prepare for Submission**.
- Fill out all required fields:
  - App Name
  - Description
  - Keywords
  - Support URL
  - Marketing URL (optional)
  - Privacy Policy URL
- Upload screenshots for all required device sizes.
- Set the **App Review Information** (contact info, notes for reviewers).
- Choose the appropriate **App Store Category**.
- Set age rating and content descriptions.

---

## 4. Submit for Review

- Select the build you uploaded via Xcode in the **Build** section.
- Answer any export compliance questions (e.g., encryption).
- Click **Submit for Review**.
- Monitor the status and wait for Apple to review.

---

## 5. After Submission

- Address any feedback or rejections from Apple quickly.
- Once approved, set the app live immediately or schedule a release date.
- Test the live version by downloading from the App Store.

---

## Tips

- Keep the app metadata consistent with what users expect.
- Test your app thoroughly before submitting.
- Check [Apple’s guidelines](https://developer.apple.com/app-store/review/guidelines/) regularly for changes.
