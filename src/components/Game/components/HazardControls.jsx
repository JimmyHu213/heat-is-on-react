import { t } from '../../../i18n';
// src/components/Game/components/HazardControls.jsx
import React, { useState, useRef } from "react";
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import HazardWheel from "./HazardWheel";
import HazardIcon from "../../common/HazardIcon";
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
const HazardControls = ({ onApplyHazard, disabled, currentRound, wheelEnabled = false, onToggleWheel }) => {
  // State for selected hazard and dialog
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const submitting = useRef(false);

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
  const handleConfirmHazard = async () => {
    if (!selectedHazard || disabled || submitting.current) return;
    submitting.current = true;
    try {
      const result = await onApplyHazard(selectedHazard.id);
      if (result) setDialogOpen(false);
    } finally { submitting.current = false; }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{t("Apply Hazard")}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{t("Select a hazard to apply to all towns in the current round.")}</Typography>

      {onToggleWheel && <FormControlLabel control={<Switch checked={wheelEnabled}
        disabled={disabled || spinning} onChange={e => onToggleWheel(e.target.checked)} />} label={t("Digital hazard wheel")} />}
      {wheelEnabled ? <HazardWheel disabled={disabled || spinning} onSelect={handleHazardClick} onSpinningChange={setSpinning} /> :
        <Typography variant="body2" sx={{ mt: 1 }}>{t("Use the physical wheel, then select its result below.")}</Typography>}

      <Grid container spacing={1} sx={{ mt: 1 }}>
        {hazards.map((hazard) => {
          const { icon, color } = getHazardIconAndColor(hazard.id);

          return (
            <Grid size={6} key={hazard.id}>
              <Tooltip title={t("Apply {0} hazard to all towns", [t(hazard.name)])}>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={disabled || spinning}
                  startIcon={<HazardIcon hazardId={hazard.id} color={color} />}
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
                  {t(hazard.name)}
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
      >{t("Note: Applying a hazard will reduce town resilience scores and may trigger penalties if any score is at or below 20.")}</Typography>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={disabled ? undefined : handleCloseDialog}>
        <DialogTitle>{t("Apply {0} Hazard", [t(selectedHazard?.name)])}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("Are you sure you want to apply the {0} hazard to all towns in round {1}?", [t(selectedHazard?.name), currentRound])}
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
                <Typography variant="subtitle2" gutterBottom>{t("Hazard Effects:")}</Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2">{t("Nature: -")}{selectedHazard.nature}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2">{t("Economy: -")}{selectedHazard.economy}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2">{t("Society: -")}{selectedHazard.society}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2">{t("Health: -")}{selectedHazard.health}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="error">
                  <strong>{t("Warning - cascading impacts:")}</strong>{t("If any town's resilience is at or below 20% in any segment, all other segments for that aspect of resilience will receive a -10% penalty.")}</Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={disabled} onClick={handleCloseDialog}>{t("Cancel")}</Button>
          <Button
            disabled={disabled}
            onClick={handleConfirmHazard}
            color="primary"
            variant="contained"
          >{t("Apply Hazard")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HazardControls;
