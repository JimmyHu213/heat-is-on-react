# Dashboard and Account Implementation Plan

**Spec:** [Dashboard and account design](../specs/2026-11-19-dashboard-account-design.md)

- [x] Rework the Dashboard body around active and finished game rows. Retain the banner, session handlers, and secondary actions. Verify the desktop and mobile order, action menu, and existing creation flow.
- [x] Add the private account route, profile editor, and password form. Keep profile data in the owner-only Firestore user document and use Auth reauthentication for password changes. Verify save, reload, avatar removal, incorrect password, and successful password changes on the emulator.
- [x] Derive hosting activity from saved sessions. Test finished games with and without recorded player counts. Verify the account page and run lint, unit tests, and production build.
