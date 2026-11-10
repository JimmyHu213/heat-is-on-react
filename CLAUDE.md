# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated issues, mention them — don't fix them.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan with verification at each step.

## 5. Project Context

**Purpose:** A web dashboard where trained facilitators run "The Heat Is On" climate-adaptation workshop game (6 towns, 5 rounds, hazards and adaptation cards). Facilitators subscribe via the UTAS Xetta portal and complete training on the CCS WordPress site, which signs them in to this dashboard.

**Targets:**
- CCS integration: sign-in via a Firebase custom token minted by the CCS site (`/auth#token=...`); a `sub_expires` claim (Unix seconds) and a 24-hour session limit, checked on every page load in the app *and* enforced in `firestore.rules`; a permanent `game_runs` log the CCS site can read; then retire the app's own signup/login at an agreed cut-over date.

**Requirements & constraints:**
- Existing users' Firebase UIDs and saved game sessions must survive the CCS migration.

**Tech stack:** JavaScript (ES modules, no TypeScript), React 19, Vite 6, MUI 7 (Emotion), React Router 7, Firebase JS SDK 11 (Auth + Firestore). Node 24 in Docker images.

**Architecture:**
- Client-only SPA; there is no backend of our own. All persistence is Firestore, accessed directly from the browser, so `firestore.rules` is the only server-side enforcement.
- `src/firebase/config.js` initialises Firebase from `VITE_FIREBASE_*` env vars (`.env`). When `VITE_USE_FIREBASE_EMULATOR=true` (set by `.env.emulator` / `vite --mode emulator`) it uses the `demo-heat-is-on` project and connects to the local Auth (127.0.0.1:9099) and Firestore (127.0.0.1:8080) emulators.
- Routes (`src/App.jsx`): `/login`, `/signup`, `/forgot-password`, `/` (Dashboard, private), `/game/:sessionId` (private, via `PrivateRoute`).
- State lives in React contexts (`src/contexts`: Auth, Game, Settings). Components call context functions, contexts call `src/services/*`; services own all Firestore access (`firestoreService` is the generic CRUD layer).
- Every game action (card play, hazard, round advance) is written to Firestore immediately, so leaving and returning resumes the game. Undo history (Immer, in memory) is not persisted.
- Firestore collections: `users/{uid}`, `game_sessions` (owned by `userId`, max 3 active per user), and per-session `towns`, `card_plays`, `round_events`, `round_stats` (linked by `sessionId`).
- Game rules data (cards, hazards, towns) is defined in `src/constants` and read from there; `gameSettingSerivice.js` (sic) can seed copies into Firestore but nothing calls it.

**Key dependencies:**
- `firebase`: auth and database.
- `immer`: immutable updates and the revert/undo history.
- `recharts`: town bar and pie charts.
- `xlsx`: exporting game session data to Excel.
- `firebase-tools` (dev): Firebase CLI and local emulators.

**Commands:**

| Task | Command |
|------|---------|
| Install | `npm install` |
| Run locally (Docker, no host Java needed) | `docker compose up --build` (app :5173, emulator UI :4000; `docker compose down` exports data to `.emulator-data/`) |
| Run locally (host) | `npm run emulators` (needs Java 21 on PATH) + `npm run dev:emulator` |
| Run against a cloud project | `npm run dev` (uses `.env`) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Deploy Firestore rules | `npx firebase deploy --only firestore:rules --project <project-id>` |

There is no test suite. Verify changes with lint, build, and by exercising the flow against the emulators.

## 6. Coding Standards

- Follow existing patterns in the codebase.
- No premature abstractions — three similar lines beat one speculative helper.
- Prefer readability over cleverness.
- Error handling at system boundaries only (user input, external APIs).

## 7. Git Workflow

- Conventional Commits required: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, `style:`
- Keep PRs small and focused — one concern per PR.
- Write meaningful commit messages explaining why, not what.
- Never force-push to shared branches.
- For a new feature, create a git worktree in the same parent folder as the repo (e.g. `git worktree add ../<repo>-<feature> -b feat/<feature>`) and develop there.
- After the feature is merged, clean up: remove the worktree and delete the branch locally and on the remote.

## 8. PR Expectations

- Fill out the PR template completely.
- Ensure all CI checks pass before requesting review.
- Respond to CodeRabbit/Copilot findings — dismiss with a reason or fix.

## 9. File Organization

- Co-locate related files.
- Avoid deep nesting.
- `src/components/<Feature>/index.jsx` is the feature's entry component; larger features split into `components/` and `layout/` subfolders (see `src/components/Game`).
- `src/model/` (singular) holds plain data classes; `src/constants/` holds game data (cards, hazards, towns, palette, icons).
- Firestore access goes in `src/services/`, never directly in components or contexts. Firebase Auth calls live in `src/contexts/AuthContext.jsx`.
- `docker/` holds the Dockerfiles and a container-only `firebase.json` (0.0.0.0 hosts) that `docker-compose.yml` mounts over the root `firebase.json`.
- Commit `firebase.json`, `firestore.rules` and `.env.emulator`. Never commit `.env`, `.firebaserc` or `.emulator-data/`.
