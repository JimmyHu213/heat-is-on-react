# Facilitated Flow UI (PR 3 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the facilitated workshop UI on top of the pure game rules (PR 1) and transactional persistence (PR 2): new-game configuration, guided round stages (`Adapt → Event → Review → Dividends`), cryptographically fair hazard wheel, hazard impact report dialog, round dividends settlement dialog, end-game-early flow, end-of-game summary dialog, flippable town cards in Review, comparison-town lock, normalized JSON/Excel export, and single-function CCS lifecycle hooks.

**Architecture:**
1. Pure helpers (`src/game/wheel.js` and `src/services/gameLifecycle.js`) provide uniform `crypto.getRandomValues` hazard selection and the two CCS lifecycle hook points (`onGameCreated`, `onGameCompleted`) that `gameSessionService` calls after session creation and completion.
2. `GameContext` loads and updates `roundEventDocs` and `roundStats` alongside `currentSession` and `towns`, and exposes `clearLastHazardImpact()` so the summary and dialogs always have fresh data.
3. Focused MUI components under `src/components/Game/components/` (`StageBar`, `HazardWheel`, `HazardImpactDialog`, `DividendsDialog`, `EndEarlyDialog`, `GameSummaryDialog`) and `src/components/Dashboard/NewGameDialog.jsx` wire the facilitated round flow into `Dashboard` and `Game`, while `TownPieChart`, `TownDetailsView`, `GameTable`, and `exportService` are updated to support flip cards, comparison-town display, dynamic round counts (`1–20`), and normalized optional fields.

**Tech Stack:** JavaScript ES modules, React 19, MUI 7 (`@mui/material`, `@mui/icons-material`), Recharts 2, Web Crypto API (`crypto.getRandomValues`), Node 24 built-in test runner (`node:test`, `node:assert/strict`).

**Spec:** `docs/superpowers/specs/2026-11-11-facilitated-game-flow-design.md`

## Global Constraints

- Browser-only SPA; all Firestore access stays in `src/services/*`. Components call context functions, never Firestore directly.
- Relative imports in `src/game/` and `scripts/` must include explicit `.js` extensions for Node execution.
- When creating a game, the facilitator chooses `totalRounds` (`1–20`, default `5`), `digitalWheelEnabled` (boolean, default `true`), and optional `playerCount` (`1–200`, blank allowed → `null`). `totalRounds` and `digitalWheelEnabled` are fixed once the game starts (`currentRound >= 1`); `playerCount` can be edited until the game completes (`isActive === false`).
- Every round moves through `Adapt → Event → Review → Dividends` (`stage` stored as `"adaptation" | "hazard" | "review" | "complete"`). `Dividends` is the closing dialog of `Review`, not a stored stage: clicking *Settle Round* opens the dividends dialog, and confirming it settles the round.
- Stage transitions enforced in both UI and rules:
  - Cards can only be played in `adaptation`; hazards can only be applied in `hazard`.
  - `hazard -> review` requires at least 1 hazard applied in the current round (`hazardCountThisRound >= 1`).
  - Stepping back: `review -> hazard` is allowed when `hazardCountThisRound < 5`; `hazard -> adaptation` is allowed only when `hazardCountThisRound === 0`.
- Comparison town (`Bludgeton`, `isComparisonTown === true`) cannot play adaptation cards and cannot have its name or budget manually edited, but receives hazards and dividends and is shown in charts, tables, and the summary (labelled as the comparison town, excluded from *Most Resilient* and *Most Impacted* highlights).
- Hazard wheel has 5 equal sections (`bushfire`, `flood`, `stormSurge`, `heatwave`, `biohazard`) chosen uniformly with `crypto.getRandomValues`. Spinning the wheel only *selects* a hazard; applying it is a separate confirmed step. When `digitalWheelEnabled === false`, the wheel is hidden and the facilitator picks a hazard directly from the list.
- After a hazard is applied, `HazardImpactDialog` shows per town: points lost per dimension (`nature`, `economy`, `society`, `health`) summed over all hazard types, total points lost, and overall resilience `before → after`.
- `DividendsDialog` previews each town's segments at 100 (`countSegments(town, s => s === 100)`) and dividend (`5 EP` per segment at 100). After confirming (or if reopened when `currentSession.lastSettlementRound === round`), it shows `"Already awarded"` and disables the confirm button so dividends can never be paid twice.
- From `currentRound >= 1` while `currentSession.isActive`, the facilitator can click *End Game Early*, which settles the current round (with dividends) via `settleRound({ endEarly: true })`, sets `endedEarly: true`, and opens the end-of-game summary.
- `GameSummaryDialog` uses `buildGameSummary({ session, towns, events, roundStats })` from `src/game/summary.js` to show per town: final overall resilience, N/E/S/H averages, weak segments (`≤ 20`), total event losses, total dividends earned, and final EP, plus *Most Resilient* and *Most Impacted* highlights (omitting *Most Impacted* when `!summary.hasCompleteImpacts`). It opens automatically when a game completes and can be reopened any time on a completed game.
- Missing optional fields have one meaning everywhere (`getTotalRounds(session)` → `5`, `session.digitalWheelEnabled ?? true` → `true`, `getPlayerCount(session)` → `null`), including in `GameTable` and `exportService`.
- PR 3 adds a single function per lifecycle point (`onGameCreated(session)` and `onGameCompleted(session, summaryData)`) in `src/services/gameLifecycle.js` that CCS can later hook to write `game_runs`.
- Remove unused `immer` from `package.json` (`CLAUDE.md` / Spec: *"No leftover code: anything this work makes unused is removed, including `immer` if the old revert history goes"*).

## Review Focus

1. **Double-confirming dividends in `DividendsDialog`:** Clicking *Confirm & Award Dividends* while a settlement transaction is in flight or when `roundStats` already has an entry for that round must disable the button and show `"Already awarded"`, never calling `settleRound` twice. *(Tasks 1, 5)*
2. **Rejection sampling bias / modulo bias in `spinHazardWheel`:** Using `Uint32Array(1)` with `crypto.getRandomValues` must reject values `>= 0x100000000 - (0x100000000 % count)` so all 5 hazards are selected with exact uniform probability, and throw if `items` is empty. *(Task 1)*
3. **Exporting a variable-length or legacy game (`totalRounds !== 5` or missing optional fields):** `exportService.getSessionDataPackage` must iterate up to `Math.max(session.currentRound, getTotalRounds(session))` (or rounds played) rather than hardcoding `5`, and must normalize `totalRounds`, `digitalWheelEnabled`, `playerCount`, `endedEarly`, `impactPoints`, and `dividends` so legacy and 20-round sessions export cleanly. *(Task 2)*
4. **Stepping back stages in UI when hazards exist vs. 0 hazards:** In `StageBar`, the *Back to Adapt* button in `hazard` stage must be disabled as soon as `hazardCountThisRound >= 1`, and *Next: Review* in `hazard` stage must be disabled when `hazardCountThisRound === 0`, matching `canChangeStage`. *(Task 4)*
5. **Reopening a completed game or ending early from `Adapt`:** Loading a completed game (`!currentSession.isActive`) must show the `Complete` state, disable all move controls, and let the facilitator open `GameSummaryDialog` with stored `roundEventDocs` and `roundStats`. Ending early from `adaptation` or `hazard` must settle the current round (paying dividends) and transition straight to `complete` + summary. *(Tasks 3, 5, 6)*

## File Structure

| File | Responsibility |
|---|---|
| `src/game/wheel.js` | Pure uniform random selection (`pickRandomIndex`, `spinHazardWheel`) using Web Crypto `crypto.getRandomValues` with rejection sampling |
| `src/game/wheel.test.js` | Unit tests for `pickRandomIndex` and `spinHazardWheel` (uniformity, rejection of biased high values, custom RNG injection) |
| `src/services/gameLifecycle.js` | Single-function lifecycle hooks `onGameCreated(session)` and `onGameCompleted(session)` for CCS integration |
| `src/services/gameLifecycle.test.js` | Unit tests for lifecycle hook registration and invocation |
| `src/services/gameSessionService.js` | Calls `onGameCreated` at end of `createSession` and `onGameCompleted` when `settleRound` marks `isComplete: true` |
| `src/services/exportService.js` | Normalizes optional session/event/stats fields (`totalRounds`, `digitalWheelEnabled`, `playerCount`, `endedEarly`, `impactPoints`, `dividends`) and supports `1–20` rounds |
| `src/services/exportService.test.js` | Unit tests for export normalization helper |
| `src/contexts/GameContext.jsx` | Tracks `roundEventDocs` and `roundStats` in state, refreshes them on load/hazard/settle/undo, and exposes `clearLastHazardImpact` |
| `src/components/Dashboard/NewGameDialog.jsx` | Modal dialog to configure session name, `totalRounds` (`1–20`), `digitalWheelEnabled` switch, and optional `playerCount` (`1–200`) |
| `src/components/Dashboard/index.jsx` | Opens `NewGameDialog` on *New Game*, displays round progress (`Round X / Y`), stage chip, and player count on session cards |
| `src/components/Game/components/StageBar.jsx` | Prominent workshop stage indicator (`Setup` / `Adapt → Event → Review → Dividends` / `Complete`) with stage-transition buttons, *End Game Early* trigger, *View Summary* button, and editable `playerCount` badge |
| `src/components/Game/components/HazardWheel.jsx` | SVG 5-slice spinning wheel (`crypto.getRandomValues`) that selects a hazard, plus a confirmation step to apply it |
| `src/components/Game/components/HazardControls.jsx` | Integrates `HazardWheel` when `digitalWheelEnabled !== false` and direct hazard list selection when `digitalWheelEnabled === false`, gated to the `hazard` stage |
| `src/components/Game/components/HazardImpactDialog.jsx` | Post-hazard dialog showing per-town N/E/S/H losses, total loss, and overall resilience `before → after` |
| `src/components/Game/components/DividendsDialog.jsx` | Round settlement dialog showing each town's segments at 100, dividend EP (`× 5`), and `"Already awarded"` guard |
| `src/components/Game/components/EndEarlyDialog.jsx` | Confirmation dialog for ending the game early from round `≥ 1` (explaining that the current round will be settled with dividends) |
| `src/components/Game/components/GameSummaryDialog.jsx` | End-of-game summary dialog powered by `buildGameSummary`, highlighting *Most Resilient* and *Most Impacted* towns and marking Bludgeton as the comparison town |
| `src/components/Charts/TownPieChart.jsx` | Adds flippable front/back view (pie chart on front; overall resilience, N/E/S/H averages, weak segment count, EP, and comparison badge on back) |
| `src/components/Game/components/TownPieCharts.jsx` | Adds *"Flip All Cards"* / *"Show Charts"* toggle (highlighted during `review` stage) and passes flip state to each `TownPieChart` |
| `src/components/Game/components/TownDetailsView.jsx` | Displays all 6 towns including Bludgeton with a locked `"Comparison Town (Read-Only)"` badge, and clamps manual budget input to `0–999` |
| `src/components/Game/components/GameTable.jsx` | Renders `1..getTotalRounds(session)` columns dynamically and includes Bludgeton (`Comparison`) row |
| `src/components/Game/index.jsx` | Orchestrates `StageBar`, stage-gated `Drawer` controls, `HazardImpactDialog`, `DividendsDialog`, `EndEarlyDialog`, and `GameSummaryDialog`, and deletes unused legacy layout files (`GameLayout.jsx`, `GameSidebar.jsx`, `GameTabs.jsx`, `TabPanels.jsx`) and unused `immer` dependency |

---

### Task 1: Pure hazard wheel RNG (`src/game/wheel.js`) and CCS lifecycle hooks (`src/services/gameLifecycle.js`)

**Files:**
- Create: `src/game/wheel.js`
- Create: `src/game/wheel.test.js`
- Create: `src/services/gameLifecycle.js`
- Create: `src/services/gameLifecycle.test.js`
- Modify: `src/services/gameSessionService.js`
- Modify: `package.json` (remove unused `"immer"` dependency)

**Interfaces:**
- Produces in `src/game/wheel.js`:
  - `pickRandomIndex(count, getRandomUint32)`: returns a uniform integer in `0 .. count - 1` using rejection sampling over 32-bit unsigned integers (`limit = 0x100000000 - (0x100000000 % count)`). Default `getRandomUint32` uses `globalThis.crypto.getRandomValues(new Uint32Array(1))[0]`. Throws `RangeError` if `!Number.isInteger(count) || count <= 0`.
  - `spinHazardWheel(hazardList = HAZARD_IDS, getRandomUint32)`: returns `{ index, hazardId, rotationDegrees }` where `index = pickRandomIndex(hazardList.length, getRandomUint32)`, `hazardId` is `typeof item === "string" ? item : item.id`, and `rotationDegrees` lands in the center of slice `index` after 5 full turns (`360 * 5 + (360 - (index * (360 / count) + 360 / count / 2))`).
- Produces in `src/services/gameLifecycle.js`:
  - `onGameCreated(session): Promise<void>` — single lifecycle hook called when a session is created (no-op by default; invokes any registered listener).
  - `onGameCompleted(session): Promise<void>` — single lifecycle hook called when `settleRound` completes a game (`isActive === false`).
  - `registerGameLifecycleHooks({ onCreated, onCompleted })` — allows CCS integration or tests to register callbacks.

- [ ] **Step 1: Write failing unit tests in `src/game/wheel.test.js` and `src/services/gameLifecycle.test.js`**
  Test cases:
  - `pickRandomIndex(5, rng)` rejects values `>= 4294967295` (`0x100000000 - (0x100000000 % 5)`) and maps `0..4` uniformly.
  - `pickRandomIndex(0)` throws `RangeError`.
  - `spinHazardWheel` returns `{ index, hazardId, rotationDegrees }` for both string arrays (`HAZARD_IDS`) and object arrays (`hazards`).
  - `onGameCreated` and `onGameCompleted` invoke registered hooks without throwing when no hook is registered.
- [ ] **Step 2: Run `npm test` to verify it fails**
  Run: `npm test`
  Expected: FAIL (`Cannot find module './wheel.js'`).
- [ ] **Step 3: Implement `src/game/wheel.js`, `src/services/gameLifecycle.js`, wire into `src/services/gameSessionService.js`, and remove `immer` from `package.json`**
  - In `src/services/gameSessionService.js`: call `await onGameCreated({ ...session, towns: sessionTowns })` before returning from `createSession`, and call `await onGameCompleted(committed)` when `committed.isActive === false` after `settleRound`'s transaction resolves.
  - Run `npm uninstall immer` (or remove `"immer"` from `package.json`).
- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm test && npm run lint`
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add src/game/wheel.js src/game/wheel.test.js src/services/gameLifecycle.js src/services/gameLifecycle.test.js src/services/gameSessionService.js package.json package-lock.json && git commit -m "feat: add crypto hazard wheel RNG and CCS lifecycle hooks"`

---

### Task 2: Normalize optional fields in `exportService` and expand `GameContext` state for summary/dialogs

**Files:**
- Modify: `src/services/exportService.js`
- Create: `src/services/exportService.test.js`
- Modify: `src/contexts/GameContext.jsx`

**Interfaces:**
- Produces in `src/services/exportService.js`:
  - Named export `normalizeSessionForExport(session, roundEvents = [], roundStats = [])`: pure helper that normalizes a session and its round records so missing optional fields have one meaning everywhere:
    - `totalRounds: getTotalRounds(session)` (`5` if missing)
    - `digitalWheelEnabled: session.digitalWheelEnabled ?? true`
    - `playerCount: getPlayerCount(session)` (`null` if missing)
    - `endedEarly: session.endedEarly === true`
    - `stage: getStage(session, currentRoundHazards.length)`
    - `roundsToExport`: `Math.max(0, session.isActive ? session.currentRound : session.currentRound - 1)`
    - Each round event includes `impactPoints: event.impactPoints ?? null`, `impactComplete: event.impactPoints != null && event.impactComplete !== false`, `dividends: statsForRound?.dividends ?? null`.
  - Updates `getSessionDataPackage(sessionId)` and `downloadAsExcel(data, filename)` to use `normalizeSessionForExport` and include `totalRounds`, `playerCount`, `digitalWheelEnabled`, `endedEarly`, `dividends`, and `impactPoints` across all played rounds (supporting `1–20` rounds instead of hardcoded `5`).
- Produces in `src/contexts/GameContext.jsx`:
  - `roundEventDocs`: array of raw `round_events` documents (`gameSessionService.getSessionRoundEventDocs(sessionId)`)
  - `roundStats`: array of `round_stats` documents (`gameSessionService.getSessionRoundStats(sessionId)`)
  - `clearLastHazardImpact()`: sets `lastHazardImpact(null)`
  - Updates `loadSession`, `applyHazard`, `settleRound`, and `revertToPreviousState` so `roundEventDocs` and `roundStats` stay in sync with every move.

- [ ] **Step 1: Write failing unit tests in `src/services/exportService.test.js`**
  Test cases:
  - Legacy session without `totalRounds`, `digitalWheelEnabled`, `playerCount`, or `endedEarly` normalizes to `{ totalRounds: 5, digitalWheelEnabled: true, playerCount: null, endedEarly: false }`.
  - Completed 2-round session (`currentRound: 3, totalRounds: 2, isActive: false`) exports rounds `1..2` (not 5) and includes `dividends` and `impactPoints`.
  - Completed early-ended 10-round session (`currentRound: 4, totalRounds: 10, isActive: false, endedEarly: true`) exports rounds `1..3` with `endedEarly: true`.
- [ ] **Step 2: Run `npm test` to verify it fails**
  Run: `npm test src/services/exportService.test.js`
  Expected: FAIL (`normalizeSessionForExport` not exported).
- [ ] **Step 3: Implement `normalizeSessionForExport` in `src/services/exportService.js` and update `src/contexts/GameContext.jsx`**
  Ensure `exportService.js` uses explicit `.js` imports so it can be imported in Node unit tests.
- [ ] **Step 4: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add src/services/exportService.js src/services/exportService.test.js src/contexts/GameContext.jsx && git commit -m "feat: normalize export fields and track round stats and event docs in GameContext"`

---

### Task 3: New Game Options Dialog (`NewGameDialog.jsx`) and Dashboard updates

**Files:**
- Create: `src/components/Dashboard/NewGameDialog.jsx`
- Modify: `src/components/Dashboard/index.jsx`

**Interfaces:**
- `NewGameDialog({ open, onClose, onCreate, loading })`:
  - Form fields:
    - `name`: text input (default `"New Game"`, max 100 chars)
    - `totalRounds`: integer input `1–20` (default `5`)
    - `digitalWheelEnabled`: Switch (default `true`, label `"Use on-screen hazard wheel"`)
    - `playerCount`: optional integer input `1–200` (blank allowed → `null`, label `"Number of players (optional)"`)
  - Validates with `validateGameOptions` before calling `onCreate(name, { totalRounds, digitalWheelEnabled, playerCount })`.
- `Dashboard`:
  - Clicking *New Game* opens `NewGameDialog`.
  - Session cards show:
    - Round progress using `getTotalRounds(session)`: e.g. `Setup (0 / 5 rounds)` when `currentRound === 0`, `Round 2 of 5` when active, or `Completed (2 of 2 rounds)` / `Ended early (2 of 5 rounds)` when `!session.isActive`.
    - Stage chip on active sessions (`Setup`, `Adapt`, `Event`, `Review`).
    - Player count if set (`Players: 18`).

- [ ] **Step 1: Create `src/components/Dashboard/NewGameDialog.jsx` and wire it into `src/components/Dashboard/index.jsx`**
- [ ] **Step 2: Verify lint, build, and unit tests**
  Run: `npm test && npm run lint && npm run build`
  Expected: 0 errors, build succeeds.
- [ ] **Step 3: Commit**
  `git add src/components/Dashboard/NewGameDialog.jsx src/components/Dashboard/index.jsx && git commit -m "feat: add NewGameDialog with round count, wheel toggle, and player count"`

---

### Task 4: StageBar, HazardWheel, and stage-gated HazardControls / CardControls

**Files:**
- Create: `src/components/Game/components/StageBar.jsx`
- Create: `src/components/Game/components/HazardWheel.jsx`
- Modify: `src/components/Game/components/HazardControls.jsx`
- Modify: `src/components/Game/components/CardControls.jsx`

**Interfaces:**
- `StageBar({ session, currentRound, currentStage, hazardCountThisRound, loading, onStartGame, onChangeStage, onOpenDividends, onOpenEndEarly, onOpenSummary, onUpdatePlayerCount })`:
  - Displays current round (`Round X of Y`, Year `2050 + currentRound`) and the 4 facilitated round stages (`1. Adapt`, `2. Event`, `3. Review`, `4. Dividends`) as a clear stepper/banner visible to the room.
  - Primary action button per stage:
    - `setup` (`currentRound === 0`): **Start Game** (`onStartGame`)
    - `adaptation`: **Next: Event Stage** (`onChangeStage("hazard")`)
    - `hazard`: **Next: Review Stage** (`onChangeStage("review")`, disabled when `hazardCountThisRound === 0`, with helper tooltip `"Apply at least one hazard first"`) and secondary **Back to Adapt** (`onChangeStage("adaptation")`, enabled only when `hazardCountThisRound === 0`)
    - `review`: **Settle Round & Dividends** (`onOpenDividends`) and secondary **Back to Event** (`onChangeStage("hazard")`, enabled when `hazardCountThisRound < 5`)
    - `complete`: **View Game Summary** (`onOpenSummary`)
  - When `session?.isActive && currentRound >= 1`, shows an **End Game Early** button (`onOpenEndEarly`) and an editable **Players** chip/popover (`onUpdatePlayerCount`).
- `HazardWheel({ hazards, disabled, onSelectHazard })`:
  - Renders a 5-slice SVG wheel using each hazard's palette color and name.
  - Clicking **Spin Wheel** calls `spinHazardWheel(hazards)` from `src/game/wheel.js`, animates CSS `transform: rotate(${rotationDegrees}deg)` (`transition: transform 2.5s cubic-bezier(0.15, 0.85, 0.25, 1)`), and after the spin finishes calls `onSelectHazard(selectedHazard)` so the facilitator confirms applying it in a separate step.
- `HazardControls({ onApplyHazard, disabled, currentRound, currentStage, digitalWheelEnabled = true, hazardCountThisRound = 0 })`:
  - Gated to `currentStage === "hazard"` and `hazardCountThisRound < 5`. Shows a clear notice when not in the `Event` stage.
  - Shows how many hazards have been applied this round (`${hazardCountThisRound} / 5 applied this round`).
  - When `digitalWheelEnabled !== false`, renders `HazardWheel` (plus a fallback *"Or pick hazard manually"* selector); when `digitalWheelEnabled === false`, renders the direct hazard buttons for entering a physical wheel result.
  - Selecting a hazard (via wheel spin or button click) opens the confirmation card/dialog; clicking **Confirm & Apply Hazard** calls `onApplyHazard(selectedHazard.id)`.
- `CardControls({ towns, onPlayCard, disabled, currentRound, currentStage })`:
  - Gated to `currentStage === "adaptation"`; shows a clear notice when not in the `Adapt` stage.
  - Filters out `town.isComparisonTown` (Bludgeton) and shows a short note that Bludgeton is the locked comparison town.

- [ ] **Step 1: Implement `StageBar.jsx`, `HazardWheel.jsx`, and update `HazardControls.jsx` and `CardControls.jsx`**
- [ ] **Step 2: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: 0 errors, build succeeds.
- [ ] **Step 3: Commit**
  `git add src/components/Game/components/StageBar.jsx src/components/Game/components/HazardWheel.jsx src/components/Game/components/HazardControls.jsx src/components/Game/components/CardControls.jsx && git commit -m "feat: add StageBar, HazardWheel, and stage-gated controls"`

---

### Task 5: Facilitated Flow Dialogs (`HazardImpactDialog`, `DividendsDialog`, `EndEarlyDialog`, `GameSummaryDialog`)

**Files:**
- Create: `src/components/Game/components/HazardImpactDialog.jsx`
- Create: `src/components/Game/components/DividendsDialog.jsx`
- Create: `src/components/Game/components/EndEarlyDialog.jsx`
- Create: `src/components/Game/components/GameSummaryDialog.jsx`

**Interfaces:**
- `HazardImpactDialog({ open, onClose, impact, towns, hazardId })`:
  - Displays the applied hazard name and a table of all 6 towns (marking Bludgeton with a `Comparison` chip).
  - Columns: Town, Nature Loss, Economy Loss, Society Loss, Health Loss, Total Points Lost (`item.loss`), Overall Resilience (`${item.before.toFixed(1)}% → ${item.after.toFixed(1)}%`).
- `DividendsDialog({ open, onClose, onConfirm, towns, currentRound, totalRounds, session, roundStats, loading })`:
  - Computes each town's dividend preview via `calculateDividend(town)` (`segments` at 100, `amount = segments * 5` EP, and projected EP `town.effortPoints + amount`).
  - Checks whether `currentRound` is already settled (`session?.lastSettlementRound === currentRound || roundStats?.some(s => s.roundNumber === currentRound)`).
  - If already settled, displays an `<Alert severity="info">Dividends for Round {currentRound} have already been awarded.</Alert>` and hides/disables the confirm button so dividends can never be paid twice.
  - Otherwise, clicking **Confirm & Award Dividends** (or **Award Dividends & Finish Game** on the final round) calls `onConfirm()`.
- `EndEarlyDialog({ open, onClose, onConfirm, currentRound, totalRounds, towns, loading })`:
  - Explains that ending the game early at Round `currentRound` of `totalRounds` will settle Round `currentRound` (awarding dividends for segments at 100) and complete the game with `endedEarly` recorded.
  - Shows the dividend preview table and a **Settle Round & End Game** confirmation button.
- `GameSummaryDialog({ open, onClose, session, towns, roundEventDocs, roundStats })`:
  - Computes `summary = buildGameSummary({ session, towns, events: roundEventDocs, roundStats })`.
  - Shows session metadata (`roundsPlayed` of `totalRounds`, `"Ended Early"` chip if `summary.endedEarly`, player count if present).
  - Highlights:
    - **Most Resilient Town(s):** names of all towns in `summary.mostResilient` (never Bludgeton).
    - **Most Impacted Town(s):** names of all towns in `summary.mostImpacted` when `summary.hasCompleteImpacts` is `true`; omitted (with a subtle note for legacy games) when `!summary.hasCompleteImpacts`.
  - Table of all 6 towns (`summary.towns`): Town (with `Comparison Town` chip on Bludgeton), Final Resilience (`row.resilience.toFixed(1)%`), Nature / Economy / Society / Health averages (`row.nesh.*`), Weak Segments (`≤ 20`, `row.weakSegments`), Total Event Losses (`row.eventLoss`), Total Dividends Earned (`+{row.dividends} EP`), Final Budget (`row.effortPoints EP`).

- [ ] **Step 1: Create `HazardImpactDialog.jsx`, `DividendsDialog.jsx`, `EndEarlyDialog.jsx`, and `GameSummaryDialog.jsx`**
- [ ] **Step 2: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: 0 errors, build succeeds.
- [ ] **Step 3: Commit**
  `git add src/components/Game/components/HazardImpactDialog.jsx src/components/Game/components/DividendsDialog.jsx src/components/Game/components/EndEarlyDialog.jsx src/components/Game/components/GameSummaryDialog.jsx && git commit -m "feat: add hazard impact, dividends, end-early, and game summary dialogs"`

---

### Task 6: Flippable Town Cards, Comparison-Town Lock, Dynamic GameTable, and Main Game Wiring

**Files:**
- Modify: `src/components/Charts/TownPieChart.jsx`
- Modify: `src/components/Game/components/TownPieCharts.jsx`
- Modify: `src/components/Game/components/TownDetailsView.jsx`
- Modify: `src/components/Game/components/GameTable.jsx`
- Modify: `src/components/Game/index.jsx`
- Delete: `src/components/Game/layout/GameLayout.jsx`, `src/components/Game/components/GameSidebar.jsx`, `src/components/Game/components/GameTabs.jsx`, `src/components/Game/components/TabPanels.jsx`

**Interfaces:**
- `TownPieChart({ town, flipped, onToggleFlip })`:
  - Clicking the card or its flip icon toggles between:
    - **Front:** the 20-segment radial resilience pie chart, town name, `Comparison` badge (if `town.isComparisonTown`), and current `effortPoints` badge (`${town.effortPoints} EP`).
    - **Back:** uses `overallResilience(town)`, `neshAverages(town)`, and `countSegments(town, s => s <= WEAK_SEGMENT_MAX)` from `src/game/scores.js` to display overall resilience %, N/E/S/H average bars (`Nature`, `Economy`, `Society`, `Health`), weak segments (`≤ 20`), segments at `100` (dividend-ready), and budget (`effortPoints EP`).
- `TownPieCharts({ towns, currentStage })`:
  - Toolbar above the town grid with a **Flip All to Averages** / **Flip All to Charts** button so the facilitator can flip all 6 town cards at once during the `Review` stage, plus individual card flipping.
- `TownDetailsView({ towns, onUpdateTownName, disabled })`:
  - Shows all 6 towns (including Bludgeton).
  - For Bludgeton (`town.isComparisonTown`), displays a `"Comparison Town (Locked)"` chip and hides the name and budget edit buttons.
  - For regular towns, clamps budget input to `0–999` (`MAX_MANUAL_BUDGET`) and disables budget editing when `disabled` (e.g. completed game).
- `GameTable({ towns, roundEvents, townCardPlays, currentRound, totalRounds = 5 })`:
  - Renders columns `1 .. totalRounds` dynamically instead of hardcoded `5`.
  - Includes all 6 towns in the table, labelling Bludgeton with a `Comparison` chip.
- `Game/index.jsx`:
  - Renders `StageBar` at the top of the main content area.
  - Connects `startGame`, `changeStage`, `settleRound`, `playCard`, `applyHazard`, `revertToPreviousState`, `updatePlayerCount`, `lastHazardImpact`, `clearLastHazardImpact`, `roundEventDocs`, and `roundStats` from `useGame()`.
  - Opens `HazardImpactDialog` automatically when `lastHazardImpact` is set after `applyHazard`.
  - Opens `DividendsDialog` when clicking *Settle Round & Dividends* in `StageBar`.
  - Opens `EndEarlyDialog` when clicking *End Game Early* in `StageBar`.
  - Opens `GameSummaryDialog` automatically when a round settlement completes the game (`updatedSession?.isActive === false`), and provides a *View Summary* button whenever `!currentSession.isActive`.
  - Handles `"Game not found"` cleanly with a button to return to the Dashboard.
  - Removes unused dead files `GameLayout.jsx`, `GameSidebar.jsx`, `GameTabs.jsx`, and `TabPanels.jsx`.

- [ ] **Step 1: Update `TownPieChart.jsx`, `TownPieCharts.jsx`, `TownDetailsView.jsx`, `GameTable.jsx`, `Game/index.jsx`, and remove the 4 dead layout files**
- [ ] **Step 2: Run unit tests, emulator integration tests, lint, and build**
  Run: `npm test && npm run test:emulator && npm run lint && npm run build`
  Expected: all unit tests pass, all emulator integration tests pass, 0 lint errors, production build succeeds.
- [ ] **Step 3: Commit**
  `git add -A src/components/Charts/TownPieChart.jsx src/components/Game/ && git commit -m "feat: wire facilitated flow UI, flip cards, comparison lock, and summary into Game"`
