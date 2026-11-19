# CCS dashboard integration

## WordPress hand-off

The staging dashboard is https://heat-is-on.web.app and its Firebase project is `heat-is-on`. The live dashboard uses https://the-heat-is-on.web.app and the separate `the-heat-is-on` project. Each signer must belong to its target project.

After checking the facilitator's current subscription and dashboard entitlement in WordPress, mint a short-lived Firebase custom token and redirect the browser to `/auth#token=<encoded-custom-token>` on the target dashboard. Set the token's UID to the mapped Firebase UID for existing users, or `ccs-<WordPress user ID>` for new users. Keep the mapping on the WordPress account. The dashboard never links accounts by email.

| Custom claim | Value |
| --- | --- |
| sub_expires | Integer Unix seconds for the subscription end |
| ccs_email | Facilitator email, required, up to 320 characters |
| ccs_name | Display name, optional, up to 100 characters |

Firebase sets auth_time. Access expires at the earlier of sub_expires or 24 hours from auth_time. Opening the dashboard directly continues a valid session. An expired facilitator returns to CCS for a new hand-off. Set the GitHub environment variable CCS_COURSE_URL to the relevant course landing page.

## Reporting

Read collection `game_runs` in Firestore database `(default)`. WordPress signs a separate token for UID `ccs-reporter` with custom claim `role: "reporter"`. Exchange it using Firebase Auth REST `accounts:signInWithCustomToken` for this project's ID token. Send the ID token as a Bearer token to the Firestore REST documents endpoint for the same project and database. Follow nextPageToken to read further pages. The reporter can read runs and has no game or profile access.

Each record is keyed by game ID and contains uid, gameId, startedAt, lastActivityAt, completed, completedAt, roundsPlayed, townCount, playerCount, totalRounds and endedEarly. playerCount is an integer from 1 to 200 or null. The dashboard writes the record alongside creation, start, changes to player count and round settlement. lastActivityAt reflects these reporting events. Deleting a game preserves its record. Old games enter the log at their next such update. Existing completed games require a separate, agreed backfill if historical reports are wanted.

## Acceptance and cut-over

1. Merge to main for a staging deployment. Provide the staging signing key through the agreed one-time channel. Exchange only email and UID for account mapping, separately from credentials.
2. On the CCS test site, exercise a new facilitator, a mapped existing UID, an expired subscription, an early finish, and the reporter query. Use test-project UIDs for games on staging.
3. Agree a date and production course URL with CCS. Keep old password access enabled during testing. For cut-over, set CCS_ONLY=true in staging and release to test the transition. At the agreed time set the same variable for production and dispatch the release. This switches both the UI and Firestore rules for that environment. Disable Firebase Email/Password in coordination with the release. Produce the final production UID mapping once registrations close. Production release remains manual.

WordPress owns eligibility, token issuance and reporting. Keep its dedicated signer outside the web root. The dashboard deployment identity is separate from the CCS signer.
