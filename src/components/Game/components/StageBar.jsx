// src/components/Game/components/StageBar.jsx
import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaidIcon from "@mui/icons-material/Paid";
import FlagIcon from "@mui/icons-material/Flag";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import { getPlayerCount, getTotalRounds, MAX_PLAYERS } from "../../../game/options.js";
import { canChangeStage, MAX_HAZARDS_PER_ROUND } from "../../../game/stages.js";

const STAGE_STEPS = [
  { key: "adaptation", label: "What adaptations will you choose for your town?" },
  { key: "hazard", label: "Will Adaptania face a climate hazard this year?" },
  { key: "review", label: "How resilient is Adaptania now?" },
];

function getActiveStepIndex(currentStage) {
  if (currentStage === "adaptation") return 0;
  if (currentStage === "hazard") return 1;
  if (currentStage === "review") return 2;
  if (currentStage === "complete") return STAGE_STEPS.length;
  return -1;
}

export default function StageBar({
  session,
  currentRound,
  currentStage,
  hazardCountThisRound = 0,
  loading = false,
  onStartGame,
  onChangeStage,
  onOpenDividends,
  onOpenEndEarly,
  onOpenSummary,
  onUpdatePlayerCount,
  onOpenControlsDrawer,
}) {
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState("");
  const [playerError, setPlayerError] = useState(null);

  if (!session) return null;

  const totalRounds = getTotalRounds(session);
  const playerCount = getPlayerCount(session);
  const activeStep = getActiveStepIndex(currentStage);

  const canStepBackToAdapt = canChangeStage(
    currentStage,
    "adaptation",
    hazardCountThisRound
  );
  const canMoveToReview = canChangeStage(
    currentStage,
    "review",
    hazardCountThisRound
  );
  const canStepBackToEvent = canChangeStage(
    currentStage,
    "hazard",
    hazardCountThisRound
  );

  const handleOpenPlayerDialog = () => {
    setPlayerInput(playerCount !== null ? String(playerCount) : "");
    setPlayerError(null);
    setPlayerDialogOpen(true);
  };

  const handleSavePlayerCount = async () => {
    setPlayerError(null);
    const trimmed = playerInput.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (
      parsed !== null &&
      (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PLAYERS)
    ) {
      setPlayerError(
        `Please enter a whole number between 1 and ${MAX_PLAYERS}, or leave blank.`
      );
      return;
    }
    if (onUpdatePlayerCount) {
      const updated = await onUpdatePlayerCount(session.id, parsed);
      if (updated) {
        setPlayerDialogOpen(false);
      }
    } else {
      setPlayerDialogOpen(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {currentStage === "setup"
              ? `Setup (0 of ${totalRounds} rounds)`
              : currentStage === "complete"
              ? `Game Complete (${Math.max(0, currentRound - 1)} of ${totalRounds} rounds)`
              : `Round ${currentRound} of ${totalRounds} · Year ${2050 + currentRound}`}
          </Typography>

          {session.endedEarly && (
            <Chip label="Ended Early" color="warning" size="small" />
          )}

          {session.isActive ? (
            <Tooltip title="Click to set or update participant count">
              <Chip
                icon={<GroupIcon />}
                label={
                  playerCount !== null
                    ? `${playerCount} Players`
                    : "Set Players"
                }
                variant="outlined"
                size="small"
                onClick={handleOpenPlayerDialog}
                clickable
              />
            </Tooltip>
          ) : (
            playerCount !== null && (
              <Chip
                icon={<GroupIcon />}
                label={`${playerCount} Players`}
                variant="outlined"
                size="small"
              />
            )
          )}
        </Box>

        {/* Stage Action Buttons */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          {currentStage === "setup" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={onStartGame}
              disabled={loading}
            >
              Start Game (Round 1)
            </Button>
          )}

          {currentStage === "adaptation" && (
            <>
              {onOpenControlsDrawer && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={onOpenControlsDrawer}
                  disabled={loading}
                >
                  Play Adaptation Cards
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onChangeStage("hazard")}
                disabled={loading}
              >
                Next: Event Stage
              </Button>
            </>
          )}

          {currentStage === "hazard" && (
            <>
              <Tooltip
                title={
                  canStepBackToAdapt
                    ? "Return to Adapt stage"
                    : "Cannot return to Adapt after a hazard has been applied this round"
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => onChangeStage("adaptation")}
                    disabled={loading || !canStepBackToAdapt}
                  >
                    Back to Adapt
                  </Button>
                </span>
              </Tooltip>

              {onOpenControlsDrawer && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={onOpenControlsDrawer}
                  disabled={loading || hazardCountThisRound >= MAX_HAZARDS_PER_ROUND}
                >
                  {session.digitalWheelEnabled === false
                    ? "Select Hazard"
                    : "Open Hazard Wheel"}{" "}
                  ({hazardCountThisRound}/{MAX_HAZARDS_PER_ROUND})
                </Button>
              )}

              <Tooltip
                title={
                  canMoveToReview
                    ? "Proceed to Review stage"
                    : "Apply at least one hazard first"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onChangeStage("review")}
                    disabled={loading || !canMoveToReview}
                  >
                    Next: How resilient is Adaptania now?
                  </Button>
                </span>
              </Tooltip>
            </>
          )}

          {currentStage === "review" && (
            <>
              <Tooltip
                title={
                  canStepBackToEvent
                    ? "Return to Event stage to apply another hazard"
                    : "Maximum 5 hazards reached for this round"
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => onChangeStage("hazard")}
                    disabled={loading || !canStepBackToEvent}
                  >
                    Back to Event
                  </Button>
                </span>
              </Tooltip>

              <Button
                variant="contained"
                color="success"
                startIcon={<PaidIcon />}
                onClick={onOpenDividends}
                disabled={loading}
              >
                {currentRound >= totalRounds
                  ? "Settle Final Round & Reward for effort"
                  : "Settle Round & Reward for effort"}
              </Button>
            </>
          )}

          {session.isActive && currentRound >= 1 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<FlagIcon />}
              onClick={onOpenEndEarly}
              disabled={loading}
            >
              End Game Early
            </Button>
          )}

          {currentStage === "complete" && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AssessmentIcon />}
              onClick={onOpenSummary}
            >
              View Summary
            </Button>
          )}
        </Box>
      </Box>

      {/* Round Stage Stepper */}
      {currentStage !== "setup" && (
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{ pt: 0.5 }}
        >
          {STAGE_STEPS.map((step) => (
            <Step key={step.key}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Edit Player Count Dialog */}
      <Dialog
        open={playerDialogOpen}
        onClose={() => setPlayerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Workshop Player Count</DialogTitle>
        <DialogContent>
          <TextField
            label="Number of Players (1–200)"
            type="number"
            value={playerInput}
            onChange={(e) => {
              setPlayerInput(e.target.value);
              if (playerError) setPlayerError(null);
            }}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: MAX_PLAYERS, step: 1 }}
            error={Boolean(playerError)}
            helperText={playerError || "Leave blank to clear"}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayerDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePlayerCount}
            disabled={loading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
