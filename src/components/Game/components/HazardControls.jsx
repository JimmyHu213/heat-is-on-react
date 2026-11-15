// src/components/Game/components/HazardControls.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
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
  currentStage = "hazard",
  digitalWheelEnabled = true,
  hazardCountThisRound = 0,
}) => {
  const [mysteryBanner, setMysteryBanner] = useState(false);

  const isHazardStage = currentStage === "hazard";
  const limitReached = hazardCountThisRound >= MAX_HAZARDS_PER_ROUND;
  const controlsDisabled = disabled || !isHazardStage || limitReached;

  const getHazardColor = (hazardId) => HAZARD_COLORS[hazardId] || "grey.500";

  const handleHazardSelect = (hazard) => {
    if (!hazard) return;
    if (hazard.isMystery || hazard.id === "mystery") {
      setMysteryBanner(true);
      return;
    }
    setMysteryBanner(false);
    onApplyHazard(hazard.id);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
      </Box>

      {mysteryBanner && (
        <Alert
          severity="info"
          onClose={() => setMysteryBanner(false)}
          sx={{ mb: 1.5 }}
        >
          Mystery event (<strong>?</strong>) — no automatic hazard applied.
          Facilitator may discuss or choose a hazard manually.
        </Alert>
      )}

      {!isHazardStage ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Hazards can only be applied during the <strong>Event</strong> stage.
        </Alert>
      ) : limitReached ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Maximum of {MAX_HAZARDS_PER_ROUND} hazards reached for Year{" "}
          {2050 + currentRound}. Proceed to Review.
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

      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        {hazards.map((hazard) => {
          const color = getHazardColor(hazard.id);

          return (
            <Grid item xs={6} key={hazard.id}>
              <Tooltip title={`Apply ${hazard.name} hazard`}>
                <span>
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={controlsDisabled}
                    startIcon={
                      <HazardIcon
                        hazardId={hazard.id}
                        color={color}
                        size={22}
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
                      justifyContent: "flex-start",
                      textTransform: "none",
                    }}
                  >
                    {hazard.name}
                  </Button>
                </span>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

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
