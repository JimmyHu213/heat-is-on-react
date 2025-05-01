// src/components/Game/components/TabPanels.jsx
import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";

/**
 * Dashboard Tab Panel
 */
const DashboardPanel = ({ towns, currentRound }) => {
  return (
    <Box>
      {currentRound === 0 ? (
        <WelcomePanel />
      ) : (
        <>
          <SectionTitle title="Town Hazard Overview" />
          <TownPieCharts towns={towns} />

          <SectionTitle title="Town Statistics" sx={{ mt: 4 }} />
          <BarChartsView towns={towns} />
        </>
      )}
    </Box>
  );
};

/**
 * Town Details Tab Panel
 */
const TownDetailsPanel = ({ towns }) => {
  return (
    <Box>
      <SectionTitle title="Town Details" />
      <TownDetailsView towns={towns} />
    </Box>
  );
};

/**
 * Game History Tab Panel
 */
const GameHistoryPanel = ({
  towns,
  roundEvents,
  townCardPlays,
  currentRound,
}) => {
  return (
    <Box>
      <SectionTitle title="Game History" />
      <GameTable
        towns={towns}
        roundEvents={roundEvents}
        townCardPlays={townCardPlays}
        currentRound={currentRound}
      />
    </Box>
  );
};

/**
 * Welcome panel shown at the start of the game
 */
const WelcomePanel = () => {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Welcome to The Heat Is On!
      </Typography>
      <Typography variant="body1" paragraph>
        In this game, you'll manage 5 towns facing climate hazards over 5
        rounds. Each town has different vulnerability levels to hazards:
        bushfires, floods, storms, heatwaves, and biohazards.
      </Typography>
      <Typography variant="body1">
        Click "Start Game" to begin the first round. During each round, you can:
      </Typography>
      <ul>
        <li>Apply hazard events to test town resilience</li>
        <li>Play adaptation cards to improve town resilience</li>
        <li>Track progress through charts and tables</li>
      </ul>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        <strong>Tip:</strong> If any town's resilience score drops below 20 in
        any category, all other categories will receive a -10 point penalty. Use
        adaptation cards strategically to maintain resilience across all towns.
      </Typography>
    </Paper>
  );
};

/**
 * Section title component
 */
const SectionTitle = ({ title, ...props }) => {
  return (
    <Typography variant="h6" fontWeight="bold" gutterBottom {...props}>
      {title}
    </Typography>
  );
};

// Import needed components
// This would be at the top of the file in a real implementation
import TownPieCharts from "./TownPieCharts";
import BarChartsView from "./BarChartsView";
import GameTable from "./GameTable";
import TownDetailsView from "./TownDetailsView";

export { DashboardPanel, TownDetailsPanel, GameHistoryPanel };
