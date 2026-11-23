// src/components/Game/components/GameTable.jsx
import React, { useState } from "react";
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
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";
import { allCards } from "../../../constants/cards";
import { cardEffectiveRounds, overlapsCardPlay } from "../../../game/cards.js";
import HazardIcon from "../../common/HazardIcon";

const sortedCards = [...allCards].sort((a, b) => a.name.localeCompare(b.name));

const GameTable = ({
  towns,
  roundEvents,
  townCardPlays,
  townCardPlayDocs = {},
  currentRound,
  totalRounds = 5,
  onRemoveCardPlay,
  onAddCardPlayAtRound,
  loading = false,
}) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("lg"));
  const tablet = useMediaQuery(theme.breakpoints.up("sm"));
  const yearsPerPage = desktop ? 5 : tablet ? 3 : 1;
  const [selectedYear, setSelectedYear] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [addTarget, setAddTarget] = useState(null);

  const handleOpenAddMenu = (event, townId, round) => {
    setAddAnchorEl(event.currentTarget);
    setAddTarget({ townId, round });
  };

  const handleCloseAddMenu = () => {
    setAddAnchorEl(null);
    setAddTarget(null);
  };

  const handleSelectAddCard = async (cardId) => {
    if (addTarget && onAddCardPlayAtRound) {
      await onAddCardPlayAtRound(addTarget.townId, cardId, addTarget.round);
    }
    handleCloseAddMenu();
  };

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  const years = Array.from({ length: Math.max(1, totalRounds) }, (_, i) => i + 1);
  const year = Math.min(years.length, Math.max(1, selectedYear ?? currentRound));
  const pageStart = Math.floor((year - 1) / yearsPerPage) * yearsPerPage;
  const rounds = years.slice(pageStart, pageStart + yearsPerPage);

  const getHazardIcon = (hazardId) => (
    <HazardIcon hazardId={hazardId} size={18} sx={{ ml: 0.5 }} />
  );

  const getHazardColor = (hazardId) => {
    switch (hazardId) {
      case "bushfire":
        return `${bushfireColor1}20`;
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

  const getCardChipProps = (cardName) => {
    cardName = String(cardName || "");

    if (
      cardName.includes("LANDSCAPING") ||
      cardName.includes("FIRE-RESILIENT") ||
      cardName.includes("BURNING")
    ) {
      return {
        bgcolor: `${bushfireColor1}15`,
        borderColor: bushfireColor1,
        color: "#000000",
      };
    } else if (
      cardName.includes("FLOOD") ||
      cardName.includes("STORMWATER") ||
      cardName.includes("COMMUNITY EDUCATION")
    ) {
      return {
        bgcolor: `${floodColor1}15`,
        borderColor: floodColor1,
        color: "#000000",
      };
    } else if (
      cardName.includes("STORM") ||
      cardName.includes("SEA DEFENSES") ||
      cardName.includes("STILTS")
    ) {
      return {
        bgcolor: `${stormSurgeColor1}15`,
        borderColor: stormSurgeColor1,
        color: "#000000",
      };
    } else if (
      cardName.includes("GREE") ||
      cardName.includes("COOL") ||
      cardName.includes("WHITE ROOFS")
    ) {
      return {
        bgcolor: `${heatwaveColor1}15`,
        borderColor: heatwaveColor1,
        color: "#000000",
      };
    } else if (
      cardName.includes("BIO") ||
      cardName.includes("BUFFER") ||
      cardName.includes("FARMING")
    ) {
      return {
        bgcolor: `${biohazardColor1}15`,
        borderColor: biohazardColor1,
        color: "#000000",
      };
    } else {
      return {
        bgcolor: "rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(0, 0, 0, 0.2)",
        color: "#000000",
      };
    }
  };

  return (
    <Paper sx={{ borderRadius: 2, boxShadow: 1 }}>
      {years.length > yearsPerPage && (
        <Box sx={{ p: 1 }}>
          <TextField select size="small" label="Years shown" value={pageStart + 1}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            slotProps={{ select: { native: true } }}>
            {years.filter((round) => (round - 1) % yearsPerPage === 0).map((start) => {
              const end = Math.min(start + yearsPerPage - 1, years.length);
              return (
                <option key={start} value={start}>
                  {start === end ? 2050 + start : `${2050 + start}–${2050 + end}`}
                </option>
              );
            })}
          </TextField>
        </Box>
      )}
      <Table size="small" aria-label="Game history" sx={{
        tableLayout: "fixed",
        "& .MuiTableCell-root": { px: { xs: 0.75, sm: 1 }, overflowWrap: "anywhere" },
        "& .MuiChip-root": { maxWidth: "100%", height: "auto", minHeight: 24 },
        "& .MuiChip-label": { whiteSpace: "normal", overflowWrap: "anywhere" },
      }}>
        <colgroup>
          <Box component="col" sx={{ width: { xs: "24%", sm: "16%" } }} />
          {rounds.map((round) => <col key={round} />)}
          <Box component="col" sx={{ width: { xs: "24%", sm: "16%" } }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.grey[200] }}>
            <TableCell sx={{ fontWeight: "bold" }}>Town</TableCell>
            {rounds.map((round) => (
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
                  {`Year ${round + 2050}`}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              <Typography variant="subtitle2">Effort Points</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Events Row */}
          <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
            <TableCell sx={{ fontWeight: "bold" }}>
              <Typography variant="subtitle2">Events</Typography>
            </TableCell>
            {rounds.map((round) => {
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
            <TableCell />
          </TableRow>

          {/* Town Rows */}
          {towns.map((town) => (
            <TableRow
              key={town.id}
              sx={{ "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" } }}
            >
              <TableCell>
                <Typography variant="subtitle2">{town.name}</Typography>
              </TableCell>
              {rounds.map((round) => {
                const playDocs = townCardPlayDocs[town.id];
                const docEntries = Array.isArray(playDocs)
                  ? playDocs
                      .map((play) => {
                        const card = allCards.find((c) => c.id === play.cardId);
                        if (!card) return null;
                        const roundsList =
                          play.effectiveRounds ??
                          cardEffectiveRounds(play.playedAtRound, card.duration);
                        if (!roundsList.includes(round)) return null;
                        let displayName = card.name;
                        if (card.duration > 1) {
                          if (round === play.playedAtRound) {
                            displayName = `${card.name} (${card.duration} yrs)`;
                          } else {
                            displayName = `${card.name} (${
                              round - play.playedAtRound + 1
                            }/${card.duration})`;
                          }
                        }
                        return {
                          id: play.id,
                          displayName,
                          isOriginRound: play.playedAtRound === round,
                        };
                      })
                      .filter(Boolean)
                  : null;

                const fallbackCards = townCardPlays[town.id]?.[round] || [];
                const canEditRound =
                  !town.isComparisonTown &&
                  !loading &&
                  round >= 1 &&
                  round <= currentRound;

                return (
                  <TableCell key={round} align="center" sx={{ p: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {docEntries
                        ? docEntries.map((entry) => {
                            const chipProps = getCardChipProps(entry.displayName);
                            return (
                              <Chip
                                key={`${entry.id}-${round}`}
                                label={entry.displayName}
                                size="small"
                                variant="outlined"
                                onDelete={
                                  canEditRound &&
                                  entry.isOriginRound &&
                                  onRemoveCardPlay
                                    ? () => onRemoveCardPlay(entry.id)
                                    : undefined
                                }
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
                          })
                        : fallbackCards.map((cardName, index) => {
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
                      {canEditRound && onAddCardPlayAtRound && (
                        <Tooltip title={`Add card to ${town.name} (Year ${2050 + round})`}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => handleOpenAddMenu(e, town.id, round)}
                            sx={{ p: 0.25 }}
                          >
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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

      <Menu
        anchorEl={addAnchorEl}
        open={Boolean(addAnchorEl)}
        onClose={handleCloseAddMenu}
        PaperProps={{ style: { maxHeight: 320 } }}
      >
        {sortedCards.map((card) => (
          <MenuItem key={card.id} onClick={() => handleSelectAddCard(card.id)}
            disabled={Boolean(addTarget && overlapsCardPlay(townCardPlayDocs[addTarget.townId] || [], card, addTarget.round))}>
            {card.name} ({card.cost} EP)
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default GameTable;
