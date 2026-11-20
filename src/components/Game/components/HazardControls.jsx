// src/components/Game/components/HazardControls.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Alert,
  Chip,
} from "@mui/material";
import { hazards } from "../../../constants/hazards";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";
import { MAX_HAZARDS_PER_ROUND } from "../../../game/stages.js";
import { WHEEL_SLICES } from "../../../game/wheel.js";
import HazardIcon from "../../common/HazardIcon";
import HazardWheel from "./HazardWheel";

const HAZARD_COLORS = {
  bushfire: bushfireColor1,
  flood: floodColor1,
  stormSurge: stormSurgeColor1,
  heatwave: heatwaveColor1,
  biohazard: biohazardColor1,
};

const HazardControls = ({
  onApplyHazard,
  disabled,
  currentRound,
  onNext,
  digitalWheelEnabled = true,
  hazardCountThisRound = 0,
}) => {
  const [mysterySelected, setMysterySelected] = useState(false);
  const limitReached = hazardCountThisRound >= MAX_HAZARDS_PER_ROUND;
  const controlsDisabled = disabled || limitReached;

  const getHazardColor = (hazardId) => HAZARD_COLORS[hazardId] || "grey.500";

  const handleHazardSelect = (hazard) => {
    if (!hazard) return;
    if (hazard.isMystery || hazard.id === "mystery") {
      setMysterySelected(true);
      return;
    }
    onApplyHazard(hazard.id);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pr: 4,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Event: Climate Hazard
        </Typography>
        <Chip
          label={`${hazardCountThisRound} / ${MAX_HAZARDS_PER_ROUND} this year`}
          size="small"
          color={hazardCountThisRound > 0 ? "warning" : "default"}
        />
        {mysterySelected && onNext && (
          <Button variant="contained" size="small" disabled={disabled} onClick={onNext}>
            Next
          </Button>
        )}
      </Box>

      {limitReached ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Maximum of {MAX_HAZARDS_PER_ROUND} hazards reached for Year{" "}
          {2050 + currentRound}.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {digitalWheelEnabled !== false
            ? "Spin the wheel or choose a hazard below to apply immediately."
            : "Select the hazard landed on your physical wheel to apply immediately."}
        </Typography>
      )}

      {digitalWheelEnabled !== false && (
        <HazardWheel
          hazards={WHEEL_SLICES}
          disabled={controlsDisabled}
          onSelectHazard={handleHazardSelect}
        />
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mt: 1 }}
      >
        {digitalWheelEnabled !== false
          ? "Or select hazard manually:"
          : "Select hazard:"}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
        {hazards.map((hazard) => {
          const color = getHazardColor(hazard.id);

          return (
            <Tooltip key={hazard.id} title={`Apply ${hazard.name} hazard`}>
              <span style={{ flex: "1 1 110px" }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  disabled={controlsDisabled}
                  startIcon={
                    <HazardIcon
                      hazardId={hazard.id}
                      color={color}
                      size={20}
                    />
                  }
                  onClick={() => handleHazardSelect(hazard)}
                  sx={{
                    borderColor: color,
                    color: color,
                    "&:hover": {
                      borderColor: color,
                      backgroundColor: `${color}10`,
                    },
                    justifyContent: "center",
                    textTransform: "none",
                  }}
                >
                  {hazard.name}
                </Button>
              </span>
            </Tooltip>
          );
        })}
        {digitalWheelEnabled === false && (
          <Button size="small" variant={mysterySelected ? "contained" : "outlined"}
            aria-pressed={mysterySelected} disabled={controlsDisabled}
            onClick={() => setMysterySelected(true)}>
            Mystery (?)
          </Button>
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, fontStyle: "italic" }}
      >
        Note: Applying a hazard reduces town resilience scores and triggers a
        -10 penalty across all hazards for any aspect already at or below 20.
      </Typography>
    </Box>
  );
};

export default HazardControls;
