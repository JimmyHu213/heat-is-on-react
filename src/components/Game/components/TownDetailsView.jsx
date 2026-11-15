// src/components/Game/components/TownDetailsView.jsx
import React, { useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MAX_MANUAL_BUDGET } from "../../../game/options.js";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const TownDetailsView = ({ towns, onUpdateTownName, disabled = false }) => {
  const theme = useTheme();
  const [editState, setEditState] = useState({});

  const handleStartEdit = (townId, currentName) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditing: true,
        name: currentName,
      },
    });
  };

  const handleNameChange = (townId, newName) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        name: newName,
      },
    });
  };

  const handleSaveName = (townId) => {
    if (onUpdateTownName && editState[townId]) {
      onUpdateTownName(townId, editState[townId].name);
    }

    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        isEditing: false,
      },
    });
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
    <Grid container spacing={2} flex={1} justifyContent="center">
      {towns.map((town) => {
        const isLockedComparison = Boolean(town.isComparisonTown);

        return (
          <Grid item xs={12} md={6} key={town.id}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 3,
                width: "350px",
                overflow: "hidden",
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <Box
                sx={{
                  bgcolor: isLockedComparison
                    ? "grey.700"
                    : theme.palette.primary.dark,
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
                      width: "100%",
                    }}
                  >
                    <TextField
                      value={editState[town.id].name}
                      onChange={(e) =>
                        handleNameChange(town.id, e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      sx={{
                        flexGrow: 1,
                        mr: 1,
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
                        onClick={() => handleSaveName(town.id)}
                        sx={{ color: "white" }}
                      >
                        <SaveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        onClick={() => handleCancelEdit(town.id)}
                        sx={{ color: "white" }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
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
                          onClick={() => handleStartEdit(town.id, town.name)}
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
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TownDetailsView;
