# Workshop Dashboard Feedback Updates: Design

Status: draft for approval · 2026-11-15 · branch `feat/dashboard-feedback`

## Intent & Why

After reviewing the facilitated workshop dashboard, the workshop team (facilitators and designers) provided a 47-item feedback spreadsheet (`New Dashboard Feedback.xlsx`). The central theme is **classroom projection and engagement on a 16:9 screen**:

1. Students and workshop participants love watching their town's 20-segment NESH wheel grow when they play an adaptation card and drop when a climate hazard hits. Modal confirmation popups (*"Are you sure?"*), the post-hazard impact table popup, and an opaque overlay drawer hide the town wheels at the exact moment the room wants to watch them change.
2. Several workshop terms and visuals need to match the physical table materials: *"Dividends"* becomes ***"Reward for effort"***, *"Budget Points"* becomes ***"Effort Points"***, Bludgeton is shown without *"Comparison Town"* labels, the 4 all-hazard cards must sit in the same list as the 15 single-hazard cards, the Hazard Wheel needs to be much larger with a 6th **`?` (Mystery)** segment, and the NESH palette (with dark blue for Health instead of white) and percentage scales (`0–100%`) must be used consistently across the back-of-card bars and summary charts.
3. Facilitators also need a way to fix mistakes made earlier in a live workshop—removing a card added by mistake in an earlier or current round, or adding a missed card in Game History—without restarting the game.

## Goals

1. **16:9 live projection layout:** Keep the 6 town NESH wheels visible on screen while playing adaptation cards and spinning/applying hazards, with no confirmation modals or post-hazard impact table modal blocking the view.
2. **Square (`~1:1`) Town NESH cards & chunky NESH bars:** Compact the 6 town cards so a 3×2 grid fits a 16:9 screen, and style the flipped back view with chunky horizontal NESH bars (`0–100%`, each equal to the sum of the 5 hazard segments for that aspect divided by 5) using the NESH palette (including dark blue for Health).
3. **Large 6-slice Hazard Wheel with `?` Mystery segment:** Enlarge the SVG wheel for classroom visibility, add a 6th `?` segment (`mystery`) alongside the 5 hazards (`bushfire`, `flood`, `stormSurge`, `heatwave`, `biohazard`), and make `?` a non-mutating mystery result (nothing auto-applied).
4. **Unified 19-card selector:** Include all 15 single-hazard cards and all 4 multi-hazard ("All-Hazard") cards (*Protected Areas*, *Green Industry*, *Community Events*, *Health Services*) in one unified selector so multi-hazard cards are never overlooked.
5. **Stage bar & terminology alignment:**
   - Rename *Dividends* → **Reward for effort** everywhere (`StageBar`, `DividendsDialog`, `GameSummaryDialog`).
   - Display the exact stage prompt title in `StageBar` (with no step subtitles):
     - Adapt: *"What adaptations will you choose for your town?"*
     - Event: *"Will Adaptania face a climate hazard this year?"*
     - Review: *"How resilient is Adaptania now?"*
     - Reward for effort: *"Reward for effort"*
   - Remove *"Comparison Town"* / *"Comparison"* badges from Bludgeton across all views while keeping Bludgeton locked from playing cards or manual edits.
   - In `TownDetailsView`: rename *"Budget Points"* → ***"Effort Points"*** and remove the *"Hazard Resilience Levels"* breakdown.
6. **Percentage Summary Bar Charts (`BarChartsView`):**
   - Rename *Aspects Summary* → **"NESH Resilience Summary"**: average of N, E, S, H across the 5 player towns (excluding Bludgeton), displayed as a percentage (`0–100%`) with chunky NESH-coloured bars.
   - Rename *Towns Summary* → **"Towns Resilience Summary"**: overall resilience per town displayed as a percentage (`0–100%`).
7. **Game Reflection (`GameSummaryDialog` & `summary.js`):**
   - Show total adaptation cards played and a new **"Most popular climate adaptation"** highlight box (listing ties, or *"None played"* when 0 cards were played), alongside **"Most resilient town"** and **"Most impacted town"**.
   - Show an **"Events experienced"** timeline by **Year** (`Year 2051`, `Year 2052`, ...) and express game duration as *"over X years"* (instead of rounds).
   - Update table columns: **Town** (no `"Every town including Bludgeton"` subtitle or `"Comparison Town"` chip), **Average Resilience** (was *Final Resilience*), **Nature / Economy / Society / Health**, **Hazard impact** (was *Event Losses*), and **Reward for effort** (was *Dividends Earned*). Remove *Weak Segments (≤20)* and *Final Budget*.
8. **Entry / Opening Screen, Video Placeholders & Footer Logos:**
   - Replace the text step list on the entry/opening screen with icon-and-title video cards for the **Time Machine** video and **Global Scenario** video (wired to placeholder paths in `src/constants/mediaConfig.js`).
   - Add a **NESH Explainer Video** button (opens a modal video player) and an **Opening Screen** button (returns to / toggles the opening screen view from any round) in the top Game `AppBar`.
   - Update `Footer.jsx` and `src/constants/mediaConfig.js` to include a placeholder for the **Inspiring Tasmania** logo, the **UTAS** logo, and configurable copyright text.
9. **Editing Game History / Removing Earlier Adaptation Cards:**
   - Allow facilitators to remove any played adaptation card (from the current round or an earlier round) and add a missed adaptation card to any played round (`1 .. currentRound`) directly from **Game History** (`GameTable`) and the **Adapt** control bar.

## Non-goals

- Triggering automatic game-state mutations when the wheel lands on `?` (Mystery)—per user decision, landing on `?` leaves game state unchanged for now.
- Producing final video files or final graphic files—placeholder paths in `src/constants/mediaConfig.js` are used until final assets are dropped in.
- Recomputing or mutating settled `round_stats` documents in Firestore (`firestore.rules` keeps `round_stats` immutable).

## Anti-goals

- **A modal popup covers the 6 town NESH plots right when a card is played or a hazard is applied.**
- **Removing or adding a card in Game History fails `firestore.rules` or corrupts town scores outside `0–100` or Effort Points outside `0–9999`.**
- **Bludgeton becomes editable or able to play cards** when its `"Comparison"` badge is removed (it must remain locked in rules and UI).

## Constraints

- Browser-only SPA; all persistence runs through `src/services/gameSessionService.js` transactions and must satisfy `firestore.rules`.
- Relative imports in `src/game/` and `src/constants/mediaConfig.js` must keep explicit `.js` extensions so `npm test` (`node --test`) executes directly in Node 24.

## Approaches

### 1. Live NESH Visibility & Large Hazard Wheel (16:9 Layout)

- **Approach A (Chosen): Inline Stage Workspace + 3×2 Compact Town Grid**
  - **Adapt stage:** Render a compact inline `CardControls` bar directly above the 3×2 grid of 6 square (`~1:1`) Town NESH cards on the Dashboard tab. Selecting a town + card (from a single unified 19-card list) and clicking **Apply Card** executes immediately without a confirmation dialog, so the class watches the town's NESH wheel grow in real time. Also shows the current round's played cards as removable chips.
  - **Event stage:** Render `HazardControls` inline alongside the 6 Town NESH plots (a 2-column responsive layout on `md+`: large 340px 6-slice Hazard Wheel on the left, 3×2 Town NESH grid on the right). Spinning selects a slice (`bushfire`, `flood`, `stormSurge`, `heatwave`, `biohazard`, or `mystery`). Clicking **Apply Hazard** (or clicking a hazard button directly when the wheel is off or after a spin) applies the hazard immediately with **no confirmation modal** and **no `HazardImpactDialog` modal**, so the class watches the 6 NESH wheels drop live.
  - **Review & Reward stages:** Full-width 3×2 Town NESH grid above the percentage **NESH Resilience Summary** and **Towns Resilience Summary** bar charts.
- **Approach B (Rejected): Keep the Slide-Over Drawer (Only Remove Modals)**
  - Still obscures the left side of the 16:9 projection screen and restricts the Hazard Wheel size.

### 2. Removing Earlier Cards & Editing Game History

- **Approach 1 (Chosen): Transactional Reverse / Apply on `card_plays` + `GameTable` Controls**
  - Each card play in `GameTable` (and in the inline `CardControls` strip) carries its `cardPlay.id` and renders a delete (`×`) icon when `session.isActive`. Each non-comparison Town × Year cell (`round <= currentRound`) in `GameTable` also renders a compact `+` button to add a missed card for that round.
  - **Removing a card play (`removeCardPlay(cardPlayId)`):** Runs a single Firestore transaction that reads the `card_plays` doc, the `towns` doc, and the `game_sessions` doc; verifies `session.isActive`; counts how many rounds in `cardPlay.effectiveRounds` have already been applied (`appliedCount = effectiveRounds.filter(r => r <= session.currentRound).length`, at least `1`); subtracts `card[aspect] * appliedCount` from the affected segments (clamped to `0–100` via `reverseCardEffects(town, card, appliedCount)`); refunds `card.cost` to `town.effortPoints` (clamped to `0–9999`); deletes the `card_plays` doc; and increments `session.revision` (clearing `lastUndo`).
  - **Adding a card play to round `targetRound <= currentRound` (`applyCardToTown(townId, cardId, targetRound)`):** Runs a single Firestore transaction that allows any `targetRound` in `1 .. session.currentRound` while `session.isActive` (without requiring `stage === "adaptation"` when editing an earlier round or from Game History); calculates `effectiveRounds = cardEffectiveRounds(targetRound, card.duration)`; counts `appliedCount = effectiveRounds.filter(r => r <= session.currentRound).length`; applies the card's boost `appliedCount` times (clamped to `0–100`); deducts `card.cost` from `town.effortPoints`; and creates the `card_plays` doc with `isActive: effectiveRounds.some(r => r > session.currentRound)`.
- **Approach 2 (Rejected): Full Game Replay from Round 1**
  - Would conflict with immutable `round_stats` rules in `firestore.rules` and wipe out manual Effort Points adjustments.

## Detailed Specifications

### Palette & NESH Colours (`src/constants/palette.js`)
- Update `healthColor` from `"#FFFFFF"` to dark blue `"#1B365D"` (`#1B365D`).
- Keep `natureColor = "#527334"`, `economyColor = "#C8D2BE"`, `societyColor = "#E38A6C"`, `healthColor = "#1B365D"`, and use these exact 4 colours in `TownPieChart` (back view bars) and `BarChartsView` (`NESH Resilience Summary` and `Towns Resilience Summary`).

### Hazard Wheel (`src/game/wheel.js`, `src/components/Game/components/HazardWheel.jsx`)
- Export `WHEEL_SEGMENTS` with 6 equal 60° slices: the 5 hazards plus `{ id: "mystery", name: "?", color: "#546E7A", isMystery: true }`.
- `spinHazardWheel(segments = WHEEL_SEGMENTS, getRandomUint32)` picks uniformly across all segments (`count = segments.length`).
- Enlarge the SVG wheel in `HazardWheel.jsx` to `340×340` (`viewBox="0 0 340 340"`).
- When the wheel lands on `mystery` (`id === "mystery"`), display a clear banner: *"Mystery (?) landed! No automatic hazard applied — discuss or choose a hazard below if needed."* and do not auto-select a hazard to apply.
- When the wheel lands on one of the 5 hazards, display an inline **Apply [Hazard] Now** button (with the event GIF preview right inside the inline Event panel, no modal dialog).

### Unified Card Selection & History Editing (`src/game/cards.js`, `src/components/Game/components/CardControls.jsx`, `src/components/Game/components/GameTable.jsx`)
- Pure helper `applyCardEffectsMultiple(town, card, times = 1)` and `reverseCardEffects(town, card, times = 1)` in `src/game/cards.js`.
- In `CardControls.jsx`:
  - Remove the 2-tab split (`Hazard Cards` vs `All-Aspect Cards`) and the confirmation `Dialog`.
  - Present a single unified `<Select>` (with `<ListSubheader>` groupings for **All-Hazard Cards (x4)** and **Single-Hazard Cards (x15)**, or clear labels like `[All Hazards · Nature +15] PROTECTED AREAS (15 EP)`).
  - Show a live preview of the selected card's effects inline and apply immediately when clicking **Apply Card**.
- In `GameContext.jsx` & `GameTable.jsx`:
  - Track `cardPlayDocs` (array of `{ id, cardId, cardName, townId, playedAtRound, effectiveRounds, isActive }`) in `GameContext` alongside `townCardPlays`, and expose `removeCardPlay(cardPlayId)` and `addCardPlayAtRound(townId, cardId, roundNumber)`.
  - In `GameTable.jsx`: render each played card chip with `onDelete` (when `session?.isActive`) to call `removeCardPlay(play.id)`, and a small `+` icon button in each non-comparison Town × Year cell (`round <= currentRound`) that opens a lightweight inline/popover card picker to add a missed card for that year.

### Summary Calculations (`src/game/summary.js`, `src/components/Game/components/GameSummaryDialog.jsx`)
- Extend `buildGameSummary({ session, towns, events = [], roundStats = [], cardPlays = [], cards = [] })`:
  - `totalCardsPlayed`: total number of `cardPlays` in played rounds (`1 <= playedAtRound <= roundsPlayed`).
  - `mostPopularCards`: array of `{ cardId, name, count }` tied for highest play count (`count >= 1`) across played rounds (empty array when `totalCardsPlayed === 0`).
  - `eventsByYear`: array of `{ round, year: 2050 + round, hazardIds }` for rounds `1 .. roundsPlayed`.
- In `GameSummaryDialog.jsx`:
  - Header chip: `over ${summary.roundsPlayed} year${summary.roundsPlayed === 1 ? "" : "s"}` and `${summary.totalCardsPlayed} Adaptation Cards Played`.
  - Three highlight boxes: **Most resilient town**, **Most impacted town**, and **Most popular climate adaptation**.
  - **Events experienced** section listing each year (`Year 2051`, `Year 2052`, ...) and its hazard chips.
  - Table columns: **Town** (no `"Comparison Town"` chip), **Average Resilience** (`%`), **Nature**, **Economy**, **Society**, **Health**, **Hazard impact**, **Reward for effort** (`+X EP`). Omit *Weak Segments (≤20)* and *Final Budget*.

### Entry / Opening Screen, Top-Bar Video Buttons & Footer (`src/constants/mediaConfig.js`, `src/components/Game/components/IntroVideo.jsx`, `src/components/Game/index.jsx`, `src/components/common/Footer.jsx`)
- Extend `MEDIA_CONFIG` in `src/constants/mediaConfig.js` with:
  - `timeMachineVideo: "/media/introduction-en.mp4"` (placeholder until replaced)
  - `globalScenarioVideo: "/media/global-scenario.mp4"` (placeholder)
  - `neshExplainerVideo: "/media/nesh-explainer.mp4"` (placeholder)
  - `inspiringTasmaniaLogo: "/media/logos/inspiring-tasmania.png"` (placeholder with text fallback)
  - `utasLogo: null` (uses existing `utas.png` asset unless overridden)
  - `copyrightText: "The Heat Is On © ${new Date().getFullYear()} | University of Tasmania · Climate Change Adaptation Workshop"` (placeholder for TBC copyright text)
- In `Game/index.jsx`:
  - Add top-bar buttons for **Opening Screen** (toggles `showOpeningScreen` so the facilitator can return to the opening screen at any point and return back to the active round) and **NESH Explainer** (opens a modal video dialog playing `MEDIA_CONFIG.neshExplainerVideo`).
  - On the Opening Screen (`currentRound === 0 || showOpeningScreen`), remove the numbered/bulleted stage instructions and render clean icon cards for **Time Machine Video** and **Global Scenario Video** plus the **Start Game** / **Return to Game** button.

## Left to the Builder

Exact MUI spacing/grid breakpoints for the 16:9 layout, exact styling of the inline card-picker popover in `GameTable`, and fallback UI when a placeholder video or logo file is not yet placed in `public/media/`.
