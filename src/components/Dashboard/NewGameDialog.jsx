// src/components/Dashboard/NewGameDialog.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { formatGameRuleError } from "../../game/errors.js";
import {
  DEFAULT_ROUNDS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  validateGameOptions,
} from "../../game/options.js";

export default function NewGameDialog({ open, onClose, onCreate, loading }) {
  const [name, setName] = useState("New Game");
  const [totalRoundsInput, setTotalRoundsInput] = useState(String(DEFAULT_ROUNDS));
  const [digitalWheelEnabled, setDigitalWheelEnabled] = useState(true);
  const [playerCountInput, setPlayerCountInput] = useState("");
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (open) {
      setName("New Game");
      setTotalRoundsInput(String(DEFAULT_ROUNDS));
      setDigitalWheelEnabled(true);
      setPlayerCountInput("");
      setValidationError(null);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim() || "New Game";
    if (trimmedName.length > 100) {
      setValidationError("Session name must be 100 characters or fewer.");
      return;
    }

    const parsedRounds = Number(totalRoundsInput);
    const trimmedPlayers = playerCountInput.trim();
    const parsedPlayers =
      trimmedPlayers === "" ? null : Number(trimmedPlayers);

    try {
      const validated = validateGameOptions({
        totalRounds: parsedRounds,
        digitalWheelEnabled,
        playerCount: parsedPlayers,
      });
      await onCreate(trimmedName, validated);
    } catch (err) {
      setValidationError(
        formatGameRuleError(err, "Please check your game options.")
      );
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Workshop Game</DialogTitle>
        <DialogContent dividers>
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}

          <TextField
            label="Session Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 100 }}
            helperText="Name to identify this workshop session"
            autoFocus
            disabled={loading}
          />

          <TextField
            label="Number of Rounds"
            type="number"
            value={totalRoundsInput}
            onChange={(e) => setTotalRoundsInput(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: MAX_ROUNDS, step: 1 }}
            helperText={`Choose 1–${MAX_ROUNDS} rounds (default ${DEFAULT_ROUNDS}). Fixed once the game starts.`}
            disabled={loading}
          />

          <TextField
            label="Number of Players (optional)"
            type="number"
            value={playerCountInput}
            onChange={(e) => setPlayerCountInput(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: MAX_PLAYERS, step: 1 }}
            helperText={`Enter 1–${MAX_PLAYERS} participants, or leave blank. Can be updated during the game.`}
            disabled={loading}
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={digitalWheelEnabled}
                  onChange={(e) => setDigitalWheelEnabled(e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Use on-screen hazard wheel"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Turn off if your room uses a physical spinning wheel and you want to select the landed hazard directly. You can change this in the game’s Event dialog.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? "Creating..." : "Create & Open Game"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
