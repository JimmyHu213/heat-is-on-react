# Workshop Dashboard Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 47 workshop feedback items from `New Dashboard Feedback.xlsx` across pure game rules, Firestore card-history editing, 16:9 live projection layout (removing blocking modals), square Town NESH cards, chunky NESH percentage bars, a 340×340 6-slice Hazard Wheel with `?` mystery slice, unified 19-card selector, updated StageBar/Reward for effort/Year terminology, opening-screen video placeholders, top-bar NESH Explainer modal, and Footer logo/copyright placeholders.

**Architecture:** Client-only React 19 + Vite 6 + MUI 7 SPA backed by Firebase Auth and Firestore (`src/services/gameSessionService.js`, `src/contexts/GameContext.jsx`). Pure game math and transformations live in `src/game/` and are tested with `node --test`. UI components in `src/components/Game/` and `src/components/Charts/` consume `GameContext` without touching Firestore directly.

**Tech Stack:** JavaScript (ES modules, no TypeScript), React 19, Vite 6, MUI 7 (`@mui/material`, `@mui/icons-material`), `immer`, `recharts`, Firebase JS SDK 11, Node 24 built-in test runner (`node --test`).

**Spec:** [2026-11-15-dashboard-feedback-design.md](../specs/2026-11-15-dashboard-feedback-design.md)

**Global Constraints:**
- Work exclusively in the feature worktree (`/home/jimmy/Projects/heat-is-on-react-feedback`, branch `feat/dashboard-feedback`).
- Keep Bludgeton (`isComparisonTown: true`) locked from playing adaptation cards or manual edits, while removing `"Comparison"` / `"Comparison Town"` UI badges.
- Keep `src/game/*.js` and `src/constants/mediaConfig.js` runnable directly in Node 24 (`node --test`) with explicit `.js` relative imports and guarded `import.meta.env`.
- Do not change `firestore.rules` or Firestore collection names; `card_plays` already permits owner `create`/`update`/`delete` and `towns.effortPoints` permits `0..9999`.
- Verify every task with `npm test`, `npm run lint` (0 errors), and `npm run build` before finishing.

**Review Focus (5 edge/failure cases to guard):**
1. **Unclamped card removal (`revertCardEffects`)**: Removing an earlier card must subtract its exact `effects` (clamped to `[0, 100]`) and refund `card.cost` to `effortPoints` (clamped `>= 0`).
2. **Adding/removing cards in any round (`round <= currentRound`)**: Multi-round cards played in an earlier round must compute `effectiveRounds = cardEffectiveRounds(targetRound, card.duration)` and only set `isActive: true` if `max(effectiveRounds) >= currentRound`, while applying immediate stat effects and deducting EP.
3. **Mystery `?` wheel slice**: Landing on `{ id: "mystery", name: "?", isMystery: true }` must NOT call `applyHazard` or deduct resilience; it displays an informational facilitator banner so the round's event remains manual/optional.
4. **NESH percentage calculation**: Each N, E, S, H percentage is `(sum of 5 hazard values for that aspect) / 5` (`0–100%`), and `NESH Resilience Summary` in `BarChartsView` averages across the 5 non-comparison towns (`!t.isComparisonTown`).
5. **16:9 live projection**: Playing a card or spinning/applying a hazard must NOT open confirmation dialogs or `HazardImpactDialog`, keeping the 6 town NESH wheels visible in the viewport.

**File Structure:**
- Modify: `src/constants/palette.js` (update `healthColor` to `#1B365D`)
- Modify: `src/constants/mediaConfig.js` (add `timeMachineVideo`, `globalScenarioVideo`, `neshExplainerVideo`, `inspiringTasmaniaLogo`, `utasLogo`, `copyrightText` + safe getters)
- Modify: `src/game/wheel.js` (add `WHEEL_SLICES` with 6th `?` mystery slice)
- Modify: `src/game/cards.js` (add `revertCardEffects(town, card)` pure helper)
- Modify: `src/game/summary.js` (add `totalCardsPlayed`, `mostPopularCards`, `eventsTimeline`, `aspectAverages` to `buildGameSummary`)
- Create/Update tests: `src/game/wheel.test.js`, `src/game/cards.test.js`, `src/game/summary.test.js`, `src/constants/mediaConfig.test.js`
- Modify: `src/services/gameSessionService.js` (add `getTownCardPlayDocs`, `removeCardPlay`, round-flexible `targetRound` support in `applyCardToTown`)
- Modify: `src/contexts/GameContext.jsx` (expose `townCardPlayDocs`, `removeCardPlay`, `addCardPlayAtRound`)
- Modify: `src/components/Game/components/StageBar.jsx` (new stage labels/prompts, no subtitles, `Reward for effort`)
- Modify: `src/components/Game/components/DividendsDialog.jsx` (rename Dividends → Reward for effort, remove Comparison chip, Budget → Effort Points)
- Modify: `src/components/Game/components/TownDetailsView.jsx` (Effort Points, remove Hazard Resilience Levels, remove Comparison badge)
- Modify: `src/components/common/Footer.jsx` (Inspiring Tasmania & UTAS logo placeholders, configurable copyrightText)
- Modify: `src/components/Charts/TownPieChart.jsx` (compact ~1:1 card, chunky NESH percentage bars with NESH palette, remove Comparison chip)
- Modify: `src/components/Game/components/TownPieCharts.jsx` (compact 3×2 grid spacing for 16:9)
- Modify: `src/components/Game/components/BarChartsView.jsx` (`NESH Resilience Summary` & `Towns Resilience Summary` in `0–100%` using NESH palette)
- Modify: `src/components/Game/components/CardControls.jsx` (unified 19-card selector, inline layout, no confirmation modal, inline played-card chips with `×` delete)
- Modify: `src/components/Game/components/HazardWheel.jsx` (`340×340` 6-slice SVG wheel with `?` mystery slice)
- Modify: `src/components/Game/components/HazardControls.jsx` (inline 6-slice wheel, mystery banner, no confirmation modal)
- Modify: `src/components/Game/components/GameTable.jsx` (Year headers, no Comparison chip, `×` delete card chip, `+` add card popover per Town × Year)
- Modify: `src/components/Game/components/GameSummaryDialog.jsx` (cards played count, most popular adaptation, Events experienced by Year, updated columns, no Weak Segments / Final Budget / Comparison Town chip)
- Modify: `src/components/Game/index.jsx` (16:9 live projection layout keeping 6 town wheels visible during Adapt/Event, Opening Screen with Time Machine & Global Scenario video placeholders, top-bar Opening Screen & NESH Explainer buttons + modal player, remove `HazardImpactDialog`)

---

### Task 1: Pure Game Rules, Palette & Media Config (+ Unit Tests)

**Files:**
- Modify: `src/constants/palette.js`
- Modify: `src/constants/mediaConfig.js`
- Modify: `src/game/wheel.js`
- Modify: `src/game/cards.js`
- Modify: `src/game/summary.js`
- Test: `src/game/wheel.test.js`, `src/game/cards.test.js`, `src/game/summary.test.js`, `src/constants/mediaConfig.test.js`

- [ ] **Step 1: Update `src/constants/palette.js`**
Change `healthColor` from `"#FFFFFF"` to `"#1B365D"` so Health uses dark blue across NESH bars and `BarChartsView`.

- [ ] **Step 2: Write failing tests for `mediaConfig.js`, `wheel.js`, `cards.js`, and `summary.js`**
  - In `src/constants/mediaConfig.test.js`: assert `MEDIA_CONFIG.timeMachineVideo`, `globalScenarioVideo`, `neshExplainerVideo`, `inspiringTasmaniaLogo`, `utasLogo`, and `copyrightText` exist.
  - In `src/game/wheel.test.js`: assert `WHEEL_SLICES` has 6 items including `{ id: "mystery", name: "?", isMystery: true }` and `spinHazardWheel(WHEEL_SLICES, ...)` can select index 5 (`"mystery"`).
  - In `src/game/cards.test.js`: assert `revertCardEffects(town, card)` subtracts card `effects` clamped to `>= 0` and refunds `card.cost` to `effortPoints`.
  - In `src/game/summary.test.js`: assert `buildGameSummary({ session, towns, events, roundStats, cardPlays })` returns `totalCardsPlayed`, `mostPopularCards`, `eventsTimeline` (with `year` and `hazards`), and per-town `nesh` averages (`nature`, `economy`, `society`, `health`).

- [ ] **Step 3: Run `node --test` to verify the new tests fail before implementation**
Run: `npm test`

- [ ] **Step 4: Implement pure changes in `mediaConfig.js`, `wheel.js`, `cards.js`, and `summary.js`**
  - `src/constants/mediaConfig.js`: add `timeMachineVideo`, `globalScenarioVideo`, `neshExplainerVideo`, `inspiringTasmaniaLogo`, `utasLogo`, `copyrightText` to `MEDIA_CONFIG`.
  - `src/game/wheel.js`: export `WHEEL_SLICES` (the 5 hazards + `{ id: "mystery", name: "?", color: "#546E7A", isMystery: true }`).
  - `src/game/cards.js`: export `revertCardEffects(town, card)` (clamps each aspect in `[0, 100]` and adds `card.cost` to `town.effortPoints`).
  - `src/game/summary.js`: extend `buildGameSummary({ session, towns, events, roundStats, cardPlays = [] })` to compute `totalCardsPlayed`, `mostPopularCards`, `eventsTimeline`, and per-town `nature`/`economy`/`society`/`health` percentages.

- [ ] **Step 5: Run `npm test` and verify all tests pass**
Run: `npm test`

- [ ] **Step 6: Commit Task 1**
```bash
git add src/constants/palette.js src/constants/mediaConfig.js src/constants/mediaConfig.test.js src/game/wheel.js src/game/wheel.test.js src/game/cards.js src/game/cards.test.js src/game/summary.js src/game/summary.test.js
git commit -m "feat: update palette, media placeholders, 6-slice wheel, card revert, and summary stats"
```

---

### Task 2: Firestore Service & GameContext Card History Editing

**Files:**
- Modify: `src/services/gameSessionService.js`
- Modify: `src/contexts/GameContext.jsx`

- [ ] **Step 1: Add `getTownCardPlayDocs`, `removeCardPlay`, and `targetRound` support in `src/services/gameSessionService.js`**
  - `getTownCardPlayDocs(townId)`: returns raw `card_plays` docs for a town (`id`, `cardId`, `playedAtRound`, `effectiveRounds`, `isActive`).
  - `applyCardToTown(sessionId, townId, cardId, { expectedRevision, targetRound } = {})`: allow `targetRound` (default `session.currentRound`, valid `1..session.currentRound`), compute `effectiveRounds = cardEffectiveRounds(roundToRecord, card.duration)`, set `isActive: Math.max(...effectiveRounds) >= session.currentRound`.
  - `removeCardPlay(sessionId, cardPlayId, { expectedRevision } = {})`: inside `runTransaction`, load session + towns + `card_plays/{cardPlayId}`, reject if `town.isComparisonTown`, apply `revertCardEffects(town, card)`, delete `card_plays/{cardPlayId}`, bump `revision` and clear `lastUndo`.

- [ ] **Step 2: Wire `townCardPlayDocs`, `removeCardPlay`, and `addCardPlayAtRound` in `src/contexts/GameContext.jsx`**
  - Load `getTownCardPlayDocs(town.id)` alongside `getTownCardPlays(town.id)` in `loadSession` and after mutations.
  - Expose `townCardPlayDocs`, `removeCardPlay(cardPlayId)`, and `addCardPlayAtRound(townId, cardId, targetRound)` on context value.

- [ ] **Step 3: Run `npm test` and `npm run lint` to verify no regressions**
Run: `npm test && npm run lint`

- [ ] **Step 4: Commit Task 2**
```bash
git add src/services/gameSessionService.js src/contexts/GameContext.jsx
git commit -m "feat: support removing and adding card plays across game history"
```

---

### Task 3: StageBar, DividendsDialog, TownDetailsView & Footer Updates

**Files:**
- Modify: `src/components/Game/components/StageBar.jsx`
- Modify: `src/components/Game/components/DividendsDialog.jsx`
- Modify: `src/components/Game/components/TownDetailsView.jsx`
- Modify: `src/components/common/Footer.jsx`

- [ ] **Step 1: Update `StageBar.jsx`**
  - Set `STAGE_STEPS` to:
    1. `1. Adapt` — `"What adaptations will you choose for your town?"`
    2. `2. Event` — `"Will Adaptania face a climate hazard this year?"`
    3. `3. Review` — `"How resilient is Adaptania now?"`
    4. `4. Reward for effort` — `"Reward for effort"`
  - Remove stage subtitle rendering in `StageBar` so only the stage prompt is shown.
  - Rename `Dividends` button label to `Reward for effort`.

- [ ] **Step 2: Update `DividendsDialog.jsx`**
  - Rename dialog title and copy from `Dividends` to `Reward for effort` and `Current Budget` / `New Budget` to `Current Effort Points` / `New Effort Points`.
  - Remove the `"Comparison"` `<Chip>` next to Bludgeton.

- [ ] **Step 3: Update `TownDetailsView.jsx`**
  - Remove `"Comparison (Locked)"` `<Chip>` from Bludgeton's card header (keep edit controls disabled for `town.isComparisonTown`).
  - Rename `"Budget Points"` → `"Effort Points"`.
  - Remove the `"Hazard Resilience Levels"` section.

- [ ] **Step 4: Update `Footer.jsx`**
  - Replace/configure logos with `MEDIA_CONFIG.inspiringTasmaniaLogo` ("Inspiring Tasmania" placeholder) and `MEDIA_CONFIG.utasLogo` ("UTAS" placeholder), and render `MEDIA_CONFIG.copyrightText`.

- [ ] **Step 5: Run `npm run lint && npm run build`**

- [ ] **Step 6: Commit Task 3**
```bash
git add src/components/Game/components/StageBar.jsx src/components/Game/components/DividendsDialog.jsx src/components/Game/components/TownDetailsView.jsx src/components/common/Footer.jsx
git commit -m "feat: update StageBar prompts, Reward for effort terminology, TownDetailsView, and Footer"
```

---

### Task 4: Compact 1:1 TownPieChart Cards, Chunky NESH Bars & Percentage BarChartsView

**Files:**
- Modify: `src/components/Charts/TownPieChart.jsx`
- Modify: `src/components/Game/components/TownPieCharts.jsx`
- Modify: `src/components/Game/components/BarChartsView.jsx`

- [ ] **Step 1: Update `TownPieChart.jsx`**
  - Remove `"Comparison"` `<Chip>` from Bludgeton's card header.
  - Make card compact and ~1:1 (`width: "100%"`, `maxWidth: 260`, `height: 260` / `aspectRatio: "1 / 1"`), scaling the SVG pie chart accordingly so 3×2 fits a 16:9 screen.
  - Replace the back-of-card progress bars with chunky horizontal NESH bars (`height: 20`, `borderRadius: 1`) for Nature (`natureColor`), Economy (`economyColor`), Society (`societyColor`), and Health (`healthColor`), displaying `0–100%` (`sum / 5`).

- [ ] **Step 2: Update `TownPieCharts.jsx`**
  - Tighten grid spacing (`spacing={2}`) and remove verbose instructional banner if space is needed so the 3×2 grid fits cleanly alongside controls in 16:9.

- [ ] **Step 3: Update `BarChartsView.jsx`**
  - Rename `"Aspects Summary"` → `"NESH Resilience Summary"` and compute each N, E, S, H bar as `0–100%` averaged across the 5 non-comparison towns (`!t.isComparisonTown`), colored with `natureColor`, `economyColor`, `societyColor`, `healthColor`.
  - Rename `"Towns Summary"` → `"Towns Resilience Summary"` and display each town's overall average resilience (`0–100%`).

- [ ] **Step 4: Run `npm run lint && npm run build`**

- [ ] **Step 5: Commit Task 4**
```bash
git add src/components/Charts/TownPieChart.jsx src/components/Game/components/TownPieCharts.jsx src/components/Game/components/BarChartsView.jsx
git commit -m "feat: compact 1:1 TownPieChart cards with chunky NESH bars and percentage BarChartsView"
```

---

### Task 5: Inline 19-Card Selector, 340×340 6-Slice Hazard Wheel & GameTable History Editing

**Files:**
- Modify: `src/components/Game/components/CardControls.jsx`
- Modify: `src/components/Game/components/HazardWheel.jsx`
- Modify: `src/components/Game/components/HazardControls.jsx`
- Modify: `src/components/Game/components/GameTable.jsx`

- [ ] **Step 1: Update `CardControls.jsx`**
  - Merge `cards` (15) and `allAbilityCards` (4) into a single unified 19-card selector (removing the 2-tab split).
  - Remove the `"Are you sure?"` confirmation `<Dialog>` — clicking **Play Card** applies immediately so the 6 town NESH wheels remain unobstructed.
  - Show current round's played cards for the selected town as compact chips with `×` delete buttons wired to `removeCardPlay`.

- [ ] **Step 2: Update `HazardWheel.jsx`**
  - Enlarge SVG to `340×340` (`viewBox="0 0 340 340"`, `cx = 170`, `cy = 170`, `radius = 152`).
  - Render 6 slices using `WHEEL_SLICES` (5 hazards + `?` mystery slice in `#546E7A` with larger `?` label).
  - Update caption to reflect immediate/mystery behavior without confirmation modal phrasing.

- [ ] **Step 3: Update `HazardControls.jsx`**
  - Pass `WHEEL_SLICES` into `HazardWheel`.
  - Remove the `"Are you sure?"` confirmation `<Dialog>` — spinning onto a hazard applies it immediately (or clicking a manual hazard button applies immediately).
  - When the wheel lands on `mystery` (`isMystery: true`), show a clear informational banner (*"Mystery event (`?`) — no automatic hazard applied. Facilitator may discuss or choose a hazard manually."*) instead of calling `applyHazard`.

- [ ] **Step 4: Update `GameTable.jsx`**
  - Remove `"Comparison"` `<Chip>` from Bludgeton's row.
  - Label round columns as `Year 2051`, `Year 2052`, ... (`Year ${2050 + round}`).
  - Render played cards from `townCardPlayDocs[town.id]` with an `×` delete button on each chip (`onDelete` → `removeCardPlay(play.id)`) for non-comparison towns.
  - Add a compact `+` button in each non-comparison Town × Year cell (`round <= currentRound`) that opens a lightweight `<Popover>`/`<Menu>` to add any of the 19 cards at that round via `addCardPlayAtRound(town.id, cardId, round)`.

- [ ] **Step 5: Run `npm run lint && npm run build`**

- [ ] **Step 6: Commit Task 5**
```bash
git add src/components/Game/components/CardControls.jsx src/components/Game/components/HazardWheel.jsx src/components/Game/components/HazardControls.jsx src/components/Game/components/GameTable.jsx
git commit -m "feat: unified 19-card selector, 340x340 6-slice hazard wheel, no blocking modals, and GameTable editing"
```

---

### Task 6: GameSummaryDialog & 16:9 Live Projection Layout + Opening Screen / NESH Explainer

**Files:**
- Modify: `src/components/Game/components/GameSummaryDialog.jsx`
- Modify: `src/components/Game/index.jsx`

- [ ] **Step 1: Update `GameSummaryDialog.jsx`**
  - Express duration as `"over X years"`.
  - Add total adaptation cards played stat and **"Most popular climate adaptation"** highlight card alongside **Most resilient town** and **Most impacted town**.
  - Add **"Events experienced"** timeline showing `Year 2051: <Hazard>`, etc.
  - Update table columns to: **Town**, **Average Resilience** (`%`), **Nature** (`%`), **Economy** (`%`), **Society** (`%`), **Health** (`%`), **Hazard impact**, **Reward for effort** (`+X EP`). Remove **Weak Segments (≤20)**, **Final Budget**, **"Every town including Bludgeton"** subtitle, and **"Comparison Town"** chip.

- [ ] **Step 2: Update `Game/index.jsx`**
  - **16:9 Live Projection Layout:** During active gameplay (`currentRound >= 1 && !showOpeningScreen`), keep the **6 Town NESH wheels** (`TownPieCharts`) visible on the main canvas at all times while `CardControls` (Adapt) or `HazardControls` (Event) sit in a side/top live-projection panel (on desktop/16:9 `md+` side-by-side or compact top strip + 3×2 grid). Keep `BarChartsView` and `GameTable` accessible via tabs or secondary view toggle.
  - **Remove `HazardImpactDialog`:** Remove the post-hazard blocking modal and `impactDialogEvent` state; hazard impacts reflect live in the 6 NESH wheels and `lastEventBanner`.
  - **Opening Screen (`currentRound === 0 || showOpeningScreen`):** Remove `01/02/03` stage text bullets; render icon-and-title cards for **Time Machine** (`MEDIA_CONFIG.timeMachineVideo`) and **Global Scenario** (`MEDIA_CONFIG.globalScenarioVideo`) opening the video modal player, plus **Start Game** (or **Return to Game** when already started).
  - **Top AppBar:** Add **Opening Screen** button and **NESH Explainer** button (opens modal `<video>` player for `MEDIA_CONFIG.neshExplainerVideo`).

- [ ] **Step 3: Run full verification suite**
Run: `npm test && npm run lint && npm run build`

- [ ] **Step 4: Commit Task 6**
```bash
git add src/components/Game/components/GameSummaryDialog.jsx src/components/Game/index.jsx
git commit -m "feat: 16:9 live projection layout, updated GameSummaryDialog, opening video placeholders, and NESH explainer"
```
