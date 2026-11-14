// src/components/Game/components/EndEarlyDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@mui/material";
import { calculateDividend } from "../../../game/settlement.js";

export default function EndEarlyDialog({
  open,
  onClose,
  onConfirm,
  currentRound,
  totalRounds = 5,
  towns = [],
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>End Game Early (Round {currentRound} of {totalRounds})</DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ending the game early will settle Round {currentRound} (awarding
          dividends for segments at 100%) and mark the game as completed. This
          action cannot be undone.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Closing Dividend Preview for Round {currentRound}:
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Town</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Current Budget
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Segments at 100%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Dividend
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Final Budget
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {towns.map((town) => {
              const { segments, amount } = calculateDividend(town);
              return (
                <TableRow key={town.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" component="span">
                      {town.name}
                    </Typography>
                    {town.isComparisonTown && (
                      <Chip
                        label="Comparison"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">{town.effortPoints} EP</TableCell>
                  <TableCell align="right">{segments}</TableCell>
                  <TableCell align="right" sx={{ color: "success.main", fontWeight: "bold" }}>
                    +{amount} EP
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {town.effortPoints + amount} EP
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? "Ending Game..." : "Settle Round & End Game"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
