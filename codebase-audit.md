Codebase Audit & Reset Checklist

I can't continue with development unless everything that I have now in this codebase has been looked over and made sure it's correct. Don't just check a few things you can check every single folder and file in this codebase, take your time and understand what is going on. You can create a report.md file that can explain what needs to be done before i start development again. Again check EVERYTHING, you can do whatever you want to understand how this app works and where it needs to be right now before I add any new feature. I want to make sure the features I have now are fully implemented before adding any new features. Again look at everything I dont care if it takes an hour i need this done correctly please. You can do it in steps if you need to. Take your time please. There's a lot of unused varibales, imports, etc we need to find why there's so many and work on a plan to figure out a fix for these as well. Like are we using the users location to place post on their home feed of their town? city? state? Does the user only see people's post from their town? Could the user allow a certain town, towns, citys, etc to see their post and to see other user(s) post? Do we even need to have the word neighborhood in this app then? Is there a table that uses neighborhoods? like i dont understand that you know and i see that docker is installed and i have files for docker, do we even need to use docker? Also make sure there's isn't any files/.json that are just sitting there that we don't need anymore please. So, this is the current deal. I need to make sure the things in the file "codebase-audit.md" are done now before anything else is added/developed in my app. Why? Because I think there's too much going on and barely anything fully completed. I need to make sure what we have currently is completed before I move on to anything else the app needs. I would rather take a step back to the very start of this codebase, look through it and make sure everything is correct and proper. We can make a full backup of everything we have now then if all things go back we can go back to that backup. But I just really want to go through everything right now before i contuine adding any new features, more screens or just anything in general. The only things i would want to add are the missing implementions, code, etc that current features/files/code need to be fully complete. Can you please help me on this, please please please! Don't say "everything is working and production ready" when it's not, it's currently in a state of confusion...and so am i...lol...

Step 1 – Understand the App

Write a short overview of what the app does.

Map the main flow: Frontend → Backend → Database.

Be able to explain the app in 2–3 sentences.

Step 2 – Clean the Codebase

Remove placeholder data, text, emojis, or temp code.

Identify unused or “dusty” code:

Remove old, irrelevant code.

Document code saved for future use.

Go through the backend and frontend folders and see what files or folders that need to be removed.

Review comments:

Collect all TODOs / “fix later” notes.

Decide if they are actionable or should be removed.

Confirm folder/file structure makes sense for frontend, backend, and shared code.

Step 3 – Review Dependencies & Configs

Check package.json (frontend + backend).

Remove unused packages.

Update outdated ones if necessary.

Check .env files (frontend + backend).

Confirm every variable is needed and actually used.

Remove or rename anything incorrect/outdated.

Step 4 – Audit Database & Backend

List all tables in Supabase (or your DB).

Mark which are in use.

Flag unused/redundant tables.

Compare schemas with what the backend/frontend expect.

Review API routes:

Confirm all routes are relevant.

Verify they work as intended.

Step 5 – Check Frontend Flow

Walk through the app as a brand-new user.

Check if navigation feels logical and smooth.

Test location settings specifically — confirm they work properly.

Step 6 – Test Functionality

Run the entire app (frontend + backend + DB).

Perform a “happy path” test: sign up, log in, use core features.

Try edge cases:

Wrong login.

Invalid/bad input.

Denying location access.

Document bugs, odd behavior, or mismatches.

Step 7 – Document

Update/create a README or dev notes including:

How the app currently works.

How to run it locally.

Which features or fixes are unfinished.
