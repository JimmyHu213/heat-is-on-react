# The Heat Is On - Climate Change Adaptation Game

## Project Overview

"The Heat Is On" is an interactive React-based web application that simulates climate adaptation strategies for towns facing various environmental hazards. Players manage multiple towns over a series of rounds (years), applying adaptation cards and responding to climate hazards to improve town resilience across different dimensions: nature, economy, society, and health.

## Key Features

- **User Authentication**: Sign up, login, and password reset functionality using Firebase Authentication
- **Game Sessions**: Users can create and manage up to 3 active game sessions
- **Town Management**: Each game session contains 6 towns with different vulnerability profiles
- **Climate Hazards**: Towns face different types of hazards (bushfires, floods, storm surges, heatwaves, biohazards)
- **Adaptation Cards**: Players can play cards to improve town resilience in different dimensions
- **Visual Representation**: Interactive charts and visual indicators of town health
- **Game History**: Track game events and card plays across rounds
- **Progress Tracking**: Monitor town resilience across multiple dimensions

## Technical Architecture

### Frontend
- **React**: Core library for building the UI
- **Material-UI**: Component library for styling and UI elements
- **Recharts**: For data visualization (bar charts, pie charts)
- **React Router**: For application routing

### Backend
- **Firebase Authentication**: User authentication and management
- **Firestore**: NoSQL database for storing game data
- **Firebase Hosting**: For deploying the application

### Data Structure
- The application uses a complex data model representing game sessions, towns, hazards, and adaptation cards
- Town resilience is measured across 4 dimensions (nature, economy, society, health) for 5 different hazard types

### State Management
- Context API for global state management (AuthContext, GameContext)
- Custom hooks for accessing context state
- Immer for immutable state updates

## Setup Instructions

1. **Prerequisites**:
   - Node.js (v20 or higher)
   - npm or yarn
   - Firebase account

2. **Installation**:
   ```bash
   git clone [repository-url]
   cd the-heat-is-on
   npm install
   ```

3. **Firebase Configuration**:
   - Use the existing `heat-is-on-react` Firebase project and its registered Web app.
   - Enable Authentication (Email/Password)
   - Create a Firestore database

4. **Environment Variables**:
   - Create `.env.local` in the project root and fill in the registered Firebase Web
     app configuration. `.env.local` is ignored by Git. Deployment environments
     must supply these variables before building; there are no project defaults in source.
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

6. **Build for Production**:
   ```bash
   npm run build
   ```

7. **Deploy to Firebase Hosting**:
   - This repository targets the existing Firebase project `heat-is-on-react`.
   - `src/firebase/config.js` reads all configuration from `VITE_FIREBASE_*`
     environment variables, including optional emulator connection settings.
   - Log in and deploy:
   ```bash
   npx -y firebase-tools@latest login
   npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project heat-is-on-react
   ```
   - The deploy command builds the app automatically, publishes `dist`, and
     updates the Firestore rules required by stages and early game completion.
     Client-side routes are served through `index.html`.

## Game Mechanics

### Demo data

Sign in with `demo@example.com` / `password123` to explore three seeded games:
a new game, a game in round 2, and a completed five-round game. Together they
contain 18 towns, 7 hazard event records, 7 round snapshots and 35 card plays.

To populate missing demo records again:

```bash
npm run seed:demo
```

The seed script uses the default `heat-is-on-react` Web app configuration,
reuses the demo account, and preserves existing records. It requires the
email/password provider, Firestore rules and indexes to be deployed first.
Firestore is provisioned as the Standard `(default)` database in
`asia-southeast1`.

1. **Game Sessions**: New games have 1–20 configured rounds (years); older games default to 5
2. **Towns**: Each session has 6 towns with different vulnerability profiles
3. **Hazards**: Players can apply hazards (bushfires, floods, etc.) to test town resilience
4. **Adaptation Cards**: Players spend town effort points to play adaptation cards
5. **Resilience Scores**: At the start of an event, an aspect at or below 20 in any hazard triggers a 10-point penalty to that aspect across all hazards
6. **Reflection**: Compare resilience, event impacts and adaptation decisions in the closing summary

## Project Structure

- `/src/components`: UI components organized by feature
- `/src/contexts`: Global context providers
- `/src/firebase`: Firebase configuration
- `/src/models`: Data models for game entities
- `/src/services`: Firebase and game logic services
- `/src/constants`: Game constants (hazards, cards, towns)
- `/src/utils`: Utility functions

## Future Enhancements

- Multiplayer functionality
- More hazard types and adaptation cards
- AI opponent
- Enhanced visualizations
- Mobile responsiveness improvements
- Tutorial mode

## Credits

This game was created as an educational tool about climate change adaptation strategies and is a collaboration between multiple organizations as indicated in the footer.


## Presenter controls

New games let the presenter choose 1–20 rounds, with the digital hazard
wheel enabled by default. Existing games keep their original five-round length. The wheel can be
switched off during play to use a physical wheel and select the result manually.
When enabled, entering review requires a confirmed event in the current round;
canceling the event confirmation does not count. The reminder opens the wheel controls.
After applying an event, View impact opens a six-town report including Bludgeton,
actual NESH losses (including cascading penalties), total lost points and average
resilience before/after. View last event impact reopens that report during the session.
All adaptation cards appear in a single alphabetically sorted dropdown.

Closing a round shows a dividend preview. Each of the town's twenty hazard/NESH
segments at exactly 100 earns 5 EP, including Bludgeton. Confirming settles all
six budgets, saves closing scores and dividends, advances the session, and
applies the next round's ongoing card effects in a Firestore transaction. The
final played round also earns dividends. Repeated submissions for the same
round cannot pay again. The last dividend list remains available after refresh.

### Introduction video, event GIFs and designer icons

Open **Presentation media** inside a game to enter direct MP4/WebM video URLs,
event GIF URLs, and SVG/PNG icon URLs. These overrides are saved in the current
browser. Empty entries use the bundled videos, GIFs and icons; broken media
does not block play.

For shared defaults, place the supplied assets in `public/media/` and edit
`public/presentation.json`, for example:

```json
{
  "introVideo": "/media/introduction.mp4",
  "introVideoEn": "/media/introduction-en.mp4",
  "eventGifs": { "bushfire": "/media/events/bushfire.gif" },
  "hazardIcons": { "bushfire": "/media/icons/bushfire.svg" }
}
```

The keys are `bushfire`, `flood`, `stormSurge`, `heatwave`, and `biohazard`.
Both introduction videos, five GIFs and five SVG icons are included. Project
defaults are bundled with Hosting; non-empty browser overrides take precedence until
**Use project defaults** is selected. Media URLs must use HTTPS/HTTP or a local
path beginning with `/`.

### Local verification

```bash
npm run test:game
npx firebase-tools emulators:exec --only auth,firestore --project demo-heat-is-on-react 'npm run test:game:emulator'
```

To rehearse the UI with an isolated database and the demo login:

```bash
npx firebase-tools emulators:exec --only auth,firestore --project demo-heat-is-on-react 'DEMO_EMULATORS=1 npm run seed:demo && VITE_USE_FIREBASE_EMULATORS=true VITE_FIREBASE_PROJECT_ID=demo-heat-is-on-react npm run dev -- --host 127.0.0.1 --port 5174 --strictPort'
```

`VITE_USE_FIREBASE_EMULATORS` only takes effect in development. Production
builds use the existing Firebase project. Deploy the updated rules together
with Hosting when this version is ready for release.


### Guided play and closing summary

The presenter moves through **Adapt → Event → Review → Dividends** with a single
forward button. The current stage survives refresh; previous-stage buttons let
you revisit decisions. Each of the six town cards flips between the existing
hazard chart and a NESH radar plot. NESH values average each aspect across the
five hazards on a 0–100 scale.

**End game** closes and pays the current round before ending early. It preserves
the planned round count, skips future ongoing-card effects and saves the played
round count for history and export. It is available after starting the game.

After the awarded-dividend prompt closes, a summary opens automatically;
**View summary** reopens it for completed games. It includes all six towns,
including Bludgeton, events by round, tied resilience highlights, event loss,
vulnerable segments, dividends and budgets. Final resilience is the average of
the 20 segments. Event loss is the actual number of points removed by hazards
and cascading penalties, recorded atomically with the event. Older records
without these measurements show impact data as unavailable rather than
estimating rankings from card gains or final scores.

Cards, events and undo use transactions. Undo targets the exact card-play ID
and restores cumulative event impacts; it rejects stale actions after another
browser changes game scores or budgets.

### Agreed improvement scope

The active UI implements only these two groups, alongside the requested
Chinese/English language switch:

1. Configurable starting round count, introduction video, event GIFs, designer
   hazard icons, one adaptation-card dropdown, optional digital hazard wheel,
   automatic 5 EP dividends per segment at 100%, and a presenter settlement prompt.
2. Closing summary with events, measured event impacts and resilience highlights
   including Bludgeton, flippable NESH charts, guided stages, and early game ending.

Five event GIFs from Google Animated Noto Emoji and five designer SVG icons
from Tabler are bundled under `public/media` and configured in
`public/presentation.json`. GIFs appear when an event is confirmed; the new
icons are used on the hazard charts and controls. These are illustrative
animations. Attribution is shown with the animations and stored in
`public/media/ATTRIBUTION.txt`; Tabler's MIT notice is included alongside it.

User-recorded introduction videos are bundled as `public/media/introduction.mp4`
(Chinese) and `public/media/introduction-en.mp4` (English). The video follows the
selected interface language. Replace their URLs through **Presentation media**
or `introVideo` / `introVideoEn` in `public/presentation.json`. Empty browser
overrides fall back to bundled presentation media.

Subscription and training entry points and the subscription route are excluded
from the active application.

### Chinese and English

Use **English / 中文** at the top of any page to change the interface language.
The selection is saved in this browser and survives refresh; the first visit
uses Chinese for Chinese browser languages and English otherwise. Switching
language keeps form inputs and game progress. Built-in cards, hazards, charts,
prompts and summaries are translated; custom game/town names stay as entered.
Translation messages live in `src/i18n/zh.js`.
Run `npm run test:i18n` to check interpolation and language behavior.
