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
   - Node.js (v14 or higher)
   - npm or yarn
   - Firebase account

2. **Installation**:
   ```bash
   git clone [repository-url]
   cd the-heat-is-on
   npm install
   ```

3. **Firebase Configuration**:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Update `src/firebase/config.js` with your Firebase configuration

4. **Environment Variables**:
   - Create a `.env` file with your Firebase API keys
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

## Game Mechanics

1. **Game Sessions**: Each game consists of 5 rounds (years)
2. **Towns**: Each session has 6 towns with different vulnerability profiles
3. **Hazards**: Players can apply hazards (bushfires, floods, etc.) to test town resilience
4. **Adaptation Cards**: Players spend town effort points to play adaptation cards
5. **Resilience Scores**: If any dimension drops below 20 points, a penalty is applied to all other dimensions
6. **Winning**: The goal is to maintain high resilience scores across all towns by the end of round 5

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
