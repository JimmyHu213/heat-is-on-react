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
} from "@mui/material";
import { hazards } from "../../../constants/hazards";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"; // Bushfire
import FloodIcon from "@mui/icons-material/Flood"; // Flood
import ThunderstormIcon from "@mui/icons-material/Thunderstorm"; // Storm Surge
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Heatwave
import BugReportIcon from "@mui/icons-material/BugReport"; // Biohazard

/**
 * Component for hazard control buttons
 */
const HazardControls = ({ onApplyHazard, disabled, currentRound }) => {
  // State for selected hazard and dialog
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get icon and color for a hazard
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

  // Handle click on hazard button
  const handleHazardClick = (hazard) => {
    setSelectedHazard(hazard);
    setDialogOpen(true);
  };

  // Handle confirm applying hazard
  const handleConfirmHazard = () => {
    if (selectedHazard) {
      onApplyHazard(selectedHazard.id);
    }
    setDialogOpen(false);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Apply Hazard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Select a hazard to apply to all towns in the current round.
      </Typography>

      <Grid container spacing={1} sx={{ mt: 1 }}>
        {hazards.map((hazard) => {
          const { icon, color } = getHazardIconAndColor(hazard.id);

          return (
            <Grid item xs={6} key={hazard.id}>
              <Tooltip title={`Apply ${hazard.name} hazard to all towns`}>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={disabled}
                  startIcon={icon}
                  onClick={() => handleHazardClick(hazard)}
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
        Note: Applying a hazard will reduce town resilience scores and may
        trigger penalties if any score drops below 20.
      </Typography>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Apply {selectedHazard?.name} Hazard</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to apply the {selectedHazard?.name} hazard to
            all towns in round {currentRound}?
          </DialogContentText>

          {selectedHazard && (
            <Card variant="outlined" sx={{ mt: 2 }}>
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
                  Warning: If any town's resilience drops below 20 points in any
                  category, all other categories will receive a -10 point
                  penalty.
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmHazard}
            color="primary"
            variant="contained"
          >
            Apply Hazard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HazardControls;
