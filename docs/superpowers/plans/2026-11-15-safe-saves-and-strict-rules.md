# Safe Saves, Persisted Undo, and Strict Rules (PR 2 of the facilitated game flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch all game state mutations to single Firestore transactions with a `revision` counter and persisted 1-level undo, enforce document ownership, schemas, and stage/round transitions in `firestore.rules`, and verify everything with an emulator integration test suite (`npm run test:emulator`).

**Architecture:**
1. A pure undo planner (`src/game/undo.js`) constructs and applies the 1-level undo snapshot (`lastUndo` on `game_sessions`) without Firebase or React.
2. `gameSessionService.js` replaces multi-step CRUD calls for moves (`startGame`, `changeStage`, `applyCardToTown`, `applyHazardToSession`, `settleRound`, `undoLastMove`, `updateTownBudget`, plus legacy wrapper `advanceRound`) with atomic `runTransaction(db, ...)` calls. Every move checks `expectedRevision` (when provided), increments `revision`, updates or clears `lastUndo`, and returns the updated state; post-transaction re-reads are isolated so a failed re-read reports `savedWithRefreshWarning: true` instead of failing the move.
3. `firestore.rules` validates ownership across all collections (`users`, `game_sessions`, `towns`, `card_plays`, `round_events`, `round_stats`), binds `<sessionId>_<round>` IDs, enforces field schemas and value ranges, and stays compatible with legacy sessions and upcoming CCS token claims.
4. `scripts/test-emulator.mjs` (wired to `npm run test:emulator`) exercises a full 2-round game, persisted undo across reload, legacy session migration, and rule/transaction rejections against the local Auth and Firestore emulators.

**Tech Stack:** JavaScript ES modules, Firebase JS SDK 11 (`runTransaction`, `serverTimestamp`, `deleteField`), Firestore Security Rules v2, Node 24 built-in test runner (`node:test`, `node:assert/strict`).

**Spec:** `docs/superpowers/specs/2026-11-11-facilitated-game-flow-design.md`

## Global Constraints

- Browser-only SPA; all persistence is Firestore and `firestore.rules` is the only server-side check.
- Relative imports in `src/game/` and `scripts/` must include explicit `.js` extensions for Node execution.
- Every move increments `session.revision` by 1 (`(session.revision ?? 0) + 1`). Legacy sessions without `revision` treat it as `0`.
- When `expectedRevision !== undefined` and `(session.revision ?? 0) !== expectedRevision`, throw `GameRuleError("stale-revision", "This game changed elsewhere. Refresh to continue.")`.
- Stage changes and manual budget edits (`0–999` EP) are moves: they run in a transaction, increment `revision`, and clear `lastUndo` (`null`). Renaming a town changes only `name` and is not a move.
- Undo reverts only the most recent card play or hazard application in the current round (`lastUndo.round === session.currentRound`), restores previous town states and round events/card plays, clears `lastUndo` to `null`, and increments `revision`. Settlement and stage changes cannot be undone.
- `round_events` and `round_stats` document IDs must be `<sessionId>_<roundNumber>`, enforced in `firestore.rules` on create (`docId == request.resource.data.sessionId + "_" + string(request.resource.data.roundNumber)`).
- Settlement queries only active card plays (`where("sessionId", "==", sessionId), where("isActive", "==", true)`), never every play in the game's history.
- A saved transaction is never reported as failed if a follow-up read fails; if re-reading fails, return `{ ...result, refreshFailed: true }` so the UI can show `"Saved; refresh to see the latest"`.
- Missing or deleted session in `getSession(sessionId)` returns `null` cleanly so `GameContext` sets error `"Game not found"`.
- `firestore.rules` must not require `request.auth.token.email` on `users/{uid}`, and must gate game-data access through a single helper function `canAccessGameData()` so `feat/ccs-integration` can add subscription-expiry checks in one line.
- Legacy documents lacking new optional fields (`totalRounds`, `playerCount`, `digitalWheelEnabled`, `stage`, `revision`, `endedEarly`, `lastSettlementRound`, `lastDividends`, `lastUndo`, `impactPoints`, `impactComplete`, `dividends`) must still pass security rules and load/play as 5-round games.

## Review Focus

1. **Undo across stage change or round settlement:** Changing stage (`adaptation -> hazard -> review`) or settling a round must clear `lastUndo: null` and bump `revision`, so calling `undoLastMove` afterwards throws `GameRuleError("nothing-to-undo")`. *(Tasks 1, 2, 5)*
2. **Cross-session `round_stats` / `round_events` squatting:** A signed-in user attempting to create `round_stats/<otherSessionId>_1` or `round_events/<mySessionId>_2` with `roundNumber: 1` must be rejected by `firestore.rules`. *(Tasks 4, 5)*
3. **Stale revision / double-submit:** Submitting two moves with the same `expectedRevision` or settling the same `expectedRound` twice must reject the second call with `stale-revision` or `stale-round` and leave Firestore data untouched. *(Tasks 2, 5)*
4. **Hazard undo when the hazard was the first vs. second in a round:** Undoing the first hazard in a round must restore `round_events/<sessionId>_<round>` to empty (`hazardIds: []`, `eventHistory: []`, `impactPoints: {}`) or delete it, so `hazardCountThisRound` becomes `0` again (allowing `hazard -> adaptation` stage step-back). Undoing the second hazard restores the first hazard's `hazardIds`, `eventHistory`, and `impactPoints`. *(Tasks 1, 2, 5)*
5. **Legacy in-progress game:** A session created with only `{ userId, name, currentRound: 1, isActive: true, completedAt: null }` and towns without new fields must allow playing a card, applying a hazard, and settling the round under the new `firestore.rules`, writing the missing fields on the first move. *(Tasks 2, 4, 5)*

## File Structure

| File | Responsibility |
|---|---|
| `src/game/undo.js` | Pure builders and validators for 1-level undo snapshots (`buildCardUndo`, `buildHazardUndo`, `planUndo`) |
| `src/game/undo.test.js` | Unit tests for `src/game/undo.js` |
| `src/services/gameSessionService.js` | Transaction-based moves (`createSession`, `startGame`, `changeStage`, `applyCardToTown`, `applyHazardToSession`, `settleRound`, `undoLastMove`, `updateTownName`, `updateTownBudget`, `advanceRound` compatibility wrapper) |
| `src/contexts/GameContext.jsx` | Exposes `stage`, `revision`, `canRevert` (from `currentSession?.lastUndo`), `changeStage`, `settleRound`, `updateTownName`, `updateTownBudget`, `revertToPreviousState` (wired to `undoLastMove`), and `"Game not found"` error handling |
| `firestore.rules` | Strict ownership, ID binding, schema/range checks, legacy compatibility, and `canAccessGameData()` helper |
| `scripts/test-emulator.mjs` | Node integration test suite running against Auth (`127.0.0.1:9099`) and Firestore (`127.0.0.1:8080`) emulators |
| `package.json` | Adds `"test:emulator": "node --test scripts/test-emulator.mjs"` |

---

### Task 1: Pure undo snapshot planner (`src/game/undo.js`)

**Files:**
- Create: `src/game/undo.js`
- Create: `src/game/undo.test.js`

**Interfaces:**
- Consumes: `GameRuleError` from `./errors.js`, `HAZARD_IDS`, `ASPECTS` from `./scores.js`
- Produces:
  - `pickTownState(town): { id, effortPoints, bushfire, flood, stormSurge, heatwave, biohazard }` (deep-clones the 5 hazard score objects and `effortPoints`)
  - `buildCardUndo({ round, townBefore, cardPlayId }): { kind: "card", round, towns: [TownSnapshot], cardPlayId }`
  - `buildHazardUndo({ round, townsBefore, roundEventBefore }): { kind: "hazard", round, towns: TownSnapshot[], roundEvent: { existed: boolean, hazardIds: string[], eventHistory: Array, impactPoints: Object, impactComplete: boolean } }`
  - `planUndo({ session, currentTowns }): { kind: "card" | "hazard", round: number, towns: Array<Town>, deleteCardPlayId: string | null, roundEventPatch: { existed: boolean, hazardIds: string[], eventHistory: Array, impactPoints: Object, impactComplete: boolean } | null }`
    - Throws `GameRuleError("game-complete")` if `!session.isActive`.
    - Throws `GameRuleError("nothing-to-undo")` if `!session.lastUndo` or `session.lastUndo.round !== session.currentRound`.
    - Merges each saved `TownSnapshot` in `session.lastUndo.towns` back onto the matching town in `currentTowns` (preserving `name`, `sessionId`, `townNumber`, `isComparisonTown`, `currentRound`, `currentStats`).

- [ ] **Step 1: Write failing tests in `src/game/undo.test.js`**
  Test cases:
  - `buildCardUndo` + `planUndo` restores the town's `effortPoints` and 5 hazard score objects, leaves `town.name` intact if renamed in between, sets `deleteCardPlayId` to the card play ID, and `roundEventPatch` to `null`.
  - `buildHazardUndo` (when `roundEventBefore` was `null`, i.e., first hazard of the round) + `planUndo` restores all towns and returns `roundEventPatch` with `existed: false, hazardIds: [], eventHistory: [], impactPoints: {}, impactComplete: true`.
  - `buildHazardUndo` (when `roundEventBefore` already had 1 hazard and `impactPoints: { t1: 40 }`) + `planUndo` returns `roundEventPatch` with `existed: true`, `hazardIds: ["bushfire"]`, `impactPoints: { t1: 40 }`, `impactComplete: true`.
  - `planUndo` throws `nothing-to-undo` when `session.lastUndo` is `null` or `session.lastUndo.round !== session.currentRound`.
  - `planUndo` throws `game-complete` when `session.isActive === false`.
  - Input objects (`session`, `currentTowns`, `townBefore`) are not mutated.
- [ ] **Step 2: Run `npm test` to verify it fails**
  Run: `npm test`
  Expected: FAIL (`Cannot find module './undo.js'`).
- [ ] **Step 3: Implement `src/game/undo.js`**
  Implement `pickTownState`, `buildCardUndo`, `buildHazardUndo`, and `planUndo`.
- [ ] **Step 4: Run `npm test` to verify it passes**
  Run: `npm test`
  Expected: PASS (all unit tests green).
- [ ] **Step 5: Commit**
  `git add src/game/undo.js src/game/undo.test.js && git commit -m "feat: add pure undo snapshot planner"`

---

### Task 2: Transactional game moves in `src/services/gameSessionService.js`

**Files:**
- Modify: `src/services/gameSessionService.js`

**Interfaces:**
- Consumes:
  - `db` from `../firebase/config`
  - `doc`, `collection`, ` getDoc`, `getDocs`, `query`, `where`, `runTransaction`, `serverTimestamp` from `firebase/firestore`
  - `GameRuleError` from `../game/errors.js`
  - `playCard`, `applyCardEffects` from `../game/cards.js`
  - `applyHazard`, `buildHazardImpact` from `../game/hazards.js`
  - `validateGameOptions`, `validateBudget`, `getTotalRounds` from `../game/options.js`
  - `getStage`, `canChangeStage`, `assertCanPlayCard`, `assertCanApplyHazard` from `../game/stages.js`
  - `planStartGame`, `planSettlement`, `calculateDividend` from `../game/settlement.js`
  - `buildCardUndo`, `buildHazardUndo`, `planUndo` from `../game/undo.js`
- Produces on `gameSessionService`:
  - `createSession(userId, name = "New Game", options = {})`: validates options via `validateGameOptions(options)`, enforces max 3 active sessions, creates `game_sessions` doc with `{ userId, name: name.trim() || "New Game", currentRound: 0, totalRounds, digitalWheelEnabled, playerCount, stage: "adaptation", revision: 0, isActive: true, endedEarly: false, completedAt: null, lastSettlementRound: 0, lastDividends: {}, lastUndo: null, createdAt, updatedAt }` and the 6 towns (`defaultTowns`, `townNumber` 1..6, IDs `${sessionId}_town_${townNumber}`).
  - `startGame(sessionId, { expectedRevision } = {})`: transaction that runs `planStartGame(session)`, checks `expectedRevision`, updates session (`currentRound: 1, stage: "adaptation", revision: nextRev, totalRounds: getTotalRounds(session), digitalWheelEnabled: session.digitalWheelEnabled ?? true, playerCount: session.playerCount ?? null, endedEarly: false, lastUndo: null, updatedAt`), updates all session towns to `currentRound: 1`.
  - `changeStage(sessionId, targetStage, { expectedRevision } = {})`: transaction that reads session, towns, and current round event (`${sessionId}_${session.currentRound}`), computes `currentStage = getStage(session, hazardIds.length)`, checks `canChangeStage(currentStage, targetStage, hazardIds.length)` (throws `GameRuleError("invalid-stage-transition")` if false), sets `stage: targetStage, revision: nextRev, lastUndo: null, updatedAt`.
  - `applyCardToTown(townId, cardId, round, { expectedRevision } = {})`: transaction that reads the town and its parent session (plus current round event if `session.stage` is missing), checks `session.isActive`, checks `round === undefined || session.currentRound === round` (throws `GameRuleError("stale-round")` if mismatched), checks `assertCanPlayCard(currentStage)`, runs `playCard(town, card, session.currentRound)`, writes updated town, creates `card_plays` doc (with pre-generated ref `doc(collection(db, "card_plays"))`), and updates session with `revision: nextRev`, `stage: currentStage`, `lastUndo: buildCardUndo({ round: session.currentRound, townBefore: town, cardPlayId: playRef.id })`.
  - `applyHazardToSession(sessionId, hazardId, round, { expectedRevision } = {})`: transaction that reads session, all towns for the session, and `round_events/${sessionId}_${session.currentRound}`, checks `assertCanApplyHazard(currentStage, existingHazards.length)`, applies `applyHazard(town, hazard)` to each town, computes `impact = buildHazardImpact(towns, updatedTowns)`, accumulates `impactPoints` per town onto the round event (`prevLoss + item.loss`, sets `impactComplete: existingEvent ? existingEvent.impactComplete !== false && existingEvent.impactPoints != null : true`), appends `hazardId` to `hazardIds` (preserving order and duplicates up to 5, as the spec states "Up to five hazard applications per round, each recorded in order in the round's event"), writes towns and round event, and updates session with `revision: nextRev, stage: currentStage, lastUndo: buildHazardUndo({ round: session.currentRound, townsBefore: towns, roundEventBefore: existingEvent })`. Returns `{ towns: updatedTowns, roundEvent, impact, session: updatedSession }`.
  - `settleRound(sessionId, { expectedRound, expectedRevision, endEarly = false } = {})`: queries active card plays for `sessionId` (`where("sessionId", "==", sessionId), where("isActive", "==", true)`), then in a transaction reads session, towns, current round event (`${sessionId}_${r}`), `round_stats/${sessionId}_${r}` (throws `GameRuleError("already-settled")` if `round_stats` doc already exists), and each active play doc. Checks stage (note: for legacy callers calling `advanceRound(sessionId)` when stage is `adaptation`, `advanceRound` delegates to `startGame` if `currentRound === 0` or `settleRound` with a legacy flag/stage handling; in `settleRound` itself, `planSettlement` enforces `stage === "review" || endEarly`). Writes `round_stats/${sessionId}_${r}` with `{ sessionId, roundNumber: r, towns: plan.snapshots, dividends: plan.dividends, createdAt, updatedAt }`, updates each town (`effortPoints`, `currentRound`, hazard scores, `currentStats`), deactivates finished plays (`isActive: false`), and updates session (`currentRound: plan.nextRound, isActive: !plan.isComplete, completedAt: plan.isComplete ? serverTimestamp() : null, endedEarly: plan.endedEarly, stage: plan.nextStage, lastSettlementRound: r, lastDividends: plan.dividends, lastUndo: null, revision: nextRev, totalRounds: getTotalRounds(session)`).
  - `undoLastMove(sessionId, { expectedRevision } = {})`: transaction that reads session, towns, and (depending on `session.lastUndo`) the card play doc or current round event doc. Runs `planUndo({ session, currentTowns: towns })`, writes restored towns, deletes the card play doc (if `kind === "card"`) or updates/clears the round event doc (if `kind === "hazard"` — if `roundEventPatch.existed` is false, updates `hazardIds: [], eventHistory: [], impactPoints: {}, impactComplete: true` or deletes the doc; keeping/updating with empty arrays avoids a delete rule and works cleanly with `hazardIds.length === 0`), and updates session (`lastUndo: null, revision: nextRev`).
  - `updateTownName(townId, name)`: trims `name` (throws `GameRuleError("invalid-town-name")` if empty or > 80 chars) and updates `{ name: trimmed, updatedAt }` on `towns/${townId}` (not a move; does not bump `revision`).
  - `updateTownBudget(townId, effortPoints, { expectedRevision } = {})`: validates `validateBudget(effortPoints)` (`0–999`), then in a transaction reads town and parent session, checks `expectedRevision`, updates only `{ effortPoints, updatedAt }` on the town, and updates `{ revision: nextRev, lastUndo: null, updatedAt }` on the session.
  - `updatePlayerCount(sessionId, playerCount)`: validates `playerCount` (`null` or integer `1–200`), checks session is active, updates `{ playerCount, updatedAt }` on `game_sessions/${sessionId}`.
  - `advanceRound(sessionId)`: backwards-compatible wrapper used by existing UI until PR 3 lands — if `session.currentRound === 0` calls `startGame(sessionId)`; otherwise if `getStage(session, hazardCount)` is not `"review"` and not ending early, transitions stage to `"review"` (or passes stage `"review"` for legacy callers when `advanceRound` is called directly) and calls `settleRound(sessionId, { expectedRound: session.currentRound })`.

- [ ] **Step 1: Implement the transactional methods in `src/services/gameSessionService.js`**
  Ensure every move checks `expectedRevision` when passed:
  ```js
  function assertRevision(session, expectedRevision) {
    const current = session.revision ?? 0;
    if (expectedRevision !== undefined && current !== expectedRevision) {
      throw new GameRuleError(
        "stale-revision",
        "This game changed elsewhere. Refresh to continue."
      );
    }
    return current + 1;
  }
  ```
  Ensure post-transaction re-reads (if any) are wrapped in `try/catch` so a post-commit read failure returns `{ ...committedData, refreshFailed: true }` instead of throwing.
- [ ] **Step 2: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: 0 errors, all unit tests pass, build succeeds.
- [ ] **Step 3: Commit**
  `git add src/services/gameSessionService.js && git commit -m "feat: switch game session moves to Firestore transactions"`

---

### Task 3: Wire `GameContext` to transactional moves, persisted undo, and error handling

**Files:**
- Modify: `src/contexts/GameContext.jsx`

**Interfaces:**
- Consumes: `gameSessionService` transactional methods (`createSession`, `loadSession`, `startGame`, `changeStage`, `applyCardToTown`, `applyHazardToSession`, `settleRound`, `undoLastMove`, `updateTownName`, `updateTownBudget`, `updatePlayerCount`), `getStage` from `../game/stages.js`
- Produces in `GameContext` value:
  - `currentStage`: derived via `getStage(currentSession, (roundEvents[currentRound] || []).length)` when `currentSession` is loaded
  - `canRevert`: `Boolean(currentSession?.isActive && currentSession?.lastUndo && currentSession.lastUndo.round === currentRound)`
  - `createNewSession(name, options)`: passes `name` and `options` to `gameSessionService.createSession(currentUser.uid, name, options)`
  - `loadSession(sessionId)`: sets `error` to `"Game not found"` when `gameSessionService.getSession(sessionId)` returns `null`
  - `changeStage(targetStage)`: calls `gameSessionService.changeStage(currentSession.id, targetStage, { expectedRevision: currentSession.revision })`
  - `settleRound({ endEarly = false } = {})`: calls `gameSessionService.settleRound(currentSession.id, { expectedRound: currentRound, expectedRevision: currentSession.revision, endEarly })`
  - `playCard(townId, cardId)`: calls `gameSessionService.applyCardToTown(townId, cardId, currentRound, { expectedRevision: currentSession.revision })`
  - `applyHazard(hazardId)`: calls `gameSessionService.applyHazardToSession(currentSession.id, hazardId, currentRound, { expectedRevision: currentSession.revision })`
  - `revertToPreviousState()`: calls `gameSessionService.undoLastMove(currentSession.id, { expectedRevision: currentSession.revision })` and reloads session state
  - `updateTown(updatedTown)` / `updateTownName(townId, name)` / `updateTownBudget(townId, effortPoints)`: routes name changes to `updateTownName` and budget changes to `updateTownBudget` with `{ expectedRevision: currentSession.revision }`, never overwriting the whole town from client state
  - If any move returns `result?.refreshFailed`, sets a non-fatal notice `"Saved; refresh to see the latest"` rather than `"Failed..."`.

- [ ] **Step 1: Update `src/contexts/GameContext.jsx`**
  Remove the in-memory `stateHistory` / `immer` usage from `GameContext.jsx` (replacing it with `currentSession.lastUndo` and `gameSessionService.undoLastMove`), wire `expectedRevision`, handle `"Game not found"` on missing sessions, and route town name vs. budget updates to `updateTownName` / `updateTownBudget`.
- [ ] **Step 2: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: all tests pass, 0 lint errors, build succeeds.
- [ ] **Step 3: Commit**
  `git add src/contexts/GameContext.jsx && git commit -m "feat: wire GameContext to persisted undo and session revisions"`

---

### Task 4: Strict `firestore.rules` with ownership, ID binding, schema checks, and legacy support

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Enforces security rules on:
  - `users/{uid}`: `signedIn() && request.auth.uid == uid`, no requirement on `request.auth.token.email`
  - Single helper `canAccessGameData()`: returns `signedIn()` (ready for CCS to add subscription/session-age check in one line)
  - Helper `ownsSession(sessionId)`: `canAccessGameData() && get(/databases/$(database)/documents/game_sessions/$(sessionId)).data.userId == request.auth.uid`
  - `game_sessions/{sessionId}`:
    - `read, delete`: `canAccessGameData() && resource.data.userId == request.auth.uid`
    - `create`: `canAccessGameData() && request.resource.data.userId == request.auth.uid` + valid session fields (`name` non-empty string ≤ 100, `currentRound == 0`, `isActive == true`, optional `totalRounds` int `1..20`, optional `playerCount` `null` or int `1..200`, optional `digitalWheelEnabled` bool, optional `stage == "adaptation"`, optional `revision == 0`)
    - `update`: `canAccessGameData() && resource.data.userId == request.auth.uid && request.resource.data.userId == resource.data.userId` + immutable `totalRounds` and `digitalWheelEnabled` once `resource.data.currentRound >= 1` (unless missing on legacy doc), valid `currentRound` (`resource.data.currentRound` or `resource.data.currentRound + 1`, within `0..21`), valid `stage` (`adaptation`, `hazard`, `review`, `complete`), monotonic `revision` (`!('revision' in resource.data) || request.resource.data.revision == resource.data.revision + 1` when `revision` changes), valid `playerCount` (`null` or `1..200`).
  - `towns/{townId}`:
    - `read, delete`: `ownsSession(resource.data.sessionId)`
    - `create`: `ownsSession(request.resource.data.sessionId)` + valid `effortPoints` (`0..999`), valid `townNumber` (`1..6`), valid `currentRound` (`0..21`), valid 5 hazard maps (`bushfire`, `flood`, `stormSurge`, `heatwave`, `biohazard` each having `nature`, `economy`, `society`, `health` ints `0..100`).
    - `update`: `ownsSession(resource.data.sessionId) && request.resource.data.sessionId == resource.data.sessionId && request.resource.data.townNumber == resource.data.townNumber && request.resource.data.isComparisonTown == resource.data.isComparisonTown` + valid `name` (non-empty string ≤ 80), valid `effortPoints` (int `0..9999`), valid 5 hazard maps (`0..100`).
  - `card_plays/{playId}`:
    - `read, delete`: `ownsSession(resource.data.sessionId)`
    - `create`: `ownsSession(request.resource.data.sessionId)` + required fields (`sessionId`, `townId`, `cardId` string, `playedAtRound` int `1..20`, `effectiveRounds` list of size `1..3`, `isActive == true`).
    - `update`: `ownsSession(resource.data.sessionId)` + immutable `sessionId`, `townId`, `cardId`, `playedAtRound`, `effectiveRounds`; `isActive` bool.
  - `round_events/{eventId}`:
    - `read, delete`: `ownsSession(resource.data.sessionId)`
    - `create`: `ownsSession(request.resource.data.sessionId) && eventId == request.resource.data.sessionId + "_" + string(request.resource.data.roundNumber)` + `roundNumber` int `1..20`, `hazardIds` list of size `0..5`.
    - `update`: `ownsSession(resource.data.sessionId) && request.resource.data.sessionId == resource.data.sessionId && request.resource.data.roundNumber == resource.data.roundNumber` + `hazardIds` list of size `0..5`.
  - `round_stats/{statsId}`:
    - `read, delete`: `ownsSession(resource.data.sessionId)`
    - `create`: `ownsSession(request.resource.data.sessionId) && statsId == request.resource.data.sessionId + "_" + string(request.resource.data.roundNumber)` + `roundNumber` int `1..20`, `towns` map.
    - `update`: `false` (round stats are written once on settlement and never mutated, preventing double-dividend tampering).

- [ ] **Step 1: Write the updated `firestore.rules`**
  Include helper functions `signedIn()`, `canAccessGameData()`, `ownsSession(sessionId)`, `validAspectMap(m)`, `validTownScores(data)`, and collection match blocks.
- [ ] **Step 2: Commit**
  `git add firestore.rules && git commit -m "feat: enforce ownership, ID binding and schemas in firestore.rules"`

---

### Task 5: Emulator integration test suite (`scripts/test-emulator.mjs`)

**Files:**
- Modify: `package.json` (add `"test:emulator": "node --test scripts/test-emulator.mjs"`)
- Create: `scripts/test-emulator.mjs`

**Interfaces:**
- Consumes: `src/services/gameSessionService.js`, `src/firebase/config.js` (or dedicated client instances connected to `127.0.0.1:9099` and `127.0.0.1:8080` under `demo-heat-is-on`), `GameRuleError`
- Tests (using `node:test` and `node:assert/strict`):
  1. **Full 2-round facilitated game + persisted undo:**
     - Sign up User A, create a 2-round session (`totalRounds: 2, playerCount: 18, digitalWheelEnabled: false`).
     - Start game (`round 1`, `stage: "adaptation"`, `revision: 1`).
     - Reject playing a card on Bludgeton (`comparison-town`).
     - Play `bushfire1` (cost 15, duration 1) and `bushfire2` (cost 15, duration 2) on Town 1 (`revision` increments each time).
     - Undo last move (`undoLastMove`) -> reverts `bushfire2`, deletes its `card_plays` doc, restores Town 1 EP to 85, clears `lastUndo`, increments `revision`.
     - Reject a second undo (`nothing-to-undo`).
     - Reject applying hazard while in `adaptation` (`wrong-stage`).
     - Change stage `adaptation -> hazard`, then step back `hazard -> adaptation` (allowed while 0 hazards applied), then `adaptation -> hazard`.
     - Apply `bushfire` hazard -> stores `impactPoints` and `impactComplete: true` on `round_events/${sessionId}_1`.
     - Reject stepping back `hazard -> adaptation` once a hazard is applied (`invalid-stage-transition`).
     - Undo the hazard (`undoLastMove`) -> restores all towns' pre-hazard scores and clears `hazardIds` to `[]`; now stepping back `hazard -> adaptation` succeeds!
     - Move `adaptation -> hazard`, apply `bushfire`, move `hazard -> review` (clears `lastUndo`, so `undoLastMove` now throws `nothing-to-undo`).
     - Settle round 1 (`settleRound` with `expectedRound: 1`) -> creates `round_stats/${sessionId}_1` with `dividends`, advances to `round 2`, `stage: "adaptation"`, deactivates `bushfire1`.
     - Reject settling round 1 again (`stale-round`).
     - Reject stale revision (`expectedRevision: 1` throws `stale-revision`).
     - In round 2, manual budget edit (`updateTownBudget` to 250) works and bumps `revision`; out-of-range budget (`1000`) throws `invalid-budget`.
     - Complete round 2 (`adaptation -> hazard`, apply `flood`, `hazard -> review`, `settleRound` with `expectedRound: 2`) -> session `isActive: false`, `stage: "complete"`, `currentRound: 3`.
  2. **Ending early:**
     - Create a 5-round session, start round 1, call `settleRound(sessionId, { expectedRound: 1, endEarly: true })` from `adaptation` -> completes immediately with `endedEarly: true`, `currentRound: 2`, `isActive: false`.
  3. **Legacy session compatibility:**
     - Seed a legacy session document directly (`{ userId, name: "Legacy", currentRound: 1, isActive: true, completedAt: null }` — no `totalRounds`, `stage`, `revision`, `lastUndo`) and 6 town documents without new fields.
     - Load session, play a card, change stage to `hazard`, apply hazard, change stage to `review`, settle round 1 -> succeeds and populates `revision`, `stage`, `totalRounds: 5`, `round_stats`.
  4. **Security rules rejections:**
     - User B (signed in as a different UID) cannot read or update User A's `game_sessions`, `towns`, `card_plays`, `round_events`, or `round_stats`.
     - User B cannot squat `round_stats/${userASessionId}_2` or `round_events/${userASessionId}_2`.
     - User A cannot create `round_events/${userASessionId}_99` with `roundNumber: 1` (ID binding mismatch).
     - User A cannot update an existing `round_stats` document (`allow update: if false`).
     - User A cannot set a town's `effortPoints` to `-10` or a hazard aspect score to `150` directly in Firestore.

- [ ] **Step 1: Add `"test:emulator"` script to `package.json` and create `scripts/test-emulator.mjs`**
   Note: set `process.env.VITE_USE_FIREBASE_EMULATOR = "true"` or initialize the Firebase client in `scripts/test-emulator.mjs` against `127.0.0.1:9099` and `127.0.0.1:8080` (`projectId: "demo-heat-is-on"`), and ensure `src/firebase/config.js` falls back gracefully when `import.meta.env` is undefined under plain Node (`const env = import.meta.env ?? process.env;`).
- [ ] **Step 2: Start the emulators and run `npm run test:emulator`**
  Run: `npm run test:emulator` (with the Firebase Auth + Firestore emulators running on `127.0.0.1:9099` and `127.0.0.1:8080`).
  Expected: all integration tests in `scripts/test-emulator.mjs` pass, and `npm test`, `npm run lint`, `npm run build` all pass.
- [ ] **Step 3: Commit**
  `git add package.json src/firebase/config.js scripts/test-emulator.mjs && git commit -m "test: add emulator integration tests for transactions and firestore rules"`
