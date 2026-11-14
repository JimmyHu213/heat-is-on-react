// src/components/Game/components/TownDetailsView.jsx
import React, { useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  LinearProgress,
  useTheme,
  TextField,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";
import { MAX_MANUAL_BUDGET } from "../../../game/options.js";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockIcon from "@mui/icons-material/Lock";

const TownDetailsView = ({ towns, onUpdateTownName, disabled = false }) => {
  const theme = useTheme();
  const [editState, setEditState] = useState({});

  const hazardTypes = [
    {
      id: "bushfire",
      name: "Bushfire",
      color: bushfireColor1,
      icon: <LocalFireDepartmentIcon />,
    },
    { id: "flood", name: "Flood", color: floodColor1, icon: <FloodIcon /> },
    {
      id: "stormSurge",
      name: "Storm Surge",
      color: stormSurgeColor1,
      icon: <ThunderstormIcon />,
    },
    {
      id: "heatwave",
      name: "Heatwave",
      color: heatwaveColor1,
      icon: <WbSunnyIcon />,
    },
    {
      id: "biohazard",
      name: "Biohazard",
      color: biohazardColor1,
      icon: <BugReportIcon />,
    },
  ];

  const aspects = [
    { id: "nature", name: "Nature" },
    { id: "economy", name: "Economy" },
    { id: "society", name: "Society" },
    { id: "health", name: "Health" },
  ];

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
                    {isLockedComparison ? (
                      <Chip
                        icon={<LockIcon sx={{ color: "white !important" }} />}
                        label="Comparison (Locked)"
                        size="small"
                        sx={{
                          color: "white",
                          borderColor: "rgba(255,255,255,0.6)",
                        }}
                        variant="outlined"
                      />
                    ) : (
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
                        label={`Budget Points (0–${MAX_MANUAL_BUDGET})`}
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
                          <strong>Budget Points:</strong> {town.effortPoints}
                        </Typography>
                      </Box>
                      {!isLockedComparison && !disabled && (
                        <Tooltip title="Edit Budget Points (0–999)">
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

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Hazard Resilience Levels
                </Typography>

                {hazardTypes.map((hazard) => (
                  <Box key={hazard.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Box sx={{ mr: 1, color: hazard.color }}>
                        {hazard.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {hazard.name}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      {aspects.map((aspect) => (
                        <Grid item xs={6} key={aspect.id}>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" gutterBottom>
                              {aspect.name}: {town[hazard.id][aspect.id]}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={town[hazard.id][aspect.id]}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "rgba(0,0,0,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: hazard.color,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TownDetailsView;
