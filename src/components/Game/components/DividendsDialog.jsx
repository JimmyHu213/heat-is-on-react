// src/components/Game/components/DividendsDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { calculateDividend } from "../../../game/settlement.js";

export default function DividendsDialog({
  open,
  onClose,
  onConfirm,
  towns = [],
  currentRound,
  totalRounds = 5,
  session,
  roundStats = [],
  loading = false,
}) {
  const alreadyAwarded = Boolean(
    (session && session.lastSettlementRound >= currentRound && currentRound > 0) ||
      roundStats.some((s) => s.roundNumber === currentRound)
  );

  const isFinalRound = currentRound >= totalRounds;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Round {currentRound} Dividends & Settlement
      </DialogTitle>
      <DialogContent dividers>
        {alreadyAwarded ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Dividends for Round {currentRound} have already been awarded.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Each town earns <strong>5 Effort Points (EP)</strong> for every
            resilience segment at <strong>100%</strong> at the close of Round{" "}
            {currentRound}. Confirming awards these dividends and{" "}
            {isFinalRound
              ? "completes the game."
              : `advances to Round ${currentRound + 1}.`}
          </Typography>
        )}

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
                Dividend Earned
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                New Budget
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
                  <TableCell align="right">{segments} / 20</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color: amount > 0 ? "success.main" : "text.secondary",
                    }}
                  >
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
          {alreadyAwarded ? "Close" : "Cancel"}
        </Button>
        {!alreadyAwarded && (
          <Button
            onClick={onConfirm}
            variant="contained"
            color="success"
            disabled={loading || alreadyAwarded}
          >
            {loading
              ? "Settling..."
              : isFinalRound
              ? "Award Dividends & Finish Game"
              : `Confirm & Start Round ${currentRound + 1}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
