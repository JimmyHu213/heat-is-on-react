// src/components/Game/components/GameSummaryDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getPlayerCount } from "../../../game/options.js";
import { buildGameSummary } from "../../../game/summary.js";

export default function GameSummaryDialog({
  open,
  onClose,
  session,
  towns = [],
  roundEventDocs = [],
  roundStats = [],
}) {
  if (!session || towns.length === 0) return null;

  const summary = buildGameSummary({
    session,
    towns,
    events: roundEventDocs,
    roundStats,
  });

  const playerCount = getPlayerCount(session);

  const nameById = (id) =>
    summary.towns.find((t) => t.id === id)?.name || id;

  const mostResilientNames = summary.mostResilient.map(nameById);
  const mostImpactedNames = summary.mostImpacted.map(nameById);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Workshop Summary: {summary.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip
              label={`${summary.roundsPlayed} of ${summary.totalRounds} Rounds Played`}
              color="primary"
              size="small"
            />
            {summary.endedEarly && (
              <Chip label="Ended Early" color="warning" size="small" />
            )}
            {playerCount !== null && (
              <Chip
                label={`${playerCount} Players`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Highlights */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={summary.hasCompleteImpacts ? 6 : 12}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: "success.main",
                bgcolor: "rgba(46, 125, 50, 0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <EmojiEventsIcon color="success" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Most Resilient Town{mostResilientNames.length > 1 ? "s" : ""}
                </Typography>
              </Box>
              <Typography variant="h6" color="success.dark" fontWeight="bold">
                {mostResilientNames.length > 0
                  ? mostResilientNames.join(", ")
                  : "None"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Highest final overall resilience (comparison town excluded)
              </Typography>
            </Paper>
          </Grid>

          {summary.hasCompleteImpacts && (
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: "warning.main",
                  bgcolor: "rgba(237, 108, 2, 0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <WarningAmberIcon color="warning" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Most Impacted Town{mostImpactedNames.length > 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Typography variant="h6" color="warning.dark" fontWeight="bold">
                  {mostImpactedNames.length > 0
                    ? mostImpactedNames.join(", ")
                    : "None"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Greatest total points lost to hazard events (comparison town excluded)
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Per-Town Summary Table */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Town</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Final Resilience
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Nature Avg
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Economy Avg
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Society Avg
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Health Avg
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Weak Segments (≤20)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Event Losses
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Dividends Earned
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Final Budget
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.towns.map((row) => {
              const isMostResilient = summary.mostResilient.includes(row.id);
              const isMostImpacted = summary.mostImpacted.includes(row.id);

              return (
                <TableRow
                  key={row.id}
                  sx={{
                    bgcolor: row.isComparisonTown
                      ? "rgba(0, 0, 0, 0.03)"
                      : "inherit",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {row.name}
                      </Typography>
                      {row.isComparisonTown && (
                        <Chip
                          label="Comparison Town"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {isMostResilient && (
                        <Chip
                          label="Most Resilient"
                          color="success"
                          size="small"
                        />
                      )}
                      {isMostImpacted && (
                        <Chip
                          label="Most Impacted"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {row.resilience.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.nature.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.economy.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.society.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.health.toFixed(1)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        row.weakSegments > 0 ? "error.main" : "text.primary",
                      fontWeight: row.weakSegments > 0 ? "bold" : "normal",
                    }}
                  >
                    {row.weakSegments}
                  </TableCell>
                  <TableCell align="right">
                    {summary.hasCompleteImpacts ? `-${row.eventLoss}` : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "success.main", fontWeight: "bold" }}
                  >
                    +{row.dividends} EP
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {row.effortPoints} EP
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close Summary
        </Button>
      </DialogActions>
    </Dialog>
  );
}
