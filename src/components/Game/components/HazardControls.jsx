// src/components/Game/components/HazardControls.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert,
  FormControlLabel,
  Switch,
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
import HazardMedia from "./HazardMedia";
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
  onWheelEnabledChange,
  hazardCountThisRound = 0,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
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
      </Box>

      <FormControlLabel
        label="Use on-screen hazard wheel"
        control={<Switch checked={digitalWheelEnabled} disabled={disabled || isSpinning}
          onChange={(event) => onWheelEnabledChange(event.target.checked)} />}
      />

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
          isSpinning={isSpinning}
          onSpinningChange={setIsSpinning}
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
                  disabled={controlsDisabled || isSpinning}
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
        <Button size="small" variant="outlined" disabled={controlsDisabled || isSpinning}
          onClick={() => setMysterySelected(true)}>
          Mystery (?)
        </Button>
      </Box>

      {mysterySelected && (
        <Dialog open onClose={() => setMysterySelected(false)} maxWidth="md" fullWidth aria-labelledby="mystery-title">
          <DialogTitle id="mystery-title">Mystery</DialogTitle>
          <DialogContent>
            <HazardMedia hazard={{ id: "mystery", name: "Mystery" }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMysterySelected(false)}>Close</Button>
            {onNext && <Button variant="contained" disabled={disabled} onClick={onNext}>Next</Button>}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default HazardControls;
