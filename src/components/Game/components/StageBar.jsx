// src/components/Game/components/StageBar.jsx
import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
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
import PaidIcon from "@mui/icons-material/Paid";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import { getPlayerCount, getTotalRounds, MAX_PLAYERS } from "../../../game/options.js";

const STAGE_STEPS = [
  { key: "adaptation", label: "What adaptations will you choose for your town?" },
  { key: "hazard", label: "Will Adaptania face a climate hazard this year?" },
  { key: "review", label: "How resilient is Adaptania now?" },
];

export default function StageBar({
  session,
  currentRound,
  currentStage,
  eventLimitReached,
  loading = false,
  onStartGame,
  onChangeStage,
  onOpenCards,
  onOpenEvent,
  onSettleRound,
  onOpenSummary,
  onUpdatePlayerCount,
}) {
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState("");
  const [playerError, setPlayerError] = useState(null);

  if (!session) return null;

  const totalRounds = getTotalRounds(session);
  const playerCount = getPlayerCount(session);
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
        p: 1,
        mb: 0.75,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
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

      {currentStage === "setup" ? (
        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={onStartGame} disabled={loading}>
          Start Game (Round 1)
        </Button>
      ) : currentStage === "complete" ? (
        <Button variant="contained" startIcon={<AssessmentIcon />} onClick={onOpenSummary}>
          View Summary
        </Button>
      ) : (
        <Box component="ol" aria-label="Round stages" sx={{ m: 0, p: 0, listStyle: "none" }}>
          {STAGE_STEPS.map(({ key, label }, index) => {
            const active = key === currentStage;
            return (
              <Box component="li" key={key} aria-current={active ? "step" : undefined}
                sx={{ px: 1.25, py: 1, borderLeft: 3, borderColor: active ? "primary.main" : "divider" }}>
                <Typography variant="body2" fontWeight={active ? 700 : 400}
                  color={active ? "text.primary" : "text.secondary"}>
                  {label}
                </Typography>
                {active && (
                  <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {key === "review" ? (
                      <Button size="small" variant="contained" color="success" startIcon={<PaidIcon />}
                        onClick={onSettleRound} disabled={loading}>
                        {currentRound >= totalRounds ? "Settle & View Summary" : "Settle & Start Next Year"}
                      </Button>
                    ) : (
                      <>
                        <Button size="small" variant="contained"
                          onClick={key === "adaptation" ? onOpenCards : onOpenEvent}
                          disabled={loading || (key === "hazard" && eventLimitReached)}>
                          {key === "adaptation" ? "Now – Play Cards" : "Now – Event"}
                        </Button>
                        <Button size="small" variant="outlined" endIcon={<ArrowForwardIcon />}
                          onClick={() => onChangeStage(STAGE_STEPS[index + 1].key)} disabled={loading}>
                          Next
                        </Button>
                      </>
                    )}
                    {index > 0 && (
                      <Button size="small" onClick={() => onChangeStage(STAGE_STEPS[index - 1].key)}
                        disabled={loading}>
                        Back
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
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
