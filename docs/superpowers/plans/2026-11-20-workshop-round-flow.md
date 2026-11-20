# Workshop round flow implementation plan

Facilitators should be able to finish a year with zero hazards, use the event tool at any point in a live round, and settle and advance in one action. The implementation builds on the card-cost fix in 6682832.

1. Update the tests and stage rules in `src/game/stages.js`. Allow movement both ways between adjacent stages, including after a hazard. Keep the shared five-hazard limit, revision checks and existing settlement transaction. Exercise skipped years, stage preservation, reloads and final settlement in `scripts/test-emulator.mjs`.
2. Update `StageBar.jsx` and `Game/index.jsx`. Put actions beneath the active question, keep the other two questions visible in grey, and remove the floating controls. Place Event and End game early in the header. Wire the Review action directly to settlement and use its result to show the next year or summary.
3. Update `HazardControls.jsx` and `HazardWheel.jsx`. Use the same event picker from the header and flow box. A mystery result closes the picker silently. Opening and closing the picker must leave the current stage and scores intact.
4. Run unit, emulator, lint and production build checks. Exercise cards, mystery, skip, header events, Back, early-end cancellation and the final summary through the browser.

## Verification

The production build passed. All 95 unit tests and 11 Firebase emulator tests passed. Chromium exercised digital and physical wheels, a hazard-free final summary, card play, advanced events in Adapt and Review, Back, early-end cancellation, session reload and settlement. The mobile check ran at 390 × 844. ESLint reported six existing warnings and zero errors.
