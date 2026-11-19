// src/components/Game/components/TownDetailsView.jsx
import React, { useState } from "react";
import {
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { hazards } from "../../../constants/hazards.js";
import { DEFAULT_TOWN_LABEL_COLOR, TOWN_LABEL_COLORS } from "../../../constants/townLabelColors.js";
import { ASPECTS, overallResilience } from "../../../game/scores.js";
import { MAX_MANUAL_BUDGET } from "../../../game/options.js";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const TownDetailsView = ({ towns, onUpdateTownName, disabled = false }) => {
  const theme = useTheme();
  const [editState, setEditState] = useState({});

  const handleStartEdit = (town) => {
    setEditState((previous) => ({
      ...previous,
      [town.id]: {
        ...previous[town.id],
        isEditing: true,
        name: town.name,
        labelColor: town.labelColor ?? DEFAULT_TOWN_LABEL_COLOR,
      },
    }));
  };

  const updateNameDraft = (townId, changes) => {
    setEditState((previous) => ({
      ...previous,
      [townId]: { ...previous[townId], ...changes },
    }));
  };

  const handleSaveName = async (town) => {
    const draft = editState[town.id];
    if (!onUpdateTownName || !draft?.name.trim() || draft.savingName) return;
    const changes = { ...town, name: draft.name.trim() };
    if (draft.labelColor !== (town.labelColor ?? DEFAULT_TOWN_LABEL_COLOR)) {
      changes.labelColor = draft.labelColor;
    }
    updateNameDraft(town.id, { savingName: true });
    const saved = await onUpdateTownName(town.id, changes.name, changes);
    updateNameDraft(town.id, { savingName: false, isEditing: !saved });
  };

  const handleCancelEdit = (townId) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditing: false,
      },
    });
  };

  const handleStartEditBudget = (townId, currentPoints) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditingBudget: true,
        budgetPoints: currentPoints,
      },
    });
  };

  const handleBudgetChange = (townId, newPoints) => {
    const points = Math.max(
      0,
      Math.min(MAX_MANUAL_BUDGET, parseInt(newPoints, 10) || 0)
    );

    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        budgetPoints: points,
      },
    });
  };

  const handleSaveBudget = (townId) => {
    if (onUpdateTownName && editState[townId]) {
      const town = towns.find((t) => t.id === townId);
      if (town) {
        const updatedTown = {
          ...town,
          effortPoints: editState[townId].budgetPoints,
        };
        onUpdateTownName(townId, updatedTown.name, updatedTown);
      }
    }

    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditingBudget: false,
      },
    });
  };

  const handleCancelEditBudget = (townId) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditingBudget: false,
      },
    });
  };

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
      gap: 2,
      alignItems: "start",
    }}>
      {towns.map((town) => {
        const isLockedComparison = Boolean(town.isComparisonTown);
        const draft = editState[town.id];
        const labelColor = isLockedComparison
          ? theme.palette.grey[700]
          : town.labelColor ?? DEFAULT_TOWN_LABEL_COLOR;

        return (
          <Card
            key={town.id}
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              minWidth: 0,
              overflow: "hidden",
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: labelColor,
                py: 1.5,
                px: 2,
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {editState[town.id]?.isEditing && !isLockedComparison ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <TextField
                    aria-label="Town name"
                    value={draft.name}
                    onChange={(e) => updateNameDraft(town.id, { name: e.target.value })}
                    disabled={draft.savingName}
                    slotProps={{ htmlInput: { maxLength: 80, "aria-label": "Town name" } }}
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: "1 1 55%",
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover fieldset": {
                          borderColor: "white",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "white",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "white",
                      },
                    }}
                    autoFocus
                  />
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      aria-label="Save town details"
                      onClick={() => handleSaveName(town)}
                      disabled={draft.savingName || !draft.name.trim()}
                      sx={{ color: "white" }}
                    >
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      aria-label="Cancel town edits"
                      onClick={() => handleCancelEdit(town.id)}
                      disabled={draft.savingName}
                      sx={{ color: "white" }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                  <TextField
                    select
                    size="small"
                    label="Radar label color"
                    value={draft.labelColor}
                    disabled={draft.savingName}
                    onChange={(event) => updateNameDraft(town.id, { labelColor: event.target.value })}
                    sx={{ width: "100%", bgcolor: "white", borderRadius: 1 }}
                  >
                    {TOWN_LABEL_COLORS.map(({ name, value }) => (
                      <MenuItem key={value} value={value} sx={{ gap: 1 }}>
                        <Box component="span" sx={{
                          display: "inline-block", width: 14, height: 14,
                          bgcolor: value, borderRadius: "50%", verticalAlign: "-2px", mr: 1,
                        }} />
                        {name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" fontWeight="bold">
                    {town.name}
                  </Typography>
                  {!isLockedComparison && (
                    <Tooltip title="Edit Town Name">
                      <IconButton
                        size="small"
                        onClick={() => handleStartEdit(town)}
                        sx={{ color: "white" }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>

            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                {editState[town.id]?.isEditingBudget && !isLockedComparison ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <AccountBalanceWalletIcon
                      sx={{ mr: 1, color: theme.palette.primary.main }}
                    />
                    <TextField
                      value={editState[town.id].budgetPoints}
                      onChange={(e) =>
                        handleBudgetChange(town.id, e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      type="number"
                      label={`Effort Points (0–${MAX_MANUAL_BUDGET})`}
                      InputProps={{
                        inputProps: { min: 0, max: MAX_MANUAL_BUDGET },
                      }}
                      sx={{
                        flexGrow: 1,
                        mr: 1,
                      }}
                      autoFocus
                    />
                    <Tooltip title="Save">
                      <IconButton
                        size="small"
                        onClick={() => handleSaveBudget(town.id)}
                        color="primary"
                      >
                        <SaveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        onClick={() => handleCancelEditBudget(town.id)}
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AccountBalanceWalletIcon
                        sx={{ mr: 1, color: theme.palette.primary.main }}
                      />
                      <Typography variant="body2">
                        <strong>Effort Points:</strong> {town.effortPoints}
                      </Typography>
                    </Box>
                    {!isLockedComparison && !disabled && (
                      <Tooltip title="Edit Effort Points (0–999)">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleStartEditBudget(town.id, town.effortPoints)
                          }
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
              </Box>
              <Typography component="h3" variant="subtitle2" fontWeight={700} gutterBottom>
                Overall resilience: {overallResilience(town).toFixed(0)}%
              </Typography>
              <Table aria-label={`${town.name} resilience by hazard`} size="small" sx={{
                "& th, & td": { px: 0.5, fontSize: "0.75rem" },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Hazard</TableCell>
                    {ASPECTS.map((aspect) => (
                      <TableCell key={aspect} align="right" aria-label={aspect} title={aspect}>
                        {aspect[0].toUpperCase()}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hazards.map((hazard) => (
                    <TableRow key={hazard.id}>
                      <TableCell component="th" scope="row">{hazard.name}</TableCell>
                      {ASPECTS.map((aspect) => (
                        <TableCell key={aspect} align="right">{town[hazard.id]?.[aspect] ?? "–"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default TownDetailsView;
