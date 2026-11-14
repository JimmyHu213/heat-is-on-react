# Game Rules Module (PR 1 of the facilitated game flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put every game rule (cards, hazards, penalty, dividends, round settlement, stages, game options, summary) into pure, unit-tested functions with no Firebase or React, and make the existing service use them.

**Architecture:** A new `src/game/` folder of small ES modules. Each takes plain objects and returns new ones, never mutating its inputs, and signals rule violations with a `GameRuleError` carrying a stable `code`. Tests sit next to the code (`*.test.js`) and run with Node's built-in test runner. The last task replaces the duplicated helpers in `gameSessionService.js` with these functions; the app's behaviour is unchanged.

**Tech Stack:** JavaScript ES modules, Node 24 `node:test` + `node:assert/strict`, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-facilitated-game-flow-design.md`

## Global Constraints

- No Firebase, React or browser APIs in `src/game/`. Inputs are never mutated.
- Relative imports inside `src/game/` (and from it into `src/constants/`) use explicit `.js` extensions, so Node can run the tests without Vite.
- Scores are integers clamped to 0–100. Hazard types: `bushfire, flood, stormSurge, heatwave, biohazard`. Aspects: `nature, economy, society, health`. 20 segments per town.
- Penalty, unchanged from today's code: **before** a hazard's own effect, every aspect that has a score **≤ 20** in any hazard type loses 10 in all five hazard types (clamped). Then the hazard's values are subtracted from its own type.
- Dividend: 5 EP per segment at exactly 100.
- Game length 1–20 rounds, default 5. Legacy sessions without `totalRounds` = 5.
- Player count: integer 1–200, or `null`.
- Manual budget: integer 0–999.
- Up to 5 hazard applications per round.
- Stored stages: `adaptation | hazard | review | complete`. Round 0 is shown as `setup` (not stored).
- A finished game has `currentRound` = last round played + 1 (matches today's code: a 5-round game ends at 6). Rounds played = `currentRound - 1`.
- Comparison town = `isComparisonTown === true` (Bludgeton).
- `npm test` runs `node --test "src/**/*.test.js"`.

## Review Focus

1. **Inputs mutated.** Today's `applyHazardEffects` mutates the caller's town objects. Every pure function's test asserts the input is deep-equal to a copy taken before the call. *(Tasks 2, 3, 5)*
2. **Penalty exactly at 20.** A score of exactly 20 must trigger the penalty (≤, not <). *(Task 3)*
3. **Settling the same round twice** (stale tab or double click) must throw `stale-round`, and a finished game must throw `game-complete`. *(Task 5)*
4. **Legacy session** with no `totalRounds`, `stage` or `playerCount` must report 5 rounds, the inferred stage, and `playerCount: null`. *(Tasks 4, 6)*
5. **Ties and missing data in the summary.** Every town tied for first is listed. The comparison town never wins either highlight. "Most impacted" is empty if any played round's event lacks `impactPoints`. *(Task 6)*

## File Structure

| File | Responsibility |
|---|---|
| `src/game/errors.js` | `GameRuleError` |
| `src/game/scores.js` | constants, clamping, segment totals, resilience, averages per dimension, segment counts |
| `src/game/cards.js` | card effects, effective rounds, playing a card |
| `src/game/hazards.js` | hazard effects with penalty, impact report |
| `src/game/options.js` | game options, budget validation, total rounds |
| `src/game/stages.js` | current stage, stage transitions, card/hazard gating |
| `src/game/settlement.js` | starting a game, dividends, round settlement |
| `src/game/summary.js` | end-of-game summary |
| `src/game/*.test.js` | one test file per module |
| `package.json` | `test` script |
| `src/services/gameSessionService.js` | delegates its helpers to `src/game/` (Task 7) |

---

### Task 1: Test runner, errors and scores

**Files:**
- Modify: `package.json` (scripts)
- Create: `src/game/errors.js`, `src/game/scores.js`, `src/game/scores.test.js`

**Interfaces:**
- Produces:
  - `class GameRuleError extends Error { constructor(code: string, message?: string) }`, with `.code` and `name = "GameRuleError"`.
  - Constants exported from `scores.js`:
    - `HAZARD_IDS`, `ASPECTS`
    - `MIN_SCORE = 0`, `MAX_SCORE = 100`
    - `PENALTY_THRESHOLD = 20`, `PENALTY_AMOUNT = 10`
    - `DIVIDEND_PER_SEGMENT = 5`, `WEAK_SEGMENT_MAX = 20`
  - Functions exported from `scores.js`:
    - `clampScore(n: number): number`
    - `segmentTotal(town): number` (sum of the 20 scores)
    - `overallResilience(town): number` (`segmentTotal / 20`)
    - `neshAverages(town): {nature, economy, society, health}` (each the average over the 5 hazard types)
    - `countSegments(town, predicate: (score) => boolean): number`

- [ ] **Step 1:** Add `"test": "node --test \"src/**/*.test.js\""` to `package.json` scripts.
- [ ] **Step 2: Write failing tests** in `scores.test.js`, using a fixture from `src/constants/towns.js` `town1.baseStats` (bushfire all 40, flood 80, stormSurge 80, heatwave 60, biohazard 80):
  - `clampScore(-5) === 0`, `clampScore(105) === 100`, `clampScore(55) === 55`
  - `segmentTotal(town1) === 1360`; `overallResilience(town1) === 68`
  - `neshAverages(town1)` deep-equals `{nature: 68, economy: 68, society: 68, health: 68}`
  - `countSegments(town1, s => s <= 40) === 4`
  - `new GameRuleError("x")` has `.code === "x"` and is an `instanceof Error`
- [ ] **Step 3:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 4:** Implement `errors.js` and `scores.js`.
- [ ] **Step 5:** Run `npm test`. Expected: all pass.
- [ ] **Step 6:** Commit: `test: add node test runner and game score helpers`

### Task 2: Cards

**Files:** Create `src/game/cards.js`, `src/game/cards.test.js`

**Interfaces:**
- Consumes: `clampScore`, `HAZARD_IDS`, `ASPECTS`, `GameRuleError`
- Produces:
  - `applyCardEffects(town, card): town`
    - Hazard-type card: adds its four values to that hazard type.
    - Aspect card (`type` is an aspect): adds `card[type]` to that aspect in all five hazard types.
    - Clamped; returns a new town.
  - `cardEffectiveRounds(playedAtRound: number, duration: number): number[]` (`duration` missing means 1)
  - `playCard(town, card, round): { town, play: { cardId, townId, playedAtRound, effectiveRounds } }`
    - Deducts `card.cost` from `effortPoints` and applies the effects.
    - Throws `GameRuleError("comparison-town")` if `town.isComparisonTown`.
    - Throws `GameRuleError("insufficient-effort-points")` if `effortPoints < cost`.

- [ ] **Step 1: Write failing tests** (cards from `src/constants/cards.js`; town = `town1` base stats + `id: "t1"`, `effortPoints: 100`):
  - `applyCardEffects(town, bushfire1).bushfire` deep-equals `{nature: 60, economy: 50, society: 50, health: 50}`; other types unchanged
  - `applyCardEffects(town, allNature)` gives nature `55 / 95 / 95 / 75 / 95` across `bushfire / flood / stormSurge / heatwave / biohazard`, with other aspects unchanged
  - a segment at 95 plus a +15 card gives 100 (clamped)
  - `cardEffectiveRounds(2, 3)` → `[2, 3, 4]`; `cardEffectiveRounds(4, undefined)` → `[4]`
  - `playCard(town, bushfire3, 2)` → `town.effortPoints === 85`, `play.effectiveRounds` `[2, 3, 4]`, `play.townId === "t1"`
  - comparison town → throws with code `comparison-town`; `effortPoints: 10` → throws `insufficient-effort-points`
  - input town unchanged after each call (compare with `structuredClone` taken first)
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `cards.js`.
- [ ] **Step 4:** Run `npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat: add pure card rules`

### Task 3: Hazards and impact

**Files:** Create `src/game/hazards.js`, `src/game/hazards.test.js`

**Interfaces:**
- Consumes: `clampScore`, `HAZARD_IDS`, `ASPECTS`, `PENALTY_THRESHOLD`, `PENALTY_AMOUNT`, `overallResilience`
- Produces:
  - `applyHazard(town, hazard): town` (penalty first, as in Global Constraints, then the hazard's own effect)
  - `buildHazardImpact(beforeTowns, afterTowns): Array<{ townId, aspectLoss: {nature, economy, society, health}, loss, before, after }>`
    - `aspectLoss` is summed over all five hazard types.
    - `loss` is the sum of `aspectLoss`.
    - `before` and `after` are `overallResilience` values.
    - Towns are matched by `id`.

- [ ] **Step 1: Write failing tests** (`town1` base, hazard `bushfire` = nature 30, economy 10, society 20, health 20):
  - first `applyHazard`: bushfire becomes `{10, 30, 20, 20}`; every other type is unchanged (no score ≤ 20 beforehand)
  - applied again to that result: the penalty hits nature, society and health (each has a score ≤ 20; society and health are exactly 20); economy (30) is spared. Expected:
    - bushfire `{0, 20, 0, 0}`
    - flood `{70, 80, 70, 70}`
    - stormSurge `{70, 80, 70, 70}`
    - heatwave `{50, 60, 50, 50}`
    - biohazard `{70, 80, 70, 70}`
  - inputs unchanged after both calls
  - `buildHazardImpact([town], [afterFirst])` → `aspectLoss` `{nature: 30, economy: 10, society: 20, health: 20}`, `loss: 80`, `before: 68`, `after: 64`
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `hazards.js`.
- [ ] **Step 4:** Run `npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat: add pure hazard rules and impact report`

### Task 4: Game options and stages

**Files:** Create `src/game/options.js`, `src/game/stages.js`, `src/game/options.test.js`, `src/game/stages.test.js`

**Interfaces:**
- Produces, from `options.js`:
  - Constants: `DEFAULT_ROUNDS = 5`, `MAX_ROUNDS = 20`, `MAX_PLAYERS = 200`, `MAX_MANUAL_BUDGET = 999`
  - `validateGameOptions(input?): { totalRounds, digitalWheelEnabled, playerCount }`
    - Defaults: `5`, `true`, `null`.
    - Throws `invalid-rounds` (not an integer 1–20) or `invalid-player-count` (not `null` and not an integer 1–200).
  - `getTotalRounds(session): number` (`session.totalRounds ?? 5`)
  - `getPlayerCount(session): number | null` (`session.playerCount ?? null`)
  - `validateBudget(value): number`; throws `invalid-budget` unless an integer 0–999.
- Produces, from `stages.js`:
  - Constants: `STAGES = ["adaptation", "hazard", "review"]`, `MAX_HAZARDS_PER_ROUND = 5`
  - `getStage(session, hazardCountThisRound): "setup" | "adaptation" | "hazard" | "review" | "complete"`
    - `!isActive` → `complete`
    - `currentRound === 0` → `setup`
    - otherwise the stored `stage` if present
    - otherwise `review` if `hazardCountThisRound > 0`, else `adaptation`
  - `canChangeStage(from, to, hazardCountThisRound): boolean`. True only for:
    - adaptation → hazard
    - hazard → review (count ≥ 1)
    - review → hazard (count < 5)
    - hazard → adaptation (count === 0)
  - `assertCanPlayCard(stage)`: throws `wrong-stage` unless `adaptation`
  - `assertCanApplyHazard(stage, count)`: throws `wrong-stage` unless `hazard`; throws `hazard-limit` if `count >= 5`

- [ ] **Step 1: Write failing tests:**
  - `validateGameOptions()` deep-equals `{totalRounds: 5, digitalWheelEnabled: true, playerCount: null}`
  - rounds `0`, `21`, `2.5` → `invalid-rounds`; `1` and `20` accepted
  - players `0`, `201`, `3.5` → `invalid-player-count`; `null` and `200` accepted
  - `getTotalRounds({})` → 5; `getPlayerCount({})` → null
  - `validateBudget` accepts 0 and 999; rejects -5, 1000, 12.5
  - `getStage`:
    - `{isActive: false}` → `complete`
    - `{isActive: true, currentRound: 0}` → `setup`
    - legacy `{isActive: true, currentRound: 2}` → `review` with count 1, `adaptation` with count 0
    - a stored stage wins over the count
  - `canChangeStage`:
    - true: `adaptation→hazard`; `hazard→review` with 1; `review→hazard` with 4; `hazard→adaptation` with 0
    - false: `hazard→review` with 0; `review→hazard` with 5; `hazard→adaptation` with 1; `adaptation→review`
  - `assertCanPlayCard("hazard")` → `wrong-stage`; `assertCanApplyHazard("hazard", 5)` → `hazard-limit`
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `options.js` and `stages.js`.
- [ ] **Step 4:** Run `npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat: add game options and stage rules`

### Task 5: Dividends and round settlement

**Files:** Create `src/game/settlement.js`, `src/game/settlement.test.js`

**Interfaces:**
- Consumes: `applyCardEffects` (Task 2), `getTotalRounds` (Task 4), `HAZARD_IDS`, `ASPECTS`, `DIVIDEND_PER_SEGMENT`, `GameRuleError`
- Produces:
  - `calculateDividend(town): { segments: number, amount: number }` (segments at exactly 100; amount = segments × 5)
  - `planStartGame(session): { nextRound: 1, stage: "adaptation" }`; throws `already-started` unless `currentRound === 0`
  - `planSettlement({ session, towns, activePlays, cards, expectedRound, stage, endEarly = false })` returns:
    - `round`, `nextRound`, `isComplete`, `endedEarly`
    - `snapshots: { [townId]: { round, bushfire, flood, stormSurge, heatwave, biohazard } }`
    - `dividends: { [townId]: number }`
    - `towns` (the new town objects)
    - `deactivatePlayIds: string[]`
    - `nextStage: "adaptation" | "complete"`
  - Order of checks in `planSettlement`:
    1. `!session.isActive` → `game-complete`
    2. `currentRound === 0` → `not-started`
    3. `currentRound !== expectedRound` → `stale-round`
    4. `stage !== "review"` and not `endEarly` → `wrong-stage`
  - Algorithm (from the spec), for round `r`:
    1. Snapshot each town's scores.
    2. Add `calculateDividend(snapshot).amount` to `effortPoints`.
    3. `isComplete = endEarly || r >= getTotalRounds(session)`; `nextRound = r + 1`; every town's `currentRound = nextRound`.
    4. If not complete: for each active play whose `effectiveRounds` includes `r + 1`, apply its card (looked up in `cards` by `cardId`) to its town.
    5. Deactivate:
       - every active play if the game is complete;
       - otherwise each play whose `max(effectiveRounds) <= r + 1`.
    6. `endedEarly = endEarly && r < getTotalRounds(session)`.
    - Plays are `{ id, townId, cardId, effectiveRounds, isActive }`.

- [ ] **Step 1: Write failing tests:**
  - `calculateDividend`:
    - a town with all 20 segments at 100 → `{segments: 20, amount: 100}`
    - `town1` base → `{0, 0}`
    - flood all 100 plus bushfire nature 100 → `{5, 25}`
  - `planStartGame({currentRound: 0})` → `{nextRound: 1, stage: "adaptation"}`; `currentRound: 1` → `already-started`
  - Continuing settlement (`currentRound 2`, `totalRounds 5`, stage `review`, expectedRound 2), one town with flood all 100 and EP 40, plays:
    - `p1` = bushfire1 `[2, 3]` → applied for round 3 (bushfire +20/+10/+10/+10), then deactivated
    - `p2` = bushfire3 `[2, 3, 4]` → applied, stays active
    - `p3` = `[1, 2]` → not applied, deactivated

    Expected: `dividends[t] === 20`, EP 60, `nextRound: 3`, `isComplete: false`, `nextStage: "adaptation"`, `deactivatePlayIds` contains exactly `p1` and `p3`, `snapshots[t].round === 2`.
  - **Dividend before card effects:** a card scheduled for round 3 that lifts a segment to 100 doesn't add to round 2's dividend.
  - Last round (`currentRound 5`, `totalRounds 5`) → `isComplete`, `nextRound 6`, no card effects applied, all active plays deactivated, `endedEarly: false`, `nextStage: "complete"`.
  - End early at round 2 of 5 from stage `adaptation` → allowed: `isComplete`, `endedEarly: true`, dividends still paid.
  - Legacy session without `totalRounds` at round 5 → complete.
  - Errors:
    - expectedRound 1 while at 2 → `stale-round`
    - inactive → `game-complete`
    - round 0 → `not-started`
    - stage `hazard` without endEarly → `wrong-stage`
  - Inputs (towns, plays) unchanged.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `settlement.js`.
- [ ] **Step 4:** Run `npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat: add dividends and round settlement rules`

### Task 6: End-of-game summary

**Files:** Create `src/game/summary.js`, `src/game/summary.test.js`

**Interfaces:**
- Consumes: `overallResilience`, `neshAverages`, `countSegments`, `WEAK_SEGMENT_MAX`, `getTotalRounds`
- Produces: `buildGameSummary({ session, towns, events, roundStats })`
  - `events`: `{ roundNumber, impactPoints?, hazardIds }`
  - `roundStats`: `{ roundNumber, dividends? }`
  - Returns:
    - `name`, `totalRounds`, `roundsPlayed` (`currentRound - 1`, minimum 0), `endedEarly` (boolean)
    - `towns`: rows of `{ id, name, isComparisonTown, resilience, nesh, weakSegments, eventLoss, dividends, effortPoints }`
    - `mostResilient: string[]` and `mostImpacted: string[]` (town IDs)
    - `hasCompleteImpacts`
  - Only events and round stats with `roundNumber <= roundsPlayed` count.
  - `weakSegments` counts scores ≤ 20.
  - Highlights exclude comparison towns and list every tie.
  - `mostImpacted` is `[]` if `hasCompleteImpacts` is false or the maximum loss is 0.

- [ ] **Step 1: Write failing tests:**
  - two regular towns tied on resilience plus a comparison town with a higher score → `mostResilient` is the two tied IDs
  - event losses `{a: 30, b: 10, cmp: 90}` → `mostImpacted ["a"]`
  - one played event without `impactPoints` → `mostImpacted []`, `hasCompleteImpacts: false`
  - an event for a round after `roundsPlayed` is ignored
  - per-round dividends summed per town
  - legacy session (`currentRound 6`, no `totalRounds`) → `totalRounds 5`, `roundsPlayed 5`, `endedEarly false`
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `summary.js`.
- [ ] **Step 4:** Run `npm test`. Expected: pass.
- [ ] **Step 5:** Commit: `feat: add end-of-game summary rules`

### Task 7: Make the service use the rules module

**Files:** Modify `src/services/gameSessionService.js`

**Interfaces:**
- Consumes: `applyCardEffects`, `cardEffectiveRounds` (Task 2), `applyHazard` (Task 3)

- [ ] **Step 1:** In `gameSessionService.js`:
  - `applyCardToTown` uses `applyCardEffects` and `cardEffectiveRounds`.
  - `applyOngoingCardEffects` uses `applyCardEffects`.
  - `applyHazardToSession` uses `applyHazard`. This also fixes today's in-place mutation of the town objects.
  - Delete the now-unused methods `applyCardEffects`, `addPoints`, `applyHazardEffects`, `subtractPoints` and `clampValue`, checking with `grep` that nothing else calls them.
  - The game rules themselves are unchanged in this PR: no dividends, stages or new fields are wired in yet (that's PR 2).
- [ ] **Step 2:** Run `npm test`, `npm run lint` (0 errors) and `npm run build`. Expected: all pass.
- [ ] **Step 3:** Smoke-test against the emulators (`docker compose up -d`, then a Node script in the scratchpad using the Firebase SDK):
  - Sign up, create a game, start round 1, play bushfire1 on town 1, apply bushfire.
  - Expected for town 1:
    - EP 85
    - bushfire after the card: `{60, 50, 50, 50}`
    - bushfire after the hazard: `{30, 40, 30, 30}`
- [ ] **Step 4:** Commit: `refactor: use pure game rules in game session service`

---

## Later PRs (outline; each gets its own detailed plan when it starts)

- **PR 2: Safe saves and strict rules.**
  - Every move in `gameSessionService` becomes one transaction built on `src/game/` (`planStartGame`, `playCard`, `applyHazard`, `planSettlement`, stage changes, the budget edit).
  - The `revision` counter and persisted one-level undo.
  - `round_events` and `round_stats` IDs bound in the rules; settlement reads only active plays; "Game not found" handling; saved-but-refresh-failed handling.
  - New `firestore.rules` with ownership on every collection, field and range checks, stage gating, legacy compatibility, a single rules helper ready for CCS's expiry check, and no `token.email` requirement.
  - `npm run test:emulator`: a full game, a legacy game, and rejected writes.
- **PR 3: Facilitated flow UI.**
  - New-game options (rounds, wheel, players) and the stage bar.
  - Wheel, impact dialog, dividends dialog, end early, summary, flip cards, comparison-town lock.
  - Game-created and game-completed hook functions for CCS. Remove `immer` if unused.
- **PR 4: English/Chinese** (Simplified). Switcher, every string, completeness test, PR #6 strings reused where they match.
- **PR 5: Media and training link.** Videos, GIFs, icons with attribution; config file; training link.
