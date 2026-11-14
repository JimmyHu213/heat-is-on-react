// src/components/Game/components/HazardImpactDialog.jsx
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
  Chip,
} from "@mui/material";
import { hazards } from "../../../constants/hazards";

export default function HazardImpactDialog({
  open,
  onClose,
  impact,
  towns = [],
  hazardId,
}) {
  if (!impact || impact.length === 0) return null;

  const hazard = hazards.find((h) => h.id === hazardId);
  const hazardName = hazard ? hazard.name : hazardId || "Hazard";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Hazard Impact Report: {hazardName}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Points lost per dimension (summed across all hazard types, including any
          cascading penalties for segments at or below 20%) and overall town
          resilience before and after the event.
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Town</TableCell>
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
                Total Lost
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Overall Resilience
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {impact.map((item) => {
              const town = towns.find((t) => t.id === item.townId);
              const townName = town?.name || item.townId;
              const isComparison = Boolean(town?.isComparisonTown);

              return (
                <TableRow key={item.townId}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" component="span">
                      {townName}
                    </Typography>
                    {isComparison && (
                      <Chip
                        label="Comparison"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    -{item.aspectLoss.nature}
                  </TableCell>
                  <TableCell align="right">
                    -{item.aspectLoss.economy}
                  </TableCell>
                  <TableCell align="right">
                    -{item.aspectLoss.society}
                  </TableCell>
                  <TableCell align="right">
                    -{item.aspectLoss.health}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", color: "error.main" }}
                  >
                    -{item.loss}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {item.before.toFixed(1)}% → {item.after.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
