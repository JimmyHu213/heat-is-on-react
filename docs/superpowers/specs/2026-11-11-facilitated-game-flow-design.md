# Facilitated game flow: design

Status: draft for approval · 2026-11-11 · branch `feat/game-flow`

## Intent

PR #6 (StarrYMSkY, `starryoosky-dev`) turned the game into a guided, facilitator-led
workshop, but it arrived as one 111-file commit with its own Firebase project, its own
emulator setup and a subscription feature that clashes with the CCS plan. We are **not
merging it**. We rebuild its features on `main` in small PRs that follow `CLAUDE.md`, the
existing emulator/Docker setup and our conventions. PR #6 is a behaviour reference only;
its code is not copied. Once this work lands, PR #6 is closed with a note pointing here.

The reason is quality and control: reviewable PRs, one way of doing each thing, and
nothing deployed or decided by accident.

## Goals

1. **Facilitated round flow**: every round moves through *Adapt → Event → Review → Dividends*,
   guided on screen, with a stage indicator the room can see.
2. **New game rules**: configurable game length, end-of-round dividends, a locked comparison
   town, ending early, and an end-of-game summary.
3. **Safe saves**: no move can be applied twice or on top of stale data, undo survives a
   refresh, and the Firestore rules validate every document the game writes.
4. **English/Chinese and presentation media**: a language switcher, intro videos, event
   animations, hazard icons and a training-course link.

## Non-goals

- The subscription request form and `subscription_requests` collection. CCS owns subscriptions.
- `.firebaserc`, Firebase Hosting config and deploy docs. The production project is not
  decided yet, so nothing in this work may make `firebase deploy` target a project by default.
- The video production pipeline (`artifacts/introduction-video/`: render scripts, storyboards, frames).
- `AGENTS.md`. Agent guidance lives in `CLAUDE.md`.
- Per-browser overrides of media URLs (PR #6 had them). Media comes from one config file. *(My call.)*

## Anti-goals (failure even if it "works")

- **An existing saved game stops loading or can't be finished.** Games created before this work have
  none of the new fields and must load, resume at a sensible stage, and play to completion as 5-round games
  (see *Games already in progress* below).
- **A move is applied twice** (double click, two tabs, retry after a network error), or
  dividends are paid twice for the same round.
- **The security rules reject a legitimate move during a live workshop.** Every rule change is
  covered by the emulator integration test before it merges.
- **CCS breaks.** The CCS integration is being built in parallel (`feat/ccs-integration`) and
  touches sign-in, `users/{uid}` and a new `game_runs` log. This work must not change auth
  code or the user profile document's fields.

## Constraints

- Browser-only app; Firestore is the only store and `firestore.rules` the only server-side check.
- All development and verification runs against the local emulators (`docker compose up` or
  `npm run emulators`). No cloud project is involved.
- Rules and data stay compatible with the CCS plan (`feat/ccs-integration`):
  - Users signed in by custom token have no standard `email` claim. Any `users/{uid}` rule must
    not require `request.auth.token.email`.
  - Game-data rules will gain a subscription-expiry check from the CCS work; keep them in one
    helper so that's a one-line addition.
  - CCS reads a `game_runs` collection (not part of this work).

## Game rules (the behaviour to build)

Existing rules stay unchanged unless listed here: the six town templates, the 19 cards (cost,
duration, effects), the five hazards and their effects, scores clamped to 0–100 in steps of 5,
and the existing penalty (if a score falls below 20, −10 to that aspect across all hazards).

**Game length.** When creating a game the facilitator chooses 1–20 rounds (default 5) and
whether to use the on-screen wheel (default on). Both are fixed once the game starts. They can
optionally enter the **number of players** (1–200, blank allowed), which can be corrected until the
game completes. It isn't used by the game rules; it's recorded for CCS's run log. *(Requested by
John/CCS.)*
Legacy games without a stored length are 5-round games.

**Round 0 and starting.** A new game sits at round 0 (setup). *Start game* moves to round 1, stage *Adapt*.

**Stages within a round.** The stored `stage` is one of `adaptation | hazard | review | complete`.
Dividends is the closing step of Review, not a stored stage: *Settle round* opens the dividends dialog,
and confirming it settles the round. *(My call.)* A refresh resumes at the stored stage.

| Stage | What happens | Facilitator actions |
|---|---|---|
| Adapt | Groups discuss and buy adaptation cards for their towns | Play cards; move to Event |
| Event | One or more hazards hit every town | Spin the on-screen wheel, or enter the result of a physical wheel; apply the hazard; see the impact report |
| Review | The room compares towns | Flip town cards to see averages per dimension; charts |
| Dividends | Round closes | Confirm the dividend table, which awards dividends and starts the next round (or finishes the game) |

**Stage rules**, enforced in the rules as well as the UI *(my call)*:
- Cards can only be played in Adapt, and hazards only applied in Event.
- Event → Review needs at least one hazard applied this round.
- Stepping back: Review → Event is allowed, to apply another hazard (up to five per round).
  Event → Adapt is allowed only while no hazard has been applied this round, so nobody can
  buy cards after the hazard has hit. Nothing steps back across a settled round.

**Comparison town.** Bludgeton cannot play adaptation cards. It still receives hazards and dividends,
so the room can compare doing nothing against adapting.

**Hazard wheel.** Five equal sections, uniformly random, using `crypto.getRandomValues`.
The wheel only *selects* a hazard; applying it is a separate confirmed step. With the wheel
turned off, the facilitator picks the hazard from a list. Up to five hazard applications per round,
each recorded in order in the round's event.

**Impact report.** After a hazard is applied, a dialog shows per town: points lost per
dimension (nature, economy, society, health) summed over all hazard types, and overall
resilience before and after. Losses are stored with the round event so the summary can use them later.

**Dividends.** When a round is settled, each town earns **5 EP for every segment at 100**
(a segment is one hazard × dimension score; 20 segments per town). Order of operations when
settling round *r*:

1. Snapshot every town's scores as the round-*r* closing state.
2. Compute and add dividends from that snapshot. Budgets may now exceed 100.
3. If the game continues, move to round *r*+1, apply ongoing card effects scheduled for
   *r*+1, and set the stage to Adapt.
4. If round *r* was the last round, or the facilitator ended early, mark the game complete.
   Cards still running are deactivated and their later effects are never applied.

Dividends for a round are paid exactly once. The dialog shows the amounts before
confirming. After confirming, it shows "already awarded" and must never offer to pay again.

**Ending early.** From round ≥ 1 the facilitator can end the game. That settles the
current round (with dividends) and completes the game with `endedEarly` set. The planned
length is kept for the record.

**End-of-game summary.** Shown when a game completes and can be reopened afterwards.
Per town: final overall resilience, average per dimension, number of weak segments
(≤ 20), total event losses, total dividends earned, final EP. It highlights the most
resilient town(s) and the most impacted town(s), listing everyone tied for first. Bludgeton is
shown in the table, labelled as the comparison town, but is left out of both highlights,
because the "do nothing" town would otherwise always be most impacted. *(My call.)* The
"most impacted" highlight is omitted if any event in the game lacks stored losses (legacy games).

**Games already in progress when this ships** *(my call)*. They use the new flow and rules
from their next action. That means dividends from their next settlement, Bludgeton locked, and
able to end early. Their length is 5 rounds. With no stored `stage`, they open at:
- *setup* if at round 0,
- *Review* if the current round already has a hazard,
- *Adapt* otherwise.

The first move writes the missing fields.

**Manual town edits** stay *(my call)*. The Town Details tab keeps renaming a town and
setting its budget (used to match physical tokens on the table).
- **Renaming** changes only `name` and is not a move.
- **Setting the budget** is a move: one transaction, bumps `revision`, range 0–999 EP. It is not undoable;
  re-enter the old value instead.

Both edits write only the changed field, never the whole town from client state.

## Saving and concurrency

- **One transaction per move.** Playing a card, applying a hazard, changing stage, settling
  a round and undoing each run as a single Firestore transaction that reads the session and
  every document it changes.
- **Revision counter.** Each session has a `revision` that every move increments. The
  client sends the revision it last saw; if the stored one differs, the move is rejected
  with "This game changed elsewhere. Refresh to continue." This stops double clicks, two
  tabs and stale retries. Settling also checks the expected round number.
- **Undo** reverts the most recent card play or hazard application in the current round
  only, and works after a refresh because the before-state is stored. Settlement cannot be undone.
  *(My call: one level of undo. PR #6 also had one level; the current Immer history is unbounded but lost on refresh.)*
- **Security rules** check ownership on every collection: a town, card play, round event
  or round stats document is only readable and writable by the owner of its parent session.
  They also check the exact fields and value ranges of each document type, immutable
  relationships (session, town, card IDs and creation time), and legal round and stage transitions.
  Legacy documents without the new fields must still pass.

### Lessons from the PR #6 review (requirements for this rewrite)

A code review of PR #6 (2026-11-11, findings not yet verified) found these problems. The rewrite must not repeat them:

- **Per-round document IDs are bound in the rules.** `round_events` and `round_stats` use the
  ID `<sessionId>_<round>`, and the create rule requires the ID to match the document's own
  `sessionId` and round. In PR #6 `round_stats` lacked this check, so any user could create a
  document under someone else's session ID and permanently block that game's settlement.
- **Stage changes are moves too.** They bump `revision`, so undo can never reach back across
  a stage change. In PR #6 a hazard could be undone after moving to Review, leaving a round in
  Review with no event, which could then be settled.
- **A saved move is reported as saved.** Re-reading data after a successful transaction is
  separate from the move: if the re-read fails, the UI says "Saved; refresh to see the latest"
  rather than "Failed", so nobody retries and applies a card twice.
- **Settlement reads only active card plays**, not every play in the game's history.
- **A deleted or missing game gives "Game not found"**, not a crash.
- **One definition of the resilience sum**, shared by the impact report, stored losses and the summary.
- **Missing optional fields have one meaning everywhere** (e.g. no `digitalWheelEnabled` means on),
  including in the JSON/Excel export.
- **No leftover code**: anything this work makes unused is removed, including `immer` if the
  old revert history goes.

## Data model changes

All additive; collection names are unchanged.

- `game_sessions`: `totalRounds` (1–20), `playerCount` (1–200 or null), `digitalWheelEnabled`, `stage`
  (`adaptation | hazard | review | complete`), `revision`, `endedEarly`, `lastSettlementRound`,
  `lastDividends` (town ID → EP), and the stored undo state.
- `round_events`: `impactPoints` (town ID → total loss) and `impactComplete`.
- `round_stats`: `dividends` (town ID → EP) for the settled round.
- Towns: `effortPoints` may exceed 100.

## Language and media

- **English/Chinese**: a switcher in the header covering every screen, including login and
  dashboard. The choice is remembered in the browser; the default comes from the browser
  language. Card, hazard and town display names are translated; stored data stays in English.
  A test checks that every UI string has a Chinese entry. Chinese is **Simplified** (`zh-CN`). PR #6's
  Chinese strings are reused as content where they match; new strings are written by the builder and
  listed in the PR for a Chinese speaker to check before release. *(My call.)*
- **Media**: Chinese and English intro videos (offered at game start, skippable), an animated
  GIF per hazard shown during the Event stage, and a hazard icon set. Assets are reused from
  PR #6 with their attribution and licence files. *(My call: the assets are content, not code.
  The videos, about 7.5 MB, are committed under `public/media/`; revisit if more video is added.)*
  Asset paths come from one config file.
- **Training link**: a button linking to the training course, with the URL from config.
  With CCS, this points at the CCS course. Hidden when no URL is set.

## Delivery: five PRs, each merged to `main` before the next

1. **Game rules as pure functions, with unit tests.** Round transitions, dividends, ending early,
   impact calculation and summary, with no Firebase or React. Adds `npm test` using Node's
   built-in test runner (no new dependency). *(My call.)*
2. **Transactions, revision, persisted undo and strict rules.** The services switch to
   transactions; the new `firestore.rules`; an emulator integration test (`npm run test:emulator`)
   that plays a full game, including legacy-game and rejected-write cases.
3. **Facilitated flow UI.** New-game options, stages, wheel, impact dialog, dividends dialog,
   end early, summary, flip cards, comparison-town lock.
4. **English/Chinese.**
5. **Media and training link.**

CCS rebases onto each merge. To keep the overlap small, PR 3 adds a single function per
lifecycle point (game created, game completed) that CCS can later hook to write `game_runs`.

## Verification (every PR)

`npm run lint` (0 errors), `npm run build`, `npm test`, and from PR 2 on `npm run test:emulator`
against the Docker emulators. PR 3 onward also gets a manual walkthrough of a full 2-round
game, an ended-early game and a legacy game in the browser.

## Left to the builder

Component structure and styling (MUI, matching existing screens), the i18n mechanism
(no heavy dependency needed), exact rule expressions, the wheel's animation, and how
the impact and dividend dialogs are laid out.
