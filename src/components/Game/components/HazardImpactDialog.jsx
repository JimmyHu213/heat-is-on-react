// src/components/Game/components/HazardImpactDialog.jsx
import React, { useState } from "react";
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
  Box,
  Link,
} from "@mui/material";
import { hazards } from "../../../constants/hazards";
import {
  MEDIA_CONFIG,
  getEventGifPath,
} from "../../../constants/mediaConfig.js";
import HazardIcon from "../../common/HazardIcon";

export default function HazardImpactDialog({
  open,
  onClose,
  impact,
  towns = [],
  hazardId,
}) {
  const [failedGifUrl, setFailedGifUrl] = useState(null);

  if (!impact || impact.length === 0) return null;

  const hazard = hazards.find((h) => h.id === hazardId);
  const hazardName = hazard ? hazard.name : hazardId || "Hazard";
  const gifUrl = getEventGifPath(hazardId);
  const attribution = MEDIA_CONFIG.eventGifAttribution;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <HazardIcon hazardId={hazardId} size={28} />
        <span>Hazard Impact Report: {hazardName}</span>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
            p: 1.5,
            bgcolor: "grey.50",
            borderRadius: 2,
          }}
        >
          {gifUrl && failedGifUrl !== gifUrl ? (
            <Box
              component="img"
              src={gifUrl}
              alt={`${hazardName} event animation`}
              onError={() => setFailedGifUrl(gifUrl)}
              sx={{ width: 120, height: 120, objectFit: "contain" }}
            />
          ) : (
            <HazardIcon hazardId={hazardId} size={72} />
          )}
          {gifUrl && failedGifUrl !== gifUrl && attribution && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              <Link
                href={attribution.url}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
              >
                {attribution.label}
              </Link>
              {" · "}
              <Link
                href={attribution.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
              >
                {attribution.licenseLabel}
              </Link>
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Points lost per dimension in the affected hazard sector and overall town
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
