import { t } from '../../../i18n';
// src/components/Game/components/GameSidebar.jsx
import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import HazardControls from "./HazardControls";
import CardControls from "./CardControls";

/**
 * Game sidebar component containing control panels
 */
const GameSidebar = ({
  currentRound,
  towns,
  onApplyHazard,
  onPlayCard,
  disabled,
}) => {
  return (
    <Box sx={{ p: 1 }}>
      {/* Game Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>{t("Game Controls")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {disabled
            ? "Start the game to enable controls"
            : t("Round {0}: Apply hazards or adaptation cards", [currentRound])}
        </Typography>
      </Box>

      {/* Hazard Controls */}
      <HazardControls
        onApplyHazard={onApplyHazard}
        disabled={disabled}
        currentRound={currentRound}
      />

      <Divider sx={{ my: 2 }} />

      {/* Card Controls */}
      <CardControls
        towns={towns}
        onPlayCard={onPlayCard}
        disabled={disabled}
        currentRound={currentRound}
      />
    </Box>
  );
};

export default GameSidebar;
