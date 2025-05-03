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
} from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"; // Bushfire
import FloodIcon from "@mui/icons-material/Flood"; // Flood
import ThunderstormIcon from "@mui/icons-material/Thunderstorm"; // Storm Surge
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Heatwave
import BugReportIcon from "@mui/icons-material/BugReport"; // Biohazard
import EditIcon from "@mui/icons-material/Edit"; // For editing town name
import SaveIcon from "@mui/icons-material/Save"; // For saving town name
import CancelIcon from "@mui/icons-material/Cancel"; // For canceling town name edit

/**
 * Component to display detailed town information with name editing capability
 */
const TownDetailsView = ({ towns, onUpdateTownName }) => {
  const theme = useTheme();
  const [editState, setEditState] = useState({});

  // Define hazard types and their properties
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

  // Define aspects
  const aspects = [
    { id: "nature", name: "Nature" },
    { id: "economy", name: "Economy" },
    { id: "society", name: "Society" },
    { id: "health", name: "Health" },
  ];

  // Start editing a town name
  const handleStartEdit = (townId, currentName) => {
    setEditState({
      ...editState,
      [townId]: {
        isEditing: true,
        name: currentName,
      },
    });
  };

  // Handle town name change
  const handleNameChange = (townId, newName) => {
    setEditState({
      ...editState,
      [townId]: {
        ...editState[townId],
        name: newName,
      },
    });
  };

  // Save updated town name
  const handleSaveName = (townId) => {
    if (onUpdateTownName && editState[townId]) {
      onUpdateTownName(townId, editState[townId].name);
    }

    // Clear edit state
    setEditState({
      ...editState,
      [townId]: {
        isEditing: false,
      },
    });
  };

  // Cancel editing
  const handleCancelEdit = (townId) => {
    setEditState({
      ...editState,
      [townId]: {
        isEditing: false,
      },
    });
  };

  // If no towns, return a message
  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {towns.map((town) => (
        <Grid item xs={12} md={6} key={town.id}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                py: 1.5,
                px: 2,
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {editState[town.id]?.isEditing ? (
                // Edit mode
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <TextField
                    value={editState[town.id].name}
                    onChange={(e) => handleNameChange(town.id, e.target.value)}
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
                // Display mode
                <>
                  <Typography variant="h6" fontWeight="bold">
                    {town.name}
                  </Typography>
                  <Tooltip title="Edit Town Name">
                    <IconButton
                      size="small"
                      onClick={() => handleStartEdit(town.id, town.name)}
                      sx={{ color: "white" }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>ID:</strong> {town.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Budget Points:</strong> {town.effortPoints}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Hazard Resilience Levels
              </Typography>

              {hazardTypes.map((hazard) => (
                <Box key={hazard.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box sx={{ mr: 1, color: hazard.color }}>{hazard.icon}</Box>
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

                          {/* Warning indicator if value is below threshold */}
                          {town[hazard.id][aspect.id] <= 20 && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Critical level! (-10 penalty to all)
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TownDetailsView;
