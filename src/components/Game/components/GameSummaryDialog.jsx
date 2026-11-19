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
import StyleIcon from "@mui/icons-material/Style";
import { getPlayerCount } from "../../../game/options.js";
import BarChartsView from "./BarChartsView";
import { buildGameSummary } from "../../../game/summary.js";

export default function GameSummaryDialog({
  open,
  onClose,
  session,
  towns = [],
  roundEventDocs = [],
  roundStats = [],
  townCardPlayDocs = {},
}) {
  if (!session || towns.length === 0) return null;

  const cardPlays = Object.values(townCardPlayDocs).flat();

  const summary = buildGameSummary({
    session,
    towns,
    events: roundEventDocs,
    roundStats,
    cardPlays,
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
            Workshop Reflection: {summary.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              label={`over ${summary.roundsPlayed} ${summary.roundsPlayed === 1 ? "year" : "years"}`}
              color="primary"
              size="small"
            />
            <Chip
              label={`${summary.totalCardsPlayed} Adaptation Cards Played`}
              variant="outlined"
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
        {!session.isActive && <BarChartsView towns={towns} />}
        {/* Highlights */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={summary.hasCompleteImpacts ? 4 : 6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: "100%",
                borderColor: "success.main",
                bgcolor: "rgba(46, 125, 50, 0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <EmojiEventsIcon color="success" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Most resilient town{mostResilientNames.length > 1 ? "s" : ""}
                </Typography>
              </Box>
              <Typography variant="h6" color="success.dark" fontWeight="bold">
                {mostResilientNames.length > 0
                  ? mostResilientNames.join(", ")
                  : "None"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Highest final average resilience
              </Typography>
            </Paper>
          </Grid>

          {summary.hasCompleteImpacts && (
            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  height: "100%",
                  borderColor: "warning.main",
                  bgcolor: "rgba(237, 108, 2, 0.06)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <WarningAmberIcon color="warning" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Most impacted town{mostImpactedNames.length > 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Typography variant="h6" color="warning.dark" fontWeight="bold">
                  {mostImpactedNames.length > 0
                    ? mostImpactedNames.join(", ")
                    : "None"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Greatest total hazard impact
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} md={summary.hasCompleteImpacts ? 4 : 6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: "100%",
                borderColor: "primary.main",
                bgcolor: "rgba(25, 118, 210, 0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <StyleIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Most popular climate adaptation
                </Typography>
              </Box>
              <Typography variant="h6" color="primary.dark" fontWeight="bold">
                {summary.mostPopularCards.length > 0
                  ? summary.mostPopularCards
                      .map((c) => `${c.name} (${c.count}×)`)
                      .join(", ")
                  : "None"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total adaptation cards played: {summary.totalCardsPlayed}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Events Experienced Timeline */}
        {summary.eventsTimeline.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Events experienced
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {summary.eventsTimeline.map((entry) => (
                <Chip
                  key={entry.round}
                  variant="outlined"
                  label={`Year ${entry.year}: ${
                    entry.hazards.length > 0
                      ? entry.hazards
                          .map((h) => h.charAt(0).toUpperCase() + h.slice(1))
                          .join(", ")
                      : "None"
                  }`}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Per-Town Summary Table */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Town</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Average Resilience
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Nature
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Economy
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Society
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Health
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Hazard impact
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Reward for effort
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
                    {row.nesh.nature.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.economy.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.society.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">
                    {row.nesh.health.toFixed(1)}%
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
