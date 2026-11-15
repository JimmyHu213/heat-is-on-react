// src/components/Game/components/HazardControls.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import HazardWheel from "./HazardWheel";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";

const HazardControls = ({
  onApplyHazard,
  disabled,
  currentRound,
  currentStage = "hazard",
  digitalWheelEnabled = true,
  hazardCountThisRound = 0,
}) => {
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isHazardStage = currentStage === "hazard";
  const limitReached = hazardCountThisRound >= MAX_HAZARDS_PER_ROUND;
  const controlsDisabled = disabled || !isHazardStage || limitReached;

  const getHazardIconAndColor = (hazardId) => {
    switch (hazardId) {
      case "bushfire":
        return { icon: <LocalFireDepartmentIcon />, color: bushfireColor1 };
      case "flood":
        return { icon: <FloodIcon />, color: floodColor1 };
      case "stormSurge":
        return { icon: <ThunderstormIcon />, color: stormSurgeColor1 };
      case "heatwave":
        return { icon: <WbSunnyIcon />, color: heatwaveColor1 };
      case "biohazard":
        return { icon: <BugReportIcon />, color: biohazardColor1 };
      default:
        return { icon: null, color: "grey.500" };
    }
  };

  const handleHazardSelect = (hazard) => {
    setSelectedHazard(hazard);
    setDialogOpen(true);
  };

  const handleConfirmHazard = () => {
    if (selectedHazard) {
      onApplyHazard(selectedHazard.id);
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
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
          2. Event Stage: Apply Hazard
        </Typography>
        <Chip
          label={`${hazardCountThisRound} / ${MAX_HAZARDS_PER_ROUND} this round`}
          size="small"
          color={hazardCountThisRound > 0 ? "warning" : "default"}
        />
      </Box>

      {!isHazardStage ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Hazards can only be applied during the <strong>Event</strong> stage.
        </Alert>
      ) : limitReached ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Maximum of {MAX_HAZARDS_PER_ROUND} hazards reached for Round {currentRound}. Proceed to Review.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {digitalWheelEnabled !== false
            ? "Spin the wheel to randomly select a hazard, or choose one below."
            : "Select the hazard landed on your physical wheel to apply to all towns."}
        </Typography>
      )}

      {digitalWheelEnabled !== false && (
        <HazardWheel
          hazards={hazards}
          disabled={controlsDisabled}
          onSelectHazard={handleHazardSelect}
        />
      )}

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {digitalWheelEnabled !== false ? "Or select hazard manually:" : "Select hazard:"}
      </Typography>

      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        {hazards.map((hazard) => {
          const { icon, color } = getHazardIconAndColor(hazard.id);

          return (
            <Grid item xs={6} key={hazard.id}>
              <Tooltip title={`Select ${hazard.name} hazard`}>
                <span>
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={controlsDisabled}
                    startIcon={icon}
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
        Note: Applying a hazard reduces town resilience scores and triggers a -10
        penalty across all hazards for any aspect already at or below 20.
      </Typography>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirm {selectedHazard?.name} Hazard</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apply the <strong>{selectedHazard?.name}</strong> hazard to all 6 towns in
            Round {currentRound}?
          </DialogContentText>

          {selectedHazard && (
            <Card
              variant="outlined"
              sx={{
                mt: 2,
                borderColor: getHazardIconAndColor(selectedHazard.id).color,
                borderWidth: 5,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Hazard Effects:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Nature: -{selectedHazard.nature}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Economy: -{selectedHazard.economy}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Society: -{selectedHazard.society}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Health: -{selectedHazard.health}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="error">
                  <strong>Warning - cascading impacts:</strong> Any town with a
                  segment at or below 20% in an aspect receives a -10% penalty to
                  that aspect across all hazard types before this hazard hits.
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmHazard}
            color="warning"
            variant="contained"
            disabled={controlsDisabled}
          >
            Confirm & Apply Hazard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HazardControls;
