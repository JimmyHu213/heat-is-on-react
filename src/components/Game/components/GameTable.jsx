// src/components/Game/components/GameTable.jsx
import React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Chip,
  useTheme,
} from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";

/**
 * Component to display a table of game events and cards played
 */
const GameTable = ({ towns, roundEvents, townCardPlays, currentRound }) => {
  const theme = useTheme();

  // If no towns, show a message
  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  // Get hazard icon based on hazard ID
  const getHazardIcon = (hazardId) => {
    switch (hazardId) {
      case "bushfire":
        return <LocalFireDepartmentIcon sx={{ color: bushfireColor1 }} />;
      case "flood":
        return <FloodIcon sx={{ color: floodColor1 }} />;
      case "stormSurge":
        return <ThunderstormIcon sx={{ color: stormSurgeColor1 }} />;
      case "heatwave":
        return <WbSunnyIcon sx={{ color: heatwaveColor1 }} />;
      case "biohazard":
        return <BugReportIcon sx={{ color: biohazardColor1 }} />;
      default:
        return null;
    }
  };

  // Get background color based on hazard ID
  const getHazardColor = (hazardId) => {
    switch (hazardId) {
      case "bushfire":
        return `${bushfireColor1}20`; // 20% opacity
      case "flood":
        return `${floodColor1}20`;
      case "stormSurge":
        return `${stormSurgeColor1}20`;
      case "heatwave":
        return `${heatwaveColor1}20`;
      case "biohazard":
        return `${biohazardColor1}20`;
      default:
        return "transparent";
    }
  };

  // Get chip color based on card name
  const getCardChipProps = (cardName) => {
    // Make sure cardName is a string
    cardName = String(cardName || "");

    // Based on card name, determine type/color
    if (cardName.includes("BUSHFIRE") || cardName.includes("FIRE-RESILIENT")) {
      return {
        bgcolor: `${bushfireColor1}15`,
        borderColor: bushfireColor1,
        color: "#000000", // Black text
      };
    } else if (cardName.includes("FLOOD") || cardName.includes("STORMWATER")) {
      return {
        bgcolor: `${floodColor1}15`,
        borderColor: floodColor1,
        color: "#000000", // Black text
      };
    } else if (
      cardName.includes("STORM") ||
      cardName.includes("SEA DEFENSES") ||
      cardName.includes("BARRIER")
    ) {
      return {
        bgcolor: `${stormSurgeColor1}15`,
        borderColor: stormSurgeColor1,
        color: "#000000", // Black text
      };
    } else if (
      cardName.includes("HEAT") ||
      cardName.includes("COOL") ||
      cardName.includes("WHITE ROOFS")
    ) {
      return {
        bgcolor: `${heatwaveColor1}15`,
        borderColor: heatwaveColor1,
        color: "#000000", // Black text
      };
    } else if (
      cardName.includes("BIO") ||
      cardName.includes("BUFFER") ||
      cardName.includes("FARMING")
    ) {
      return {
        bgcolor: `${biohazardColor1}15`,
        borderColor: biohazardColor1,
        color: "#000000", // Black text
      };
    } else {
      // Default/aspect cards
      return {
        bgcolor: "rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(0, 0, 0, 0.2)",
        color: "#000000", // Black text
      };
    }
  };

  return (
    <Paper sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 1 }}>
      <Table size="medium" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.grey[200] }}>
            <TableCell sx={{ fontWeight: "bold" }}></TableCell>
            {Array.from({ length: 5 }, (_, i) => i + 1).map((round) => (
              <TableCell
                key={round}
                align="center"
                sx={{
                  fontWeight: "bold",
                  bgcolor:
                    round === currentRound
                      ? theme.palette.primary.light
                      : theme.palette.grey[200],
                  color: round === currentRound ? "white" : "inherit",
                }}
              >
                <Typography variant="subtitle2">
                  {round <= currentRound
                    ? `Round ${round}`
                    : `Future Round ${round}`}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              <Typography variant="subtitle2">Budget</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Events Row */}
          <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
            <TableCell sx={{ fontWeight: "bold" }}>
              <Typography variant="subtitle2">Events</Typography>
            </TableCell>
            {Array.from({ length: 5 }, (_, i) => i + 1).map((round) => {
              const hazards = roundEvents[round] || [];

              return (
                <TableCell key={round} align="center" sx={{ p: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: 0.5,
                    }}
                  >
                    {hazards.map((hazardId, index) => (
                      <Chip
                        key={index}
                        icon={getHazardIcon(hazardId)}
                        label={
                          hazardId.charAt(0).toUpperCase() + hazardId.slice(1)
                        }
                        variant="outlined"
                        size="small"
                        sx={{
                          bgcolor: getHazardColor(hazardId),
                          borderColor:
                            hazardId === "bushfire"
                              ? bushfireColor1
                              : hazardId === "flood"
                              ? floodColor1
                              : hazardId === "stormSurge"
                              ? stormSurgeColor1
                              : hazardId === "heatwave"
                              ? heatwaveColor1
                              : hazardId === "biohazard"
                              ? biohazardColor1
                              : "grey.400",
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
              );
            })}
            <TableCell /> {/* Empty cell for budget column */}
          </TableRow>

          {/* Town Rows */}
          {towns
            .filter((town) => !town.isComparisonTown)
            .map((town) => (
              <TableRow
                key={town.id}
                sx={{ "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" } }}
              >
                <TableCell>
                  <Typography variant="subtitle2">{town.name}</Typography>
                </TableCell>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((round) => {
                  const cards = townCardPlays[town.id]?.[round] || [];

                  return (
                    <TableCell key={round} align="center" sx={{ p: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {cards.map((cardName, index) => {
                          const chipProps = getCardChipProps(cardName);

                          return (
                            <Chip
                              key={index}
                              label={cardName}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "0.7rem",
                                height: "auto",
                                py: 0.5,
                                bgcolor: chipProps.bgcolor,
                                borderColor: chipProps.borderColor,
                                color: chipProps.color,
                              }}
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {town.effortPoints}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default GameTable;
