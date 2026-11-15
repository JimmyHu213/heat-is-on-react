# Presentation Media & Training Link (PR 4 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the presentation media and training-course link defined in the facilitated game flow spec: the English introduction video (`public/media/introduction-en.mp4`), per-hazard event animations (`public/media/events/*.gif`), Tabler SVG hazard icons (`public/media/icons/*.svg`), attribution/license files, a single media & training configuration module (`src/constants/mediaConfig.js`), a configurable training-course link button (hidden when unset), and UI integration in Setup and Event stages.

**Architecture:**
1. Static presentation assets (`introduction-en.mp4`, 5 event GIFs, 5 hazard SVGs, `ATTRIBUTION.txt`, `TABLER-LICENSE.txt`) live under `public/media/` and are referenced from a single config module (`src/constants/mediaConfig.js`) with pure, unit-tested lookup and URL validation helpers (`getValidTrainingUrl`, `getHazardIconPath`, `getEventGifPath`).
2. `HazardIcon` (`src/components/common/HazardIcon.jsx`) renders the configured SVG icon for a hazard ID with automatic `onError` fallback to the corresponding MUI icon, and `TrainingLink` (`src/components/common/TrainingLink.jsx`) renders an external link button (`target="_blank" rel="noopener noreferrer"`) when a valid `http(s)://` training URL is configured or renders `null` when empty/unset.
3. `IntroVideo` (`src/components/Game/components/IntroVideo.jsx`) embeds the skippable introduction video on the Round 0 setup screen in `Game/index.jsx`, while `HazardControls` and `HazardImpactDialog` display the per-hazard event animation GIF (with CC BY 4.0 attribution and `HazardIcon` fallback) during the Event stage.

**Tech Stack:** JavaScript ES modules, React 19, MUI 7 (`@mui/material`, `@mui/icons-material`), Vite 6 (`import.meta.env.VITE_TRAINING_COURSE_URL`), Node 24 built-in test runner (`node:test`, `node:assert/strict`).

**Spec:** `docs/superpowers/specs/2026-11-11-facilitated-game-flow-design.md`

## Global Constraints

- **Single config source:** All media asset paths and the training course URL come from one config file (`src/constants/mediaConfig.js`). Per-browser `localStorage` media URL overrides (`MediaSettings` from PR #6) are an explicit non-goal and must not be added.
- **English-only media:** Since English/Chinese i18n is skipped, only the English introduction video (`public/media/introduction-en.mp4`) is included; do not commit the Chinese `public/media/introduction.mp4` or the `artifacts/introduction-video/` render pipeline.
- **Attribution & licences:** Commit `public/media/ATTRIBUTION.txt` (Animated Noto Emoji CC BY 4.0 & Tabler Icons MIT attribution) and `public/media/TABLER-LICENSE.txt` alongside the assets, and show the CC BY 4.0 credit caption when displaying the built-in event GIFs.
- **Training link visibility:** The training link button (`TrainingLink`) reads its URL from `MEDIA_CONFIG.trainingCourseUrl` (populated from `VITE_TRAINING_COURSE_URL`, or passed via prop for testing) and MUST be hidden (`return null`) when no valid URL is set.
- **Graceful media fallback:** If the intro video fails to load, show an informational message and never block starting the game. If an event GIF or SVG hazard icon fails to load, fall back to the MUI vector icon automatically.
- **Node test compatibility:** `src/constants/mediaConfig.js` must guard `import.meta.env` (`typeof import.meta !== "undefined" && import.meta.env ? ... : {}`) and use explicit `.js` extensions on any relative imports so `node --test` runs directly without Vite.

## Review Focus

1. **Unsafe or malformed `VITE_TRAINING_COURSE_URL` (e.g. `javascript:alert(1)`, whitespace-only `"   "`, or relative path `"/course"`):** `getValidTrainingUrl` must accept only valid `https://` or `http://` URLs and return `""` for anything else so `TrainingLink` stays hidden and never renders an unsafe `href`. *(Task 1)*
2. **Unknown or missing `hazardId` passed to `getHazardIconPath` / `getEventGifPath`:** Passing `null`, `undefined`, `""`, or `"earthquake"` must return `null` (not `undefined` or throw), and `Object.prototype` keys like `"toString"` or `"__proto__"` must not resolve as truthy asset paths. *(Task 1)*
3. **Training link rendered when no URL is configured:** Unlike PR #6 (which rendered a disabled `"Training coming soon"` button), the spec requires *"Hidden when no URL is set."* When `trainingCourseUrl` is `""`, `TrainingLink` must return `null`. *(Task 2)*
4. **Broken/missing SVG or GIF asset URL at runtime:** `HazardIcon` and `HazardImpactDialog` must track failed asset URLs in state (`failedUrl === url`) and fall back to the MUI icon rather than leaving a broken `<img>` element or getting stuck if `hazardId` changes to a different hazard. *(Tasks 2, 3)*
5. **Skippable intro video at game start:** In Round 0 (`setup`), the facilitator must be able to click **Start Game** immediately without waiting for the video, or click **Skip / Hide Video** to collapse the player, and a video load error (`onError`) must display a non-blocking info alert. *(Task 3)*

## File Structure

| File | Responsibility |
|---|---|
| `public/media/ATTRIBUTION.txt` | Attribution and license summary for Animated Noto Emoji (CC BY 4.0) and Tabler Icons (MIT) |
| `public/media/TABLER-LICENSE.txt` | MIT license text for Tabler SVG icons |
| `public/media/introduction-en.mp4` | English workshop introduction video offered at Round 0 game setup |
| `public/media/events/{bushfire,flood,stormSurge,heatwave,biohazard}.gif` | Animated Noto Emoji GIFs displayed for each climate hazard during the Event stage |
| `public/media/icons/{bushfire,flood,stormSurge,heatwave,biohazard}.svg` | Tabler outline SVG icons styled in each hazard's palette colour |
| `src/constants/mediaConfig.js` | Single config source (`MEDIA_CONFIG`) and pure helpers (`getValidTrainingUrl`, `getHazardIconPath`, `getEventGifPath`) |
| `src/constants/mediaConfig.test.js` | Unit tests for `MEDIA_CONFIG`, `getValidTrainingUrl`, `getHazardIconPath`, and `getEventGifPath` |
| `src/components/common/HazardIcon.jsx` | Renders a hazard's SVG icon from `MEDIA_CONFIG` with `onError` fallback to the matching MUI icon |
| `src/components/common/TrainingLink.jsx` | Renders the external training-course button when `MEDIA_CONFIG.trainingCourseUrl` is set; returns `null` when unset |
| `src/components/Game/components/IntroVideo.jsx` | Skippable Round 0 introduction video player with show/hide toggle and graceful load-error fallback |
| `src/components/Dashboard/index.jsx` | Renders `<TrainingLink />` in the facilitator profile panel when configured |
| `src/components/Charts/TownPieChart.jsx` | Uses `<HazardIcon>` inside the radial chart's 5 hazard sector markers |
| `src/components/Game/components/GameTable.jsx` | Uses `<HazardIcon>` on round event chips |
| `src/components/Game/components/HazardControls.jsx` | Uses `<HazardIcon>` on hazard selection buttons and previews the event animation in the confirmation dialog |
| `src/components/Game/components/HazardImpactDialog.jsx` | Displays the applied hazard's animated GIF, CC BY 4.0 attribution, and `<HazardIcon>` fallback above the per-town impact table |
| `src/components/Game/index.jsx` | Embeds `<IntroVideo />` in the Round 0 setup card and `<TrainingLink />` in the top AppBar |

---

### Task 1: Presentation Media Assets (`public/media/`) and Single Config Module (`src/constants/mediaConfig.js`)

**Files:**
- Create: `public/media/ATTRIBUTION.txt`
- Create: `public/media/TABLER-LICENSE.txt`
- Create: `public/media/introduction-en.mp4`
- Create: `public/media/events/bushfire.gif`
- Create: `public/media/events/flood.gif`
- Create: `public/media/events/stormSurge.gif`
- Create: `public/media/events/heatwave.gif`
- Create: `public/media/events/biohazard.gif`
- Create: `public/media/icons/bushfire.svg`
- Create: `public/media/icons/flood.svg`
- Create: `public/media/icons/stormSurge.svg`
- Create: `public/media/icons/heatwave.svg`
- Create: `public/media/icons/biohazard.svg`
- Create: `src/constants/mediaConfig.js`
- Create: `src/constants/mediaConfig.test.js`

**Interfaces:**
- Produces in `src/constants/mediaConfig.js`:
  - `MEDIA_CONFIG`: frozen object with:
    - `introVideo: "/media/introduction-en.mp4"`
    - `eventGifs`: `{ bushfire: "/media/events/bushfire.gif", flood: "/media/events/flood.gif", stormSurge: "/media/events/stormSurge.gif", heatwave: "/media/events/heatwave.gif", biohazard: "/media/events/biohazard.gif" }`
    - `hazardIcons`: `{ bushfire: "/media/icons/bushfire.svg", flood: "/media/icons/flood.svg", stormSurge: "/media/icons/stormSurge.svg", heatwave: "/media/icons/heatwave.svg", biohazard: "/media/icons/biohazard.svg" }`
    - `eventGifAttribution`: `{ label: "Animated Noto Emoji · Google", url: "https://googlefonts.github.io/noto-emoji-files/", licenseLabel: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" }`
    - `trainingCourseUrl`: `getValidTrainingUrl(envTrainingUrl)` (reads `import.meta.env?.VITE_TRAINING_COURSE_URL`)
  - `getValidTrainingUrl(rawUrl)`: returns trimmed `rawUrl` if it is a string with an `http:` or `https:` protocol (`new URL(trimmed)`), otherwise `""`.
  - `getHazardIconPath(hazardId, config = MEDIA_CONFIG)`: returns `config.hazardIcons[hazardId]` if `typeof hazardId === "string"` and `Object.hasOwn(config?.hazardIcons ?? {}, hazardId)`, otherwise `null`.
  - `getEventGifPath(hazardId, config = MEDIA_CONFIG)`: returns `config.eventGifs[hazardId]` if `typeof hazardId === "string"` and `Object.hasOwn(config?.eventGifs ?? {}, hazardId)`, otherwise `null`.

- [ ] **Step 1: Write the failing unit tests in `src/constants/mediaConfig.test.js`**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  MEDIA_CONFIG,
  getValidTrainingUrl,
  getHazardIconPath,
  getEventGifPath,
} from "./mediaConfig.js";

test("MEDIA_CONFIG defines English intro video, all 5 event GIFs, and all 5 hazard icons", () => {
  assert.equal(MEDIA_CONFIG.introVideo, "/media/introduction-en.mp4");
  const expectedHazards = ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"];
  for (const id of expectedHazards) {
    assert.equal(MEDIA_CONFIG.eventGifs[id], `/media/events/${id}.gif`);
    assert.equal(MEDIA_CONFIG.hazardIcons[id], `/media/icons/${id}.svg`);
  }
});

test("getValidTrainingUrl accepts https/http URLs and rejects empty, relative, or javascript: URLs", () => {
  assert.equal(
    getValidTrainingUrl("  https://ccs.utas.edu.au/training/heat-is-on  "),
    "https://ccs.utas.edu.au/training/heat-is-on"
  );
  assert.equal(
    getValidTrainingUrl("http://localhost:8080/training"),
    "http://localhost:8080/training"
  );
  assert.equal(getValidTrainingUrl(""), "");
  assert.equal(getValidTrainingUrl("   "), "");
  assert.equal(getValidTrainingUrl(null), "");
  assert.equal(getValidTrainingUrl(undefined), "");
  assert.equal(getValidTrainingUrl("/relative/path"), "");
  assert.equal(getValidTrainingUrl("javascript:alert(1)"), "");
});

test("getHazardIconPath and getEventGifPath return paths for known hazards and null for unknown or prototype keys", () => {
  assert.equal(getHazardIconPath("bushfire"), "/media/icons/bushfire.svg");
  assert.equal(getEventGifPath("stormSurge"), "/media/events/stormSurge.gif");
  assert.equal(getHazardIconPath("unknown"), null);
  assert.equal(getEventGifPath("toString"), null);
  assert.equal(getHazardIconPath("__proto__"), null);
  assert.equal(getEventGifPath(null), null);
});
```

- [ ] **Step 2: Run `npm test` to verify it fails**
  Run: `npm test src/constants/mediaConfig.test.js`
  Expected: FAIL (`Cannot find module './mediaConfig.js'`).

- [ ] **Step 3: Check out the static assets from `pr-6` into `public/media/` and implement `src/constants/mediaConfig.js`**
  Run:
  `git checkout pr-6 -- public/media/ATTRIBUTION.txt public/media/TABLER-LICENSE.txt public/media/introduction-en.mp4 public/media/events public/media/icons`
  And create `src/constants/mediaConfig.js` implementing `MEDIA_CONFIG`, `getValidTrainingUrl`, `getHazardIconPath`, and `getEventGifPath`.

- [ ] **Step 4: Run tests and lint to verify they pass**
  Run: `npm test && npm run lint`
  Expected: PASS (58 unit tests pass, 0 lint errors).

- [ ] **Step 5: Commit**
  `git add public/media src/constants/mediaConfig.js src/constants/mediaConfig.test.js && git commit -m "feat: add presentation media assets and single mediaConfig module"`

---

### Task 2: `HazardIcon` and `TrainingLink` Components + Dashboard/Chart/Table Integration

**Files:**
- Create: `src/components/common/HazardIcon.jsx`
- Create: `src/components/common/TrainingLink.jsx`
- Delete: `src/constants/event_icons.js` (unused legacy helper superseded by `HazardIcon`)
- Modify: `src/components/Dashboard/index.jsx`
- Modify: `src/components/Charts/TownPieChart.jsx`
- Modify: `src/components/Game/components/GameTable.jsx`

**Interfaces:**
- Consumes from `src/constants/mediaConfig.js`: `MEDIA_CONFIG`, `getHazardIconPath`, `getValidTrainingUrl`
- Produces in `src/components/common/HazardIcon.jsx`:
  - `HazardIcon({ hazardId, color, size = 24, sx })`:
    - Looks up `iconUrl = getHazardIconPath(hazardId)` and fallback colour (`bushfireColor1`, `floodColor1`, `stormSurgeColor1`, `heatwaveColor1`, `biohazardColor1`).
    - Tracks `[failedUrl, setFailedUrl] = useState(null)`.
    - When `iconUrl && failedUrl !== iconUrl`, renders `<Box component="img" src={iconUrl} alt="" width={size} height={size} onError={() => setFailedUrl(iconUrl)} sx={{ width: size, height: size, objectFit: "contain", display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...sx }} />`.
    - Otherwise renders the fallback MUI icon (`LocalFireDepartmentIcon`, `FloodIcon`, `ThunderstormIcon`, `WbSunnyIcon`, `BugReportIcon`) with `sx={{ color: resolvedColor, fontSize: size, ...sx }}`.
- Produces in `src/components/common/TrainingLink.jsx`:
  - `TrainingLink({ url = MEDIA_CONFIG.trainingCourseUrl, variant = "outlined", color = "primary", size = "medium", fullWidth = false, sx })`:
    - Computes `validUrl = getValidTrainingUrl(url)`.
    - If `!validUrl`, returns `null` (strictly hidden when no URL is configured).
    - Otherwise renders `<Button component="a" href={validUrl} target="_blank" rel="noopener noreferrer" variant={variant} color={color} size={size} fullWidth={fullWidth} startIcon={<SchoolIcon />} sx={sx}>Training Course</Button>`.

- [ ] **Step 1: Create `src/components/common/HazardIcon.jsx` and `src/components/common/TrainingLink.jsx`, and delete unused `src/constants/event_icons.js`**
- [ ] **Step 2: Integrate `TrainingLink` in `src/components/Dashboard/index.jsx` and `HazardIcon` in `TownPieChart.jsx` and `GameTable.jsx`**
  - In `src/components/Dashboard/index.jsx`: render `<TrainingLink fullWidth sx={{ mt: 1.5 }} />` in the User Profile paper above the Logout button (hidden automatically when `VITE_TRAINING_COURSE_URL` is unset).
  - In `src/components/Charts/TownPieChart.jsx`: replace the 5 hardcoded `<foreignObject>` MUI icons with `<HazardIcon hazardId="..." size={24} />`.
  - In `src/components/Game/components/GameTable.jsx`: use `<HazardIcon hazardId={hazardId} size={18} />` for the round event chips.
- [ ] **Step 3: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: PASS (0 lint errors, production build succeeds).
- [ ] **Step 4: Commit**
  `git add -A src/components/common/HazardIcon.jsx src/components/common/TrainingLink.jsx src/constants/event_icons.js src/components/Dashboard/index.jsx src/components/Charts/TownPieChart.jsx src/components/Game/components/GameTable.jsx && git commit -m "feat: add HazardIcon and TrainingLink components and wire into Dashboard and charts"`

---

### Task 3: Skippable `IntroVideo` at Setup and Event Animations in `HazardControls` & `HazardImpactDialog`

**Files:**
- Create: `src/components/Game/components/IntroVideo.jsx`
- Modify: `src/components/Game/components/HazardControls.jsx`
- Modify: `src/components/Game/components/HazardImpactDialog.jsx`
- Modify: `src/components/Game/index.jsx`

**Interfaces:**
- Consumes from `src/constants/mediaConfig.js`: `MEDIA_CONFIG`, `getEventGifPath`
- Consumes from `src/components/common/`: `HazardIcon`, `TrainingLink`
- Produces in `src/components/Game/components/IntroVideo.jsx`:
  - `IntroVideo({ src = MEDIA_CONFIG.introVideo, onStartGame, loading = false })`:
    - Tracks `[hidden, setHidden] = useState(false)` and `[failedUrl, setFailedUrl] = useState(null)`.
    - Header row with `"Workshop Introduction Video"` title and a button to **Skip / Hide Video** (or **Show Video** when hidden).
    - When not hidden: if `failedUrl === src`, shows `<Alert severity="info">The introduction video could not be loaded. You can still start the game.</Alert>`; otherwise renders `<Box component="video" key={src} src={src} controls preload="metadata" aria-label="The Heat Is On introduction video" onError={() => setFailedUrl(src)} sx={{ width: "100%", maxHeight: 420, bgcolor: "#111", borderRadius: 2, display: "block" }} />`.
    - When `onStartGame` is provided, also offers a prominent **Start Game** button so the facilitator can start immediately before, during, or after the video.
- Updates `src/components/Game/components/HazardControls.jsx`:
  - Uses `<HazardIcon hazardId={hazard.id} size={22} />` on the hazard buttons.
  - Inside the Confirm Hazard dialog (`selectedHazard`), displays the event animation GIF (`getEventGifPath(selectedHazard.id)`) or `<HazardIcon hazardId={selectedHazard.id} size={64} />` fallback above the N/E/S/H effect summary.
- Updates `src/components/Game/components/HazardImpactDialog.jsx`:
  - Displays a visual banner at the top of the dialog with the applied hazard's animated GIF (`getEventGifPath(hazardId)`), falling back to `<HazardIcon hazardId={hazardId} size={72} />` on load error, plus the CC BY 4.0 attribution link (`MEDIA_CONFIG.eventGifAttribution`) when showing the built-in GIF.
- Updates `src/components/Game/index.jsx`:
  - Renders `<TrainingLink color="inherit" variant="outlined" size="small" sx={{ mr: 1.5, borderColor: "white", color: "white" }} />` in the Game `AppBar` (hidden when no URL is set).
  - Embeds `<IntroVideo onStartGame={handleStartGame} loading={loading} />` inside the `currentRound === 0` Welcome / Setup paper on the Dashboard tab.

- [ ] **Step 1: Create `src/components/Game/components/IntroVideo.jsx` and update `HazardControls.jsx`, `HazardImpactDialog.jsx`, and `Game/index.jsx`**
- [ ] **Step 2: Run unit tests, lint, and build**
  Run: `npm test && npm run lint && npm run build`
  Expected: all unit tests pass, 0 lint errors, production build succeeds.
- [ ] **Step 3: Commit**
  `git add src/components/Game/components/IntroVideo.jsx src/components/Game/components/HazardControls.jsx src/components/Game/components/HazardImpactDialog.jsx src/components/Game/index.jsx && git commit -m "feat: add skippable IntroVideo and hazard event animations"`
