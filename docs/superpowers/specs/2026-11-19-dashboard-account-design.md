# Dashboard and account management

Keep the existing Dashboard banner. Below it, put game sessions in the primary column and a compact account summary in the secondary column. On small screens, put the account summary below the games. Show active games first, then finished games. Keep Continue and View visible and put Rename, Export, and Delete under each game's action menu. Preserve the existing training, game creation, and sign-out flows.

## Approaches

- Give account management its own protected page and link to it from the Dashboard. This leaves room for profile editing, password changes, and activity on desktop and mobile. This is the recommended approach.
- Put account management in a Dashboard dialog. This keeps the user in place but crowds the profile, password, and activity flows, especially on mobile.

## Account page

- Let the signed-in user update their display name, preview and upload an avatar, and replace or remove it. Email remains the sign-in identifier. Store the avatar with access restricted to its owner, and show initials when no avatar exists.
- Ask for the current password before setting a new password. Confirm the new password in the form and provide the existing email reset flow when the user has forgotten their current password.
- Show the total saved game count, active count, and finished count. Finished games include games ended early and distinguish that status in the history.
- Sum the recorded player counts of finished games to show total participant attendances. A person who played in multiple games counts once per game. Show how many finished records are missing a player count when applicable. If no finished game has a recorded count, show that no participant total is available.
- Show the most recent hosted games with name, date, status, and recorded player count, with links to the existing game view. Compute activity from the user's saved sessions. Deleted games are outside this record.

Verify that avatar and name changes persist, password changes require the correct current password, accounts cannot access one another's data, saved games remain reachable, and older games without player counts are handled correctly.
